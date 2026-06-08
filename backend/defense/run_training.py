# backend/defense/run_training.py
# Run this to train the robust model

import torch
import torchvision
import torchvision.transforms as transforms
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.cnn import CNN
from defense.adv_training import adversarial_train

DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

def run():
    transform_train = transforms.Compose([
        transforms.RandomHorizontalFlip(),
        transforms.RandomCrop(32, padding=4),
        transforms.ToTensor(),
        transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010))
    ])
    transform_test = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010))
    ])
    
    trainset = torchvision.datasets.CIFAR10('./data', train=True, download=True, transform=transform_train)
    testset  = torchvision.datasets.CIFAR10('./data', train=False, download=True, transform=transform_test)
    
    train_loader = torch.utils.data.DataLoader(trainset, batch_size=128, shuffle=True, num_workers=2)
    test_loader  = torch.utils.data.DataLoader(testset, batch_size=128, shuffle=False, num_workers=2)
    
    model = CNN().to(DEVICE)
    # Load pretrained weights to fine-tune
    model.load_state_dict(torch.load('checkpoints/model.pth', map_location=DEVICE))
    
    history = adversarial_train(
        model=model,
        train_loader=train_loader,
        test_loader=test_loader,
        epochs=20,
        device=DEVICE,
        attack_type='pgd',
        epsilon=0.1,
        save_path='checkpoints/robust_model.pth'
    )
    
    print("Done! Robust model saved at checkpoints/robust_model.pth")

if __name__ == '__main__':
    run()