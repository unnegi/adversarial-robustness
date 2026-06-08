# backend/attacks/fgsm_eval.py

import torch
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from attacks.fgsm import fgsm_attack


def evaluate_fgsm(model, test_loader, epsilons, device):
    """
    Evaluate model accuracy under FGSM attack for different epsilon values.
    
    Returns:
        results: dict with epsilon -> accuracy
    """
    results = {}
    
    for epsilon in epsilons:
        print(f"\n[FGSM] Testing epsilon = {epsilon}")
        
        correct = 0
        total = 0
        
        for images, labels in test_loader:
            images = images.to(device)
            labels = labels.to(device)
            
            # Generate adversarial images
            adv_images = fgsm_attack(model, images, labels, epsilon, device)
            
            # Test model on adversarial images
            model.eval()
            with torch.no_grad():
                outputs = model(adv_images)
                _, predicted = torch.max(outputs, 1)
                
                correct += (predicted == labels).sum().item()
                total += labels.size(0)
        
        accuracy = 100 * correct / total
        results[epsilon] = accuracy
        print(f"  Accuracy under FGSM (eps={epsilon}): {accuracy:.2f}%")
    
    return results