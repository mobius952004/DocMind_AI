import os
from app import config  # ensures load_dotenv() is called
from langchain_google_genai import GoogleGenerativeAIEmbeddings


class EmbeddingService:

    def __init__(self):
        # FastEmbed uses ONNX Runtime instead of PyTorch.
        # Uses <100MB RAM, perfect for Render's 512MB free tier limit!
        try:
            from langchain_community.embeddings import FastEmbedEmbeddings
            self.embeddings = FastEmbedEmbeddings(
                model_name="BAAI/bge-small-en-v1.5"
            )
        except Exception as e:
            self.embeddings= GoogleGenerativeAIEmbeddings(
                model="models/text-embedding-004",
                google_api_key=os.getenv("GOOGLE_API_KEY")
            )

    def get_embeddings(self):
        return self.embeddings