# backend/attacks/fgsm.py

import torch
import torch.nn as nn

def fgsm_attack(model, images, labels, epsilon, device):
    """
    Perform FGSM attack on a batch of images.
    
    Args:
        model: trained CNN model
        images: input images tensor (batch_size, 3, 32, 32)
        labels: true labels tensor (batch_size,)
        epsilon: attack strength (e.g. 0.01, 0.05, 0.1)
        device: 'cuda' or 'cpu'
    
    Returns:
        perturbed_images: adversarial examples
    """
    
    # Make sure images require gradient (we need gradient w.r.t input)
    images = images.clone().detach().to(device)
    images.requires_grad = True
    labels = labels.to(device)
    
    # Set model to eval mode (no dropout etc.)
    model.eval()
    
    # Step 1: Forward pass — get predictions
    outputs = model(images)
    
    # Step 2: Calculate loss
    criterion = nn.CrossEntropyLoss()
    loss = criterion(outputs, labels)
    
    # Step 3: Zero existing gradients
    model.zero_grad()
    
    # Step 4: Backward pass — compute gradient of loss w.r.t input image
    loss.backward()
    
    # Step 5: Get sign of gradient
    # images.grad.data has shape (batch_size, 3, 32, 32)
    gradient_sign = images.grad.data.sign()
    
    # Step 6: Create adversarial image by adding epsilon * sign
    perturbed_images = images + epsilon * gradient_sign
    
    # Step 7: Clamp pixel values to valid range [0, 1]
    perturbed_images = torch.clamp(perturbed_images, 0, 1)
    
    return perturbed_images.detach()


def test_fgsm_single(model, image, label, epsilon, device):
    """
    Test FGSM on a single image. Returns original and adversarial image.
    Used for visualization.
    """
    image = image.unsqueeze(0)  # add batch dimension
    label = torch.tensor([label])
    
    adv_image = fgsm_attack(model, image, label, epsilon, device)
    
    return image.squeeze(0), adv_image.squeeze(0)