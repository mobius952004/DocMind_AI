from langchain_core.prompts import string
from typing_extensions import TypedDict
import os 
from langchain_google_genai import ChatGoogleGenerativeAI 
from langgraph.graph import StateGraph, START, END
from langgraph.types import Send
from pydantic import BaseModel, Field



if os.getenv("GROQ_API_KEY"):
    from langchain_groq import ChatGroq
    review_model = ChatGroq(model="openai/gpt-oss-20b", temperature=0)
else:
    from langchain_google_genai import ChatGoogleGenerativeAI 
    review_model = ChatGoogleGenerativeAI(model="gemini-3.5-flash", api_key=os.getenv("GOOGLE_API_KEY"))



class ReviewState(TypedDict):
    question: str
    expected_answer: str
    user_answer: str
    score: int
    feedback: str
    mistakes: list[str]

class ReviewResult(BaseModel):
    score: int
    feedback: str
    mistakes: list[str]



def review_answer(state: ReviewState):
    """Review candidate's answer, assign score, detailed feedback, and list of mistakes."""

    structured_llm = review_model.with_structured_output(ReviewResult)
    result = structured_llm.invoke(
        [
            {
                "role": "system",
                "content": """
                You are an expert interviewer and evaluator. Your task is to assess a candidate's answer to a specific interview question.
                You should provide a score and detailed feedback based on:
                1. Correctness: Is the information accurate?
                2. Completeness: Does the answer cover all essential aspects?
                3. Clarity: Is the explanation clear and easy to understand?
                4. Reasoning: Is the logical flow and justification sound?
                5. Structure: Is the answer well-organized and coherent?
                6. Score the response from 1 to 10, 10 being perfect, 1 being absolutely wrong.
                """
            },
            {
                "role": "user",
                "content": f"""
                Question: {state.get('question', '')}
                Expected Answer (Context): {state.get('expected_answer', 'N/A')}
                Candidate's Answer: {state.get('user_answer', '')}

                Please evaluate the candidate's answer and provide a score, detailed feedback, and list of specific mistakes.
                """
            }
        ]
    )
    return {
        "score": result.score,
        "feedback": result.feedback,
        "mistakes": result.mistakes,
    }



workflow= (
    StateGraph(ReviewState)
    .add_node("reviewer",review_answer)
    .add_edge(START,"reviewer")
    .add_edge("reviewer",END)
    .compile()
)
