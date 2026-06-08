# backend/models/cnn.py

import torch
import torch.nn as nn
import torch.nn.functional as F


class CNN(nn.Module):
    """
    CNN for CIFAR-10 classification.
    Architecture: 3 conv blocks + 2 FC layers
    Expected input: (batch, 3, 32, 32)
    Output: (batch, 10) — logits for 10 classes
    """

    def __init__(self):
        super(CNN, self).__init__()

        # Block 1: 3 → 32 channels
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
        self.bn1   = nn.BatchNorm2d(32)
        self.conv2 = nn.Conv2d(32, 32, kernel_size=3, padding=1)
        self.bn2   = nn.BatchNorm2d(32)
        self.pool1 = nn.MaxPool2d(2, 2)   # → 16x16
        self.drop1 = nn.Dropout2d(0.2)

        # Block 2: 32 → 64 channels
        self.conv3 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.bn3   = nn.BatchNorm2d(64)
        self.conv4 = nn.Conv2d(64, 64, kernel_size=3, padding=1)
        self.bn4   = nn.BatchNorm2d(64)
        self.pool2 = nn.MaxPool2d(2, 2)   # → 8x8
        self.drop2 = nn.Dropout2d(0.3)

        # Block 3: 64 → 128 channels
        self.conv5 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.bn5   = nn.BatchNorm2d(128)
        self.conv6 = nn.Conv2d(128, 128, kernel_size=3, padding=1)
        self.bn6   = nn.BatchNorm2d(128)
        self.pool3 = nn.MaxPool2d(2, 2)   # → 4x4
        self.drop3 = nn.Dropout2d(0.4)

        # Fully connected layers
        self.fc1  = nn.Linear(128 * 4 * 4, 512)
        self.bn7  = nn.BatchNorm1d(512)
        self.drop4 = nn.Dropout(0.5)
        self.fc2  = nn.Linear(512, 10)

    def forward(self, x):
        # Block 1
        x = F.relu(self.bn1(self.conv1(x)))
        x = F.relu(self.bn2(self.conv2(x)))
        x = self.pool1(x)
        x = self.drop1(x)

        # Block 2
        x = F.relu(self.bn3(self.conv3(x)))
        x = F.relu(self.bn4(self.conv4(x)))
        x = self.pool2(x)
        x = self.drop2(x)

        # Block 3
        x = F.relu(self.bn5(self.conv5(x)))
        x = F.relu(self.bn6(self.conv6(x)))
        x = self.pool3(x)
        x = self.drop3(x)

        # Flatten → FC
        x = x.view(x.size(0), -1)
        x = F.relu(self.bn7(self.fc1(x)))
        x = self.drop4(x)
        x = self.fc2(x)
        return x


def get_model_summary():
    """Print model parameter count."""
    model = CNN()
    total = sum(p.numel() for p in model.parameters())
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"Total parameters    : {total:,}")
    print(f"Trainable parameters: {trainable:,}")
    return model


if __name__ == '__main__':
    model = get_model_summary()
    # Quick shape test
    dummy = torch.randn(4, 3, 32, 32)
    out = model(dummy)
    print(f"Input shape : {dummy.shape}")
    print(f"Output shape: {out.shape}")  # Expected: (4, 10)