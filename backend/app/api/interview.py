from fastapi import APIRouter
from app.services.embedding import EmbeddingService
from app.services.vectorstore import VectorStoreService
from app.services.question_generator import QuestionGeneratorService
from app.services.retriever import RetrieverService
from app.models.interview import InterviewRequest

router = APIRouter()


@router.post("/generate")
def generate_questions(request: InterviewRequest):

    embeddings = EmbeddingService().get_embeddings()
    vector_store_service = VectorStoreService(embeddings)

    retriever_service = RetrieverService(vector_store_service)

    documents = retriever_service.retrieve(request.topic)
    generator = QuestionGeneratorService()

    response = generator.generate_questions(request.topic, documents)
    text = response.content[0]["text"]

    return {
        "Questions": text,
    }
