import os
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langchain_community.tools import DuckDuckGoSearchRun

if os.getenv("GROQ_API_KEY"):
    from langchain_groq import ChatGroq
    search_model = ChatGroq(model="openai/gpt-oss-20b", temperature=0)
else:
    from langchain_google_genai import ChatGoogleGenerativeAI
    search_model = ChatGoogleGenerativeAI(model="gemini-3.5-flash", api_key=os.getenv("GOOGLE_API_KEY"))


class SearchState(TypedDict):
    query: str
    search_results: str
    questions: list


def execute_web_search(state: SearchState):
    """Execute live web search using DuckDuckGo to gather fresh interview insights."""
    try:
        search_tool = DuckDuckGoSearchRun()
        results = search_tool.invoke(state["query"])
    except Exception as e:
        results = f"Web search could not retrieve live results: {e}"
        
    return {"search_results": results}


def generate_search_questions(state: SearchState):
    """Generate interview questions based on live web search results."""
    prompt = f"""
You are an expert interview preparation assistant.
Based on the following web search results regarding "{state['query']}", generate 5 targeted interview questions:

Web Search Context:
{state.get('search_results', '')}

Rules:
- Provide 5 clear, high-quality interview questions.
- Include short key insights for each question.
"""
    result = search_model.invoke(prompt)
    return {"questions": [{"source": "web_search", "result": result.content if hasattr(result, "content") else str(result)}]}


builder = StateGraph(SearchState)
builder.add_node("search", execute_web_search)
builder.add_node("generate", generate_search_questions)

builder.add_edge(START, "search")
builder.add_edge("search", "generate")
builder.add_edge("generate", END)

Search_agent = builder.compile()
