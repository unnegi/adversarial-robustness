# backend/training/train.py

import torch
import torch.nn as nn
import torch.optim as optim
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.cnn import CNN
from training.data_loader import get_loaders


DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
EPOCHS = 50
BATCH_SIZE = 128
LEARNING_RATE = 0.001
CHECKPOINT_DIR = 'checkpoints'
os.makedirs(CHECKPOINT_DIR, exist_ok=True)
os.makedirs('logs', exist_ok=True)


def train_one_epoch(model, loader, criterion, optimizer, device):
    """Run one full training epoch. Returns (avg_loss, accuracy)."""
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for batch_idx, (images, labels) in enumerate(loader):
        images, labels = images.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item()
        _, predicted = torch.max(outputs, 1)
        correct += (predicted == labels).sum().item()
        total += labels.size(0)

        if batch_idx % 100 == 0:
            print(f"  Batch [{batch_idx:3d}/{len(loader)}]  "
                  f"Loss: {loss.item():.4f}", end='\r')

    avg_loss = running_loss / len(loader)
    accuracy = 100.0 * correct / total
    return avg_loss, accuracy


def evaluate(model, loader, criterion, device):
    """Evaluate on a data loader. Returns (avg_loss, accuracy)."""
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)

            running_loss += loss.item()
            _, predicted = torch.max(outputs, 1)
            correct += (predicted == labels).sum().item()
            total += labels.size(0)

    avg_loss = running_loss / len(loader)
    accuracy = 100.0 * correct / total
    return avg_loss, accuracy


def plot_training_history(history):
    """Save training curves to logs/training_history.png."""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    fig.patch.set_facecolor('#0f172a')

    for ax in (ax1, ax2):
        ax.set_facecolor('#1e293b')
        ax.tick_params(colors='white')
        ax.spines[:].set_color('#334155')

    epochs = range(1, len(history['train_loss']) + 1)

    # Loss plot
    ax1.plot(epochs, history['train_loss'], color='#ef4444', label='Train Loss')
    ax1.plot(epochs, history['val_loss'],   color='#3b82f6', label='Val Loss')
    ax1.set_title('Loss', color='white', fontweight='bold')
    ax1.set_xlabel('Epoch', color='white')
    ax1.set_ylabel('Loss', color='white')
    ax1.legend()
    ax1.grid(alpha=0.3, color='#475569')

    # Accuracy plot
    ax2.plot(epochs, history['train_acc'], color='#ef4444', label='Train Acc')
    ax2.plot(epochs, history['val_acc'],   color='#22c55e', label='Val Acc')
    ax2.set_title('Accuracy (%)', color='white', fontweight='bold')
    ax2.set_xlabel('Epoch', color='white')
    ax2.set_ylabel('Accuracy', color='white')
    ax2.legend()
    ax2.grid(alpha=0.3, color='#475569')

    plt.tight_layout()
    plt.savefig('logs/training_history.png', dpi=150, bbox_inches='tight', facecolor='#0f172a')
    plt.close()
    print("  Saved: logs/training_history.png")


def train():
    print(f"\n{'='*60}")
    print(f"  CIFAR-10 CNN Training")
    print(f"  Device : {DEVICE}")
    print(f"  Epochs : {EPOCHS}  |  Batch: {BATCH_SIZE}  |  LR: {LEARNING_RATE}")
    print(f"{'='*60}\n")

    train_loader, test_loader = get_loaders(batch_size=BATCH_SIZE)

    model     = CNN().to(DEVICE)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)

    best_val_acc = 0.0
    history = {'train_loss': [], 'val_loss': [], 'train_acc': [], 'val_acc': []}

    for epoch in range(1, EPOCHS + 1):
        print(f"\nEpoch [{epoch:02d}/{EPOCHS}]")

        train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, DEVICE)
        val_loss,   val_acc   = evaluate(model, test_loader, criterion, DEVICE)
        scheduler.step()

        history['train_loss'].append(train_loss)
        history['val_loss'].append(val_loss)
        history['train_acc'].append(train_acc)
        history['val_acc'].append(val_acc)

        print(f"  Train → Loss: {train_loss:.4f}  Acc: {train_acc:.2f}%")
        print(f"  Val   → Loss: {val_loss:.4f}  Acc: {val_acc:.2f}%")

        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            save_path = os.path.join(CHECKPOINT_DIR, 'model.pth')
            torch.save(model.state_dict(), save_path)
            print(f"  ✓ Best model saved  (val_acc = {best_val_acc:.2f}%)")

    print(f"\n{'='*60}")
    print(f"  Training complete!")
    print(f"  Best Validation Accuracy: {best_val_acc:.2f}%")
    print(f"  Model saved at          : {CHECKPOINT_DIR}/model.pth")
    print(f"{'='*60}")

    plot_training_history(history)
    return model, history


if __name__ == '__main__':
    train()