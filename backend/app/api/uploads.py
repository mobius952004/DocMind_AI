from fastapi import APIRouter, UploadFile, File
from pathlib import Path
from app.services.pdf_loader import PdfLoaderService
from app.services.splitter import TextSplitter
from app.services.embedding import EmbeddingService
from app.services.vectorstore import VectorStoreService 


router = APIRouter()

# Absolute path to uploads directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/")
async def upload_page(file: UploadFile = File(...)):

    file_path = UPLOAD_DIR / file.filename

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    loader = PdfLoaderService()
    documents = loader.load_pdf(file_path)

    # Filter out empty scanned/image pages
    valid_documents = [doc for doc in documents if doc.page_content and doc.page_content.strip()]

    splitter = TextSplitter()
    chunks = splitter.split_documents(valid_documents) if valid_documents else []

    if chunks:
        embedding_service = EmbeddingService()
        embeddings = embedding_service.get_embeddings()
        vector_store = VectorStoreService(embeddings)
        vector_store.add_documents(chunks)

    return {
        "message": "PDF indexed successfully" if chunks else "PDF uploaded, but no extractable text found",
        "filename": file.filename,
        "total_pages": len(documents),
        "valid_pages_with_text": len(valid_documents),
        "chunks": len(chunks)
    }
