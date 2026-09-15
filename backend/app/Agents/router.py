import os 
from typing import Annotated, Literal
from typing_extensions import TypedDict
import operator
from pydantic import BaseModel, Field
from langchain.tools import tool
from langgraph.graph import StateGraph, START, END
from langgraph.types import Send
from langgraph.checkpoint.memory import InMemorySaver
from langchain_core.runnables import RunnableConfig



# Support Groq if GROQ_API_KEY is set, otherwise default to Gemini
if os.getenv("GROQ_API_KEY"):
    from langchain_groq import ChatGroq
    router_llm = ChatGroq(model="openai/gpt-oss-20b", temperature=0)
else:
    from langchain_google_genai import ChatGoogleGenerativeAI
    router_llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash", temperature=0)

from .QA_agent import QA_agent 
from .Search_agent import Search_agent
from .explain_agent import explain_agent


class AgentInput(TypedDict):
    """Simple input state for each subagent."""
    query: str


class AgentOutput(TypedDict):
    """Output from each subagent."""
    source: str
    result: str


class Classification(TypedDict):
    """A single routing decision: which agent to call with what query."""
    source: Literal["QA_agent", "web_search","explain_agent"]
    query: str


class RouterState(TypedDict):
    query: str
    classifications: list[Classification]
    results: Annotated[list[AgentOutput], operator.add]  # Reducer collects parallel results
    final_answer: str


# Structured output schema for classifier
class ClassificationResult(BaseModel):
    """Result of classifying a user query into agent-specific sub-questions."""
    classifications: list[Classification] = Field(
        description="List of agents to invoke with their targeted sub-questions"
    )



# Workflow nodes
def classify_query(state: RouterState) -> dict:
    """Classify query and determine which agents to invoke."""
    structured_llm = router_llm.with_structured_output(ClassificationResult)

    result = structured_llm.invoke([
        {
            "role": "system",
            "content": """Analyze this query and determine which agents to consult.
For each relevant source, generate a targeted sub-question optimized for that source.

Available sources:
- QA_agent : use RAG knowledge base for user-uploaded documents and textbooks.
- web_search : search the live web for general interview topics, latest framework questions, and programming patterns.
- explain_agent : use for explaning the concepts and topics in brief and in a way that interviewer can ask follow up questions

Return ONLY the sources that are relevant to the query. If unspecified or general, prefer web_search or both."""
        },
        {"role": "user", "content": state["query"]}
    ])

    return {"classifications": result.classifications}


def route_to_agents(state: RouterState) -> list[Send]:
    """Fan out to agents based on classifications."""
    return [
        Send(c["source"], {"query": c["query"]})
        for c in state["classifications"]
    ]

def invoke_QA_agent(state: RouterState) -> dict:
    QA_answer = QA_agent.invoke({"query": state["query"]})
    questions = QA_answer.get("questions", [])
    if isinstance(questions, list) and len(questions) > 0 and isinstance(questions[0], dict):
        result_text = questions[0].get("result", str(QA_answer))
    else:
        result_text = str(QA_answer)

    return {
        "results": [{
            "source": "QA_agent",
            "result": result_text
        }]
    }

def invoke_Search_agent(state: RouterState) -> dict:
    search_answer = Search_agent.invoke({"query": state["query"]})
    questions = search_answer.get("questions", [])
    if isinstance(questions, list) and len(questions) > 0 and isinstance(questions[0], dict):
        result_text = questions[0].get("result", str(search_answer))
    else:
        result_text = str(search_answer)

    return {
        "results": [{
            "source": "web_search",
            "result": result_text
        }]
    }

def invoke_explain_agent(state: RouterState) -> dict:
    explain_answer = explain_agent.invoke({"query": state["query"]})
    result_text = explain_answer.get("explaination") if isinstance(explain_answer, dict) else str(explain_answer)

    return {
        "results": [{
            "source": "explain_agent",
            "result": result_text
        }]
    }


def synthesize_results(state: RouterState) -> dict:
    """Combine results from all agents into a coherent answer."""
    if not state["results"]:
        return {"final_answer": "No results found from any knowledge source."}

    formatted = [
        f"**From {r['source'].title()}:**\n{r['result']}"
        for r in state["results"]
    ]

    synthesis_response = router_llm.invoke([
        {
            "role": "system",
            "content": f"""Synthesize these search results to answer the original question: "{state['query']}"

- Combine information from multiple sources without redundancy
- Highlight the most relevant and actionable information
- Note any discrepancies between sources
- Keep the response concise and well-organized
- Make the Respinse , Ui Froendly and easy to Understand also if the question is related to the concept then also explain the concept in brief and in a way that interviewer can ask follow up questions"""
        },
        {"role": "user", "content": "\n\n".join(formatted)}
    ])

    return {"final_answer": synthesis_response.content}


builder = (
    StateGraph(RouterState)
    .add_node("classify", classify_query)
    .add_node("QA_agent", invoke_QA_agent)
    .add_node("web_search", invoke_Search_agent)
    .add_node("explain_agent", invoke_explain_agent)
    .add_node("synthesize", synthesize_results)
    .add_edge(START, "classify")
    .add_conditional_edges("classify", route_to_agents, ["QA_agent", "web_search", "explain_agent"])
    .add_edge("QA_agent", "synthesize")
    .add_edge("web_search", "synthesize")
    .add_edge("explain_agent", "synthesize")
    .add_edge("synthesize", END)
)

checkpointer = InMemorySaver()
graph = builder.compile(checkpointer=checkpointer)

config: RunnableConfig = {"configurable": {"thread_id": "1"}}