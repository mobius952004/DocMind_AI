from fastapi import APIRouter, Header
from pydantic import BaseModel
from typing import Optional
from app.Agents.Mock_agent.Mock_agent import mock_agent

router = APIRouter()

class MockRequest(BaseModel):
    query: Optional[str] = None
    topic: Optional[str] = None
    session_id: Optional[str] = None

@router.post("/mock")
def mock_interview(
    request: MockRequest,
    x_session_id: Optional[str] = Header(None)
):
    # Support both 'query' and 'topic'
    user_text = request.query or request.topic or ""
    
    thread_id = request.session_id or x_session_id or "default_thread"
    session_config = {"configurable": {"thread_id": f"mock_{thread_id}"}}

    # Pass into Mock_State
    result = mock_agent.invoke(
        {
            "query": user_text,
            "user_answer": user_text
        },
        config=session_config
    )

    question_text = result.get("questions") or result.get("current_question", "No question generated.")

    # Return both naming conventions so the frontend never breaks
    return {
        "questions": question_text,
        "next_question": question_text,
        "result": question_text,
        "score": result.get("score"),
        "eval_score": result.get("score"),
        "feedback": result.get("feedback"),
        "eval_feedback": result.get("feedback"),
        "mistakes": result.get("mistakes", []),
        "next_action": result.get("next_action")
    }
