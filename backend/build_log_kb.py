import faiss
from sentence_transformers import SentenceTransformer
import pickle

print("Building maintenance log knowledge base...")

try:
    with open("maintenance_logs.txt", "r") as f:
        log_sentences = [line.strip() for line in f.readlines() if line.strip()]

    model = SentenceTransformer('all-MiniLM-L6-v2')
    log_embeddings = model.encode(log_sentences)

    index = faiss.IndexFlatL2(log_embeddings.shape[1])
    index.add(log_embeddings)
    faiss.write_index(index, "log_faiss_index.bin")

    with open("log_sentences.pkl", "wb") as f:
        pickle.dump(log_sentences, f)

    print("✅ Maintenance log knowledge base created successfully!")
except FileNotFoundError:
    print("❌ ERROR: maintenance_logs.txt not found. Please create it first.")