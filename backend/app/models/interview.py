from pydantic import BaseModel


class InterviewRequest(BaseModel):
    topic: str