# backend/training/data_loader.py

import torch
import torchvision
import torchvision.transforms as transforms
from torch.utils.data import DataLoader


# CIFAR-10 mean & std (precomputed from training set)
CIFAR10_MEAN = (0.4914, 0.4822, 0.4465)
CIFAR10_STD  = (0.2023, 0.1994, 0.2010)
CIFAR10_CLASSES = ['airplane', 'automobile', 'bird', 'cat', 'deer',
                   'dog', 'frog', 'horse', 'ship', 'truck']


def get_train_loader(batch_size=128, num_workers=2, data_dir='./data'):
    """
    Returns DataLoader for CIFAR-10 training set with augmentation.
    Augmentation: random horizontal flip + random crop
    """
    transform_train = transforms.Compose([
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomCrop(32, padding=4),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize(CIFAR10_MEAN, CIFAR10_STD),
    ])

    trainset = torchvision.datasets.CIFAR10(
        root=data_dir, train=True, download=True, transform=transform_train
    )

    loader = DataLoader(
        trainset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=True
    )

    print(f"[DataLoader] Training samples : {len(trainset):,}")
    print(f"[DataLoader] Batch size       : {batch_size}")
    print(f"[DataLoader] Batches per epoch: {len(loader)}")
    return loader


def get_test_loader(batch_size=128, num_workers=2, data_dir='./data'):
    """
    Returns DataLoader for CIFAR-10 test set (no augmentation).
    """
    transform_test = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(CIFAR10_MEAN, CIFAR10_STD),
    ])

    testset = torchvision.datasets.CIFAR10(
        root=data_dir, train=False, download=True, transform=transform_test
    )

    loader = DataLoader(
        testset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True
    )

    print(f"[DataLoader] Test samples     : {len(testset):,}")
    return loader


def get_loaders(batch_size=128, num_workers=2, data_dir='./data'):
    """Convenience: returns (train_loader, test_loader) together."""
    train_loader = get_train_loader(batch_size, num_workers, data_dir)
    test_loader  = get_test_loader(batch_size, num_workers, data_dir)
    return train_loader, test_loader


if __name__ == '__main__':
    train_loader, test_loader = get_loaders()
    images, labels = next(iter(train_loader))
    print(f"\nSample batch — images: {images.shape}, labels: {labels.shape}")
    print(f"Label names: {[CIFAR10_CLASSES[l] for l in labels[:8].tolist()]}")