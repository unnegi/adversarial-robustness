# backend/defense/adv_training.py

import torch
import torch.nn as nn
import torch.optim as optim
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from attacks.fgsm import fgsm_attack
from attacks.pgd import pgd_attack


def adversarial_train(model, train_loader, test_loader, epochs, device, 
                      attack_type='fgsm', epsilon=0.1, save_path='checkpoints/robust_model.pth'):
    """
    Train model with adversarial examples mixed in.
    
    Args:
        model: CNN model to train
        train_loader: training data loader
        test_loader: test data loader
        epochs: number of training epochs
        device: 'cuda' or 'cpu'
        attack_type: 'fgsm' or 'pgd'
        epsilon: attack strength
        save_path: where to save the robust model
    """
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=10, gamma=0.5)
    
    best_accuracy = 0
    history = {'train_loss': [], 'train_acc': [], 'test_acc': []}
    
    print(f"\n{'='*60}")
    print(f"Starting Adversarial Training")
    print(f"  Attack: {attack_type.upper()}, Epsilon: {epsilon}, Epochs: {epochs}")
    print(f"{'='*60}")
    
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        for batch_idx, (images, labels) in enumerate(train_loader):
            images, labels = images.to(device), labels.to(device)
            
            # Step 1: Generate adversarial examples
            if attack_type == 'fgsm':
                adv_images = fgsm_attack(model, images, labels, epsilon, device)
            elif attack_type == 'pgd':
                adv_images = pgd_attack(model, images, labels, epsilon, 
                                         alpha=epsilon/4, num_steps=7, device=device)
            
            # Step 2: Mix clean + adversarial (50/50 ratio)
            # Concatenate clean and adversarial images
            mixed_images = torch.cat([images, adv_images], dim=0)
            mixed_labels = torch.cat([labels, labels], dim=0)
            
            # Step 3: Train on mixed batch
            model.train()
            optimizer.zero_grad()
            outputs = model(mixed_images)
            loss = criterion(outputs, mixed_labels)
            loss.backward()
            optimizer.step()
            
            # Track metrics
            running_loss += loss.item()
            _, predicted = torch.max(outputs, 1)
            correct += (predicted == mixed_labels).sum().item()
            total += mixed_labels.size(0)
            
            if batch_idx % 100 == 0:
                print(f"  Epoch [{epoch+1}/{epochs}] Batch [{batch_idx}/{len(train_loader)}] "
                      f"Loss: {loss.item():.4f}")
        
        # Calculate epoch metrics
        train_loss = running_loss / len(train_loader)
        train_acc = 100 * correct / total
        
        # Evaluate on test set (clean)
        test_acc = evaluate_clean(model, test_loader, device)
        
        history['train_loss'].append(train_loss)
        history['train_acc'].append(train_acc)
        history['test_acc'].append(test_acc)
        
        scheduler.step()
        
        print(f"\nEpoch {epoch+1}: Loss={train_loss:.4f}, Train Acc={train_acc:.2f}%, Test Acc={test_acc:.2f}%")
        
        # Save best model
        if test_acc > best_accuracy:
            best_accuracy = test_acc
            torch.save(model.state_dict(), save_path)
            print(f"  ✓ Best model saved! Accuracy: {best_accuracy:.2f}%")
    
    print(f"\nAdversarial Training Complete!")
    print(f"Best Test Accuracy: {best_accuracy:.2f}%")
    
    return history


def evaluate_clean(model, test_loader, device):
    """Evaluate model on clean (unattacked) test data."""
    model.eval()
    correct = 0
    total = 0
    
    with torch.no_grad():
        for images, labels in test_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            _, predicted = torch.max(outputs, 1)
            correct += (predicted == labels).sum().item()
            total += labels.size(0)
    
    return 100 * correct / total