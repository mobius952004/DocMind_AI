from langchain_core.prompts import string
from typing_extensions import TypedDict
import os 
from langchain_google_genai import ChatGoogleGenerativeAI 
from langgraph.graph import StateGraph, START, END
from langgraph.types import Send
from pydantic import BaseModel, Field



if os.getenv("GROQ_API_KEY"):
    from langchain_groq import ChatGroq
    explain_model = ChatGroq(model="openai/gpt-oss-20b", temperature=0)
else:
    from langchain_google_genai import ChatGoogleGenerativeAI 
    explain_model = ChatGoogleGenerativeAI(model="gemini-3.5-flash", api_key=os.getenv("GOOGLE_API_KEY"))


class Explain_State(TypedDict):
    query:str
    topic:list[str]
    explaination:str



class TopicExtraction(BaseModel):
    topics: list[str]

class ConceptExplanation(BaseModel):
    explanation: str

def get_topic(state: Explain_State):
    """Extract key topics from the query."""
    topic_model = explain_model.with_structured_output(TopicExtraction)
    result = topic_model.invoke([
        {"role": "system", "content": "Extract all technical topics/concepts from the query."},
        {"role": "user", "content": state["query"]}
    ])
    return {"topic": result.topics}


def get_explaination(state: Explain_State):
    """Generate detailed concept explanation tailored for interviews."""
    topics_str = ", ".join(state.get("topic", [])) or state["query"]
    prompt = f"""
You are an expert technical interviewer and educator.
Explain the following topic(s) in a brief, UI-friendly, and clear manner:
Topic(s): {topics_str}

Guidelines:
- Provide an intuitive overview with simple analogies if helpful.
- Include a practical code/query example.
- Highlight key trade-offs, edge cases, or potential follow-up questions an interviewer might ask.
"""
    result = explain_model.invoke(prompt)
    explanation_text = result.content if hasattr(result, "content") else str(result)
    return {"explaination": explanation_text}


workflow=(
    StateGraph(Explain_State)
    .add_node("get_topic",get_topic)
    .add_node("get_explaination",get_explaination)
    .add_edge(START,"get_topic")
    .add_edge("get_topic","get_explaination")
    .add_edge("get_explaination",END)
    
)


explain_agent = workflow.compile()
