from fastapi import APIRouter, UploadFile, File
from pathlib import Path
from app.services.pdf_loader import PdfLoaderService
from app.services.splitter import TextSplitter
from app.services.embedding import EmbeddingService
from app.services.vectorstore import VectorStoreService 


router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/")
async def upload_page(file: UploadFile = File(...)):

    file_path = UPLOAD_DIR / file.filename
    print(file.filename)

    with open(file_path, "wb") as f:
        f.write(await file.read())

    loader = PdfLoaderService()

    documents = loader.load_pdf(file.filename)

    splitter = TextSplitter()

    chunks = splitter.split_documents(documents)

    embedding_service = EmbeddingService()

    embeddings = embedding_service.get_embeddings()

    vector_store = VectorStoreService(embeddings)

    vector_store.add_documents(chunks)

    return {
        "message": "PDF indexed successfully",
        "filename": file.filename,
        "pages": len(documents),
        "chunks": len(chunks)
    }
