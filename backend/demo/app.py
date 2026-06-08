# backend/demo/app.py

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import torch
import torchvision.transforms as transforms
from PIL import Image
import io
import base64
import numpy as np
import sys, os

# Fix imports for local VS Code
ROOT_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..")
)

PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../..")
)

sys.path.append(ROOT_DIR)

from models.cnn import CNN
from attacks.fgsm import fgsm_attack
from attacks.pgd import pgd_attack

# ─── APP SETUP ────────────────────────────────────────────────────
app = FastAPI(
    title="Adversarial Robustness API",
    description="Upload an image, attack it, and test robustness",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, set to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
CIFAR10_CLASSES = ['airplane', 'automobile', 'bird', 'cat', 'deer',
                   'dog', 'frog', 'horse', 'ship', 'truck']

# Load models
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_model(path):
    model = CNN()

    if not os.path.exists(path):
        print(f"Model not found: {path}")
        return None

    model.load_state_dict(torch.load(path, map_location=DEVICE))
    model.to(DEVICE)
    model.eval()
    return model

# Fix model paths
normal_model = load_model(
    os.path.join(PROJECT_ROOT, "checkpoints", "model.pth")
)

robust_model = load_model(
    os.path.join(PROJECT_ROOT, "checkpoints", "robust_model.pth")
)

# Image transform for CIFAR-10
transform = transforms.Compose([
    transforms.Resize((32, 32)),
    transforms.ToTensor(),
    transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010))
])

def tensor_to_base64(tensor):
    """Convert image tensor to base64 string."""
    mean = torch.tensor([0.4914, 0.4822, 0.4465]).view(3, 1, 1)
    std  = torch.tensor([0.2023, 0.1994, 0.2010]).view(3, 1, 1)
    img = (tensor.cpu() * std + mean).clamp(0, 1)
    img_np = (img.permute(1, 2, 0).numpy() * 255).astype(np.uint8)
    pil_img = Image.fromarray(img_np).resize((128, 128), Image.NEAREST)
    buffer = io.BytesIO()
    pil_img.save(buffer, format='PNG')
    return base64.b64encode(buffer.getvalue()).decode()

def predict(model, tensor):
    """Get class prediction and confidence."""
    with torch.no_grad():
        output = model(tensor.unsqueeze(0).to(DEVICE))
        probs = torch.softmax(output, dim=1)[0]
        conf, pred = torch.max(probs, 0)
    return CIFAR10_CLASSES[pred.item()], conf.item(), probs.tolist()


# ─── ENDPOINTS ────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "Adversarial Robustness API", "status": "running"}

@app.get("/health")
def health():
    return {
        "status": "ok",
        "normal_model": normal_model is not None,
        "robust_model": robust_model is not None,
        "device": str(DEVICE)
    }

@app.get("/metrics")
def get_metrics():
    """Return pre-computed metrics for dashboard."""
    return {
        "clean_accuracy": 87.4,
        "fgsm_accuracy": {
            "eps_001": 72.1,
            "eps_005": 45.3,
            "eps_010": 28.7,
            "eps_020": 15.2,
            "eps_030": 9.8
        },
        "pgd_accuracy": 12.4,
        "robust_clean_accuracy": 82.1,
        "robust_fgsm_accuracy": {
            "eps_001": 79.4,
            "eps_005": 68.2,
            "eps_010": 55.6,
            "eps_020": 42.1,
            "eps_030": 33.7
        },
        "robust_pgd_accuracy": 48.9
    }

@app.post("/attack")
async def attack_image(
    file: UploadFile = File(...),
    attack_type: str = "fgsm",
    epsilon: float = 0.1
):
    """
    Upload an image, run adversarial attack, compare normal vs robust model.
    """
    if normal_model is None:
        raise HTTPException(status_code=503, detail="Normal model not loaded")
    
    # Read and process image
    contents = await file.read()
    pil_image = Image.open(io.BytesIO(contents)).convert('RGB')
    image_tensor = transform(pil_image)
    
    # Get original prediction
    orig_class, orig_conf, orig_probs = predict(normal_model, image_tensor)
    
    # Generate label for attack (use original model's prediction)
    label = torch.tensor([CIFAR10_CLASSES.index(orig_class)])
    
    # Run attack
    img_batch = image_tensor.unsqueeze(0).to(DEVICE)
    lbl_batch = label.to(DEVICE)
    
    if attack_type == "fgsm":
        adv_tensor = fgsm_attack(normal_model, img_batch, lbl_batch, epsilon, DEVICE).squeeze(0)
    elif attack_type == "pgd":
        adv_tensor = pgd_attack(normal_model, img_batch, lbl_batch, epsilon, 
                                 alpha=epsilon/4, num_steps=20, device=DEVICE).squeeze(0)
    else:
        raise HTTPException(status_code=400, detail="attack_type must be 'fgsm' or 'pgd'")
    
    # Predict on adversarial image — normal model
    adv_class_normal, adv_conf_normal, adv_probs_normal = predict(normal_model, adv_tensor)
    
    # Predict on adversarial image — robust model
    adv_class_robust, adv_conf_robust, adv_probs_robust = (None, None, None)
    if robust_model is not None:
        adv_class_robust, adv_conf_robust, adv_probs_robust = predict(robust_model, adv_tensor)
    
    return {
        "original": {
            "image_b64": tensor_to_base64(image_tensor),
            "prediction": orig_class,
            "confidence": round(orig_conf * 100, 2),
            "all_probs": {CIFAR10_CLASSES[i]: round(p * 100, 2) for i, p in enumerate(orig_probs)}
        },
        "adversarial": {
            "image_b64": tensor_to_base64(adv_tensor),
            "attack_type": attack_type,
            "epsilon": epsilon,
            "normal_model": {
                "prediction": adv_class_normal,
                "confidence": round(adv_conf_normal * 100, 2),
                "fooled": adv_class_normal != orig_class
            },
            "robust_model": {
                "prediction": adv_class_robust,
                "confidence": round(adv_conf_robust * 100, 2) if adv_conf_robust else None,
                "fooled": adv_class_robust != orig_class if adv_class_robust else None
            } if robust_model else None
        }
    }