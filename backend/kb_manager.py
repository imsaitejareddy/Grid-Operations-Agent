import faiss
from sentence_transformers import SentenceTransformer
import pickle
from datetime import datetime

LOG_FILE = "maintenance_logs.txt"
INDEX_FILE = "log_faiss_index.bin"
SENTENCES_FILE = "log_sentences.pkl"

def rebuild_log_index():
    print("Rebuilding maintenance log knowledge base...")
    try:
        with open(LOG_FILE, "r") as f:
            log_sentences = [line.strip() for line in f.readlines() if line.strip()]

        if not log_sentences:
            print("Log file is empty. Skipping index build.")
            return

        model = SentenceTransformer('all-MiniLM-L6-v2')
        log_embeddings = model.encode(log_sentences)

        index = faiss.IndexFlatL2(log_embeddings.shape[1])
        index.add(log_embeddings)
        faiss.write_index(index, INDEX_FILE)

        with open(SENTENCES_FILE, "wb") as f:
            pickle.dump(log_sentences, f)

        print("✅ Maintenance log knowledge base rebuilt successfully!")
    except Exception as e:
        print(f"❌ Error rebuilding log index: {e}")

def add_log_entry(new_log_message: str):
    timestamp = datetime.now().strftime("%Y-%m-%d")
    formatted_log = f"{timestamp}: {new_log_message}"

    print(f"Adding new log: {formatted_log}")

    with open(LOG_FILE, "a") as f:
        f.write(f"\n{formatted_log}")

    rebuild_log_index()

def get_all_logs():
    try:
        with open(LOG_FILE, "r") as f:
            return [line.strip() for line in f.readlines() if line.strip()]
    except FileNotFoundError:
        return []
