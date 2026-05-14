from src.dataset import DatasetBuilder

if __name__ == "__main__":
    builder = DatasetBuilder()
    builder.build(augment=True)