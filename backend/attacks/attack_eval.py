import torch
import torchvision
import torchvision.transforms as transforms
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import os
import sys

# IMPORTANT FIX FOR LOCAL + COLAB
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.models.cnn import CNN
from backend.attacks.fgsm import fgsm_attack
from backend.attacks.pgd import pgd_attack, evaluate_pgd
from backend.attacks.fgsm_eval import evaluate_fgsm
from backend.defense.adv_training import evaluate_clean


# ─── CONFIGURATION ────────────────────────────────────────────────
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
EPSILONS = [0.0, 0.01, 0.05, 0.1, 0.2, 0.3]
BATCH_SIZE = 128
NORMAL_MODEL_PATH = 'checkpoints/model.pth'
ROBUST_MODEL_PATH = 'checkpoints/robust_model.pth'
SAMPLES_DIR = 'saved_adversarial_samples'
os.makedirs(SAMPLES_DIR, exist_ok=True)

CIFAR10_CLASSES = ['airplane', 'automobile', 'bird', 'cat', 'deer',
                   'dog', 'frog', 'horse', 'ship', 'truck']


# ─── LOAD DATA ────────────────────────────────────────────────────
def get_test_loader():
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010))
    ])
    testset = torchvision.datasets.CIFAR10(root='./data', train=False, download=True, transform=transform)
    return torch.utils.data.DataLoader(testset, batch_size=BATCH_SIZE, shuffle=False, num_workers=2)


# ─── LOAD MODEL ───────────────────────────────────────────────────
def load_model(path):
    model = CNN()
    model.load_state_dict(torch.load(path, map_location=DEVICE))
    model.to(DEVICE)
    model.eval()
    return model


# ─── SAVE ADVERSARIAL SAMPLE IMAGES ──────────────────────────────
def save_sample_images(normal_model, test_loader, epsilon=0.1):
    """Save 5 original + adversarial image pairs for report."""
    print("\nSaving adversarial sample images...")
    
    images, labels = next(iter(test_loader))
    images = images[:5].to(DEVICE)
    labels = labels[:5].to(DEVICE)
    
    adv_images_fgsm = fgsm_attack(normal_model, images, labels, epsilon, DEVICE)
    adv_images_pgd  = pgd_attack(normal_model, images, labels, epsilon, alpha=0.01, num_steps=20, device=DEVICE)
    
    def denorm(tensor):
        mean = torch.tensor([0.4914, 0.4822, 0.4465]).view(3,1,1)
        std  = torch.tensor([0.2023, 0.1994, 0.2010]).view(3,1,1)
        return torch.clamp(tensor.cpu() * std + mean, 0, 1)
    
    fig, axes = plt.subplots(5, 3, figsize=(10, 17))
    fig.patch.set_facecolor('#0f172a')
    
    for i in range(5):
        orig = denorm(images[i]).permute(1,2,0).numpy()
        fgsm = denorm(adv_images_fgsm[i]).permute(1,2,0).numpy()
        pgd  = denorm(adv_images_pgd[i]).permute(1,2,0).numpy()
        
        for ax, img, title in zip(axes[i], [orig, fgsm, pgd],
                                   ['Original', f'FGSM ε={epsilon}', f'PGD ε={epsilon}']):
            ax.imshow(img)
            ax.set_title(f'{title}\n{CIFAR10_CLASSES[labels[i].item()]}', color='white', fontsize=9)
            ax.axis('off')
    
    plt.tight_layout()
    plt.savefig(f'{SAMPLES_DIR}/adversarial_comparison.png', dpi=150, bbox_inches='tight',
                facecolor='#0f172a')
    plt.close()
    print(f"  Saved: {SAMPLES_DIR}/adversarial_comparison.png")


# ─── GENERATE ACCURACY vs EPSILON PLOT ───────────────────────────
def plot_epsilon_accuracy(normal_results, robust_results):
    fig, ax = plt.subplots(figsize=(10, 6))
    fig.patch.set_facecolor('#0f172a')
    ax.set_facecolor('#1e293b')
    
    epsilons = list(normal_results.keys())
    normal_accs = list(normal_results.values())
    robust_accs = list(robust_results.values())
    
    ax.plot(epsilons, normal_accs, 'o-', color='#ef4444', linewidth=2, markersize=8, label='Normal Model')
    ax.plot(epsilons, robust_accs, 's-', color='#22c55e', linewidth=2, markersize=8, label='Robust Model (Adv. Trained)')
    
    ax.set_xlabel('Epsilon (Attack Strength)', color='white', fontsize=12)
    ax.set_ylabel('Accuracy (%)', color='white', fontsize=12)
    ax.set_title('Accuracy vs. Epsilon (FGSM Attack)', color='white', fontsize=14, fontweight='bold')
    ax.legend(fontsize=11)
    ax.tick_params(colors='white')
    ax.spines[:].set_color('#334155')
    ax.grid(alpha=0.3, color='#475569')
    
    plt.tight_layout()
    plt.savefig('evaluation/accuracy_vs_epsilon.png', dpi=150, bbox_inches='tight', facecolor='#0f172a')
    plt.close()
    print("Saved: evaluation/accuracy_vs_epsilon.png")


# ─── SAVE RESULTS CSV ─────────────────────────────────────────────
def save_results_csv(normal_fgsm, robust_fgsm, normal_pgd, robust_pgd, clean_normal, clean_robust):
    rows = []
    for eps in EPSILONS:
        rows.append({
            'epsilon': eps,
            'normal_clean_acc': clean_normal,
            'robust_clean_acc': clean_robust,
            'normal_fgsm_acc': normal_fgsm.get(eps, '-'),
            'robust_fgsm_acc': robust_fgsm.get(eps, '-'),
            'normal_pgd_acc': normal_pgd,
            'robust_pgd_acc': robust_pgd,
        })
    df = pd.DataFrame(rows)
    df.to_csv('results.csv', index=False)
    print("\nResults saved to results.csv")
    print(df.to_string())
    return df


# ─── MAIN ─────────────────────────────────────────────────────────
if __name__ == '__main__':
    print(f"Device: {DEVICE}")
    test_loader = get_test_loader()
    
    print("\nLoading normal model...")
    normal_model = load_model(NORMAL_MODEL_PATH)
    
    # ── Clean accuracy
    clean_normal = evaluate_clean(normal_model, test_loader, DEVICE)
    print(f"Normal Model Clean Accuracy: {clean_normal:.2f}%")
    
    # ── FGSM on normal model
    print("\nRunning FGSM on normal model...")
    normal_fgsm = evaluate_fgsm(normal_model, test_loader, EPSILONS, DEVICE)
    
    # ── PGD on normal model
    print("\nRunning PGD on normal model...")
    normal_pgd = evaluate_pgd(normal_model, test_loader, epsilon=0.1, alpha=0.01, num_steps=20, device=DEVICE)
    
    # ── Save sample images
    save_sample_images(normal_model, test_loader, epsilon=0.1)
    
    # ── Load robust model (if it exists)
    if os.path.exists(ROBUST_MODEL_PATH):
        print("\nLoading robust model...")
        robust_model = load_model(ROBUST_MODEL_PATH)
        clean_robust  = evaluate_clean(robust_model, test_loader, DEVICE)
        robust_fgsm   = evaluate_fgsm(robust_model, test_loader, EPSILONS, DEVICE)
        robust_pgd    = evaluate_pgd(robust_model, test_loader, epsilon=0.1, alpha=0.01, num_steps=20, device=DEVICE)
        print(f"\nRobust Model Clean Accuracy: {clean_robust:.2f}%")
        plot_epsilon_accuracy(normal_fgsm, robust_fgsm)
        save_results_csv(normal_fgsm, robust_fgsm, normal_pgd, robust_pgd, clean_normal, clean_robust)
    else:
        print("\nNo robust model found. Run adversarial training first.")
        print("Command: python -c \"from defense.run_training import run; run()\"")