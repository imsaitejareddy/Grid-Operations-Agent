import pandas as pd
import boto3
import io
import faiss
from sentence_transformers import SentenceTransformer
import numpy as np
import pickle

BUCKET_NAME = 'grid-resilience-agent-data-saiteja' # ◀️ YOUR BUCKET NAME
KEY = 'T1.csv'       # ◀️ YOUR FILENAME (e.g., T1.csv)

def load_data_from_s3(bucket: str, key: str) -> pd.DataFrame:
    try:
        s3_client = boto3.client('s3')
        response = s3_client.get_object(Bucket=bucket, Key=key)
        file_data = response['Body'].read()
        df = pd.read_csv(io.BytesIO(file_data))
        print("✅ Successfully loaded data from S3.")
        return df
    except Exception as e:
        print(f"❌ Error loading data from S3: {e}")
        return None

if __name__ == "__main__":
    print("🚀 Starting main knowledge base creation...")
    turbine_df = load_data_from_s3(bucket=BUCKET_NAME, key=KEY)
    
    if turbine_df is not None:
        print("INFO: Converting data rows into sentences...")
        sentences = []
        for index, row in turbine_df.iterrows():
            sentence = (
                f"On {row['Date/Time']}, the turbine's active power was {row['LV ActivePower (kW)']:.2f} kW "
                f"with a wind speed of {row['Wind Speed (m/s)']:.2f} m/s. "
                f"The theoretical power curve predicted {row['Theoretical_Power_Curve (KWh)']:.2f} KWh, "
                f"and the wind direction was {row['Wind Direction (°)']:.2f} degrees."
            )
            sentences.append(sentence)
        
        print(f"INFO: Loading sentence transformer model...")
        model = SentenceTransformer('all-MiniLM-L6-v2')
        print("INFO: Creating embeddings...")
        embeddings = model.encode(sentences, show_progress_bar=True)
        
        print("INFO: Building FAISS index...")
        index = faiss.IndexFlatL2(embeddings.shape[1])
        index.add(embeddings)

        print("INFO: Saving index and sentences to disk...")
        faiss.write_index(index, "faiss_index.bin")
        with open("data_sentences.pkl", "wb") as f:
            pickle.dump(sentences, f)
        
        print("\n🎉 Success! Main knowledge base created.")