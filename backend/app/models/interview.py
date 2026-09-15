from pydantic import BaseModel
from typing import Optional

class InterviewRequest(BaseModel):
    topic: str
    session_id: Optional[str] = None