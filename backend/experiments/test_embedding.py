import os
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings

load_dotenv()

print("API Key Loaded:", os.getenv("GOOGLE_API_KEY") is not None)

embeddings = GoogleGenerativeAIEmbeddings(
    model="models/text-embedding-004"
)

try:
    result = embeddings.embed_query("Hello World")
    print("Success!")
    print(result[:5])
except Exception as e:
    print(type(e).__name__)
    print(e)