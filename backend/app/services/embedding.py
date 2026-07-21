from langchain_google_genai import GoogleGenerativeAIEmbeddings
from app import config  # ensures load_dotenv() is called
import os


class EmbeddingService:

    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY is not set. Check your .env file.")
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001"
        )

    def get_embeddings(self):
        return self.embeddings