from app.Agents.router import graph
from fastapi import APIRouter, Header
from typing import Optional
from app.models.interview import InterviewRequest


router = APIRouter()


@router.post("/generate")
def generate_questions(
    request: InterviewRequest,
    x_session_id: Optional[str] = Header(None)
):
    # Use session_id from body or header, defaulting to single fallback thread
    thread_id = request.session_id or x_session_id or "default_session"
    session_config = {"configurable": {"thread_id": thread_id}}

    result = graph.invoke({
        "query": request.topic
    }, config=session_config)

    return {"result": result.get("final_answer", result)}


    # embeddings = EmbeddingService().get_embeddings()
    # vector_store_service = VectorStoreService(embeddings)

    # retriever_service = RetrieverService(vector_store_service)

    # documents = retriever_service.retrieve(request.topic)
    # generator = QuestionGeneratorService()

    # response = generator.generate_questions(request.topic, documents)
    # text = response.content[0]["text"]

    # return {
    #     "Questions": text,
    # }
