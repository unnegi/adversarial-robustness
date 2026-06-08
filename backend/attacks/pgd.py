# backend/attacks/pgd.py

import torch
import torch.nn as nn


def pgd_attack(model, images, labels, epsilon, alpha, num_steps, device):
    """
    Perform PGD attack on a batch of images.
    
    Args:
        model: trained CNN model
        images: input images (batch_size, 3, 32, 32)
        labels: true labels
        epsilon: max total perturbation allowed (e.g. 0.1)
        alpha: step size per iteration (e.g. 0.01)
        num_steps: number of gradient steps (e.g. 10 or 20)
        device: 'cuda' or 'cpu'
    
    Returns:
        perturbed_images: adversarial examples
    """
    
    images = images.clone().detach().to(device)
    labels = labels.to(device)
    criterion = nn.CrossEntropyLoss()
    
    # Start from a random point inside the epsilon ball
    # This makes PGD stronger (random restart)
    adv_images = images + torch.empty_like(images).uniform_(-epsilon, epsilon)
    adv_images = torch.clamp(adv_images, 0, 1).detach()
    
    model.eval()
    
    for step in range(num_steps):
        # Require gradient for current adversarial images
        adv_images.requires_grad = True
        
        # Forward pass
        outputs = model(adv_images)
        loss = criterion(outputs, labels)
        
        # Backward pass
        model.zero_grad()
        loss.backward()
        
        # Get gradient sign and take a small step
        with torch.no_grad():
            gradient_sign = adv_images.grad.data.sign()
            adv_images = adv_images + alpha * gradient_sign
            
            # Project back into epsilon-ball around original image
            # This is the "projected" part of PGD
            delta = adv_images - images
            delta = torch.clamp(delta, -epsilon, epsilon)
            adv_images = images + delta
            
            # Clamp to valid pixel range
            adv_images = torch.clamp(adv_images, 0, 1).detach()
    
    return adv_images


def evaluate_pgd(model, test_loader, epsilon, alpha, num_steps, device):
    """
    Evaluate model accuracy under PGD attack.
    """
    print(f"\n[PGD] eps={epsilon}, alpha={alpha}, steps={num_steps}")
    
    correct = 0
    total = 0
    model.eval()
    
    for images, labels in test_loader:
        images = images.to(device)
        labels = labels.to(device)
        
        adv_images = pgd_attack(model, images, labels, epsilon, alpha, num_steps, device)
        
        with torch.no_grad():
            outputs = model(adv_images)
            _, predicted = torch.max(outputs, 1)
            correct += (predicted == labels).sum().item()
            total += labels.size(0)
    
    accuracy = 100 * correct / total
    print(f"  PGD Accuracy: {accuracy:.2f}%")
    return accuracy