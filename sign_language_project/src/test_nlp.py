from src.nlp_model import SentenceGenerator

gen = SentenceGenerator()

results = gen.generate("i go school")

for i, r in enumerate(results):
    print(f"{i+1}. {r}")