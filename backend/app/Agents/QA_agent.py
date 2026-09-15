from langchain_core.prompts import string
from typing_extensions import TypedDict
from langchain.agents import create_agent   
from langchain.tools import tool
import os 
from langchain_google_genai import ChatGoogleGenerativeAI 
from langgraph.graph import StateGraph, START, END
from langgraph.types import Send
from pydantic import BaseModel, Field


from app.services.embedding import EmbeddingService
from app.services.vectorstore import VectorStoreService
from app.services.question_generator import QuestionGeneratorService
from app.services.retriever import RetrieverService
from app.models.interview import InterviewRequest

if os.getenv("GROQ_API_KEY"):
    from langchain_groq import ChatGroq
    QA_model = ChatGroq(model="openai/gpt-oss-20b", temperature=0)
else:
    from langchain_google_genai import ChatGoogleGenerativeAI 
    QA_model = ChatGoogleGenerativeAI(model="gemini-1.5-flash", api_key=os.getenv("GOOGLE_API_KEY"))

embeddings = EmbeddingService().get_embeddings()
vector_store_service = VectorStoreService(embeddings)
retriever_service = RetrieverService(vector_store_service)




class QuestionState(TypedDict):
    query: str

    question_type: str
    question_level: str
    concepts: list[str]

    retrieved_docs: list

    questions: list


class AnalysisResult(BaseModel):
    question_type: str
    question_level: str
    concepts: list[str]

def analyze(state:QuestionState):

    """ analyze the user query  ,  extract topic , identify the type of question  , understand the intent of the user and return the output in the form of QuestionState object , if the level of question is not define  then the default toughness is moderate and if the number of questions are not sepcified the default number of questions are 5 """

    structured_llm = QA_model.with_structured_output(AnalysisResult)
    result = structured_llm.invoke(
        [
            {
                "role":"system",
                "content":"You are an expert interview preparation assistant. Your task is to analyze a user query and extract key information required to generate relevant interview questions."
            },
            {
                "role":"user",
                "content":state["query"]
            }
        ]
    )
    return {
        "question_type": result.question_type,
        "question_level": result.question_level,
        "concepts": result.concepts,
    }
    


def retrieve(state:QuestionState):
     documents = retriever_service.retrieve(state["query"])
     return {"retrieved_docs": documents}


def generate(state:QuestionState):
    docs = state.get("retrieved_docs", [])
    context_text = "\n\n".join([d.page_content if hasattr(d, "page_content") else str(d) for d in docs])

    prompt = f"""
Question Type: {state.get("question_type", "General")}
Difficulty: {state.get("question_level", "Moderate")}
Concepts: {", ".join(state.get("concepts", []))}

Context:
{context_text}

Generate relevant interview questions based on the above context.
"""

    result = QA_model.invoke(prompt)

    return {"questions": [{"source": "retriever", "result": result.content if hasattr(result, "content") else str(result)}]}




builder = StateGraph(QuestionState)

builder.add_node("analyze", analyze)
builder.add_node("retrieve", retrieve)
builder.add_node("generate", generate)

builder.add_edge(START, "analyze")
builder.add_edge("analyze", "retrieve")
builder.add_edge("retrieve", "generate")
builder.add_edge("generate", END)

QA_agent = builder.compile()
    

