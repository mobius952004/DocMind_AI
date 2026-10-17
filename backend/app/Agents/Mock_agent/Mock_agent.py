# from jinja2.runtime import str_join
from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Annotated
from langgraph.checkpoint.memory import MemorySaver
from pydantic import BaseModel, Field
import os
import dotenv
dotenv.load_dotenv()

if os.getenv("GROQ_API_KEY"):
    from langchain_groq import ChatGroq
    mock_model = ChatGroq(model="openai/gpt-oss-20b", temperature=0)
else:
    from langchain_google_genai import ChatGoogleGenerativeAI
    mock_model = ChatGoogleGenerativeAI(model="gemini-3.5-flash", api_key=os.getenv("GOOGLE_API_KEY"))



class Mock_State(TypedDict):
    query: str
    job_role: str
    company_name: str
    user_answer: str
    concepts: list[str]
    resume_text: str            # Context extracted from user background or resume

    # Conversation Loop
    messages: list              # Full dialog history (turn-by-turn)
    current_question: str       # Question asked in previous turn

    # Adaptive Interviewer Logic
    eval_score: int             # 1-10 rating of candidate's last answer
    eval_feedback: str          # Strengths & gaps identified
    next_action: str            # "FOLLOW_UP" | "NEXT_TOPIC" | "END_INTERVIEW"
    turn_count: int             # Current question number

    # Output to Frontend
    next_question: str
    feedback_summary: str

class evaluatestate(BaseModel):
    score: int = Field(default=6, description="Candidate score from 1 to 10")
    feedback: str = Field(default="", description="Constructive feedback on strengths and missing technical points")
    mistakes: list[str] = Field(default_factory=list, description="Specific mistakes or omissions made in the answer")
    next_action: str = Field(default="NEXT_TOPIC", description="'FOLLOW_UP', 'NEXT_TOPIC', or 'END_INTERVIEW'")

class context_state(BaseModel):
    concepts: str = Field(default="", description="Key technical concepts or topics")
    job_role: str = Field(default="Software Engineer", description="Target job role")
    company_name: str = Field(default="Tech Company", description="Target company")
    resume_summary: str = Field(default="", description="Summary of candidate's technical skills and project experience")

def extract_info(state: Mock_State):
    """Extract job role, company name, concepts, and background from initial user prompt."""
    structured_llm = mock_model.with_structured_output(context_state)
    result = structured_llm.invoke([
        {
            "role": "system",
            "content": "You are a technical interviewer. Extract the job_role, company_name, technical concepts, and a brief resume/project summary from the candidate's input."
        },
        {
            "role": "user",
            "content": f"Extract info from: '{state.get('query', '')}'"
        }
    ])
    return {
        "concepts": result.concepts,
        "job_role": result.job_role,
        "company_name": result.company_name,
        "resume_text": getattr(result, "resume_summary", state.get("query", "")),
        "current_question": "",
    }

def evaluate_answer(state: Mock_State):
    """Review candidate's answer, assign score, detailed feedback, and next action."""
    structured_llm = mock_model.with_structured_output(evaluatestate)
    result = structured_llm.invoke([
        {
            "role": "system",
            "content": """You are an expert technical interviewer evaluating a candidate's response.
Score the response from 1 to 10.
Set next_action:
- FOLLOW_UP: If candidate made mistakes or missed key architectural details.
- NEXT_TOPIC: If candidate gave a solid, complete answer.
- END_INTERVIEW: If candidate asks to stop or completed session."""
        },
        {
            "role": "user",
            "content": f"""Question Asked: {state.get('current_question', '')}
Candidate Answer: {state.get('user_answer', state.get('query', ''))}"""
        }
    ])
    return {
        "score": result.score,
        "feedback": result.feedback,
        "mistakes": result.mistakes,
        "next_action": result.next_action,
    }

def generate_questions(state: Mock_State):
    """Generate the next single interview question or follow-up question based on evaluation."""
    concepts_str = ", ".join(state.get("concepts", [])) if isinstance(state.get("concepts"), list) else str(state.get("concepts", ""))
    
    prompt = f"""You are a senior technical interviewer conducting a realistic, 1-on-1 mock interview.

Target Role: {state.get("job_role", "Software Engineer")}
Target Company: {state.get("company_name", "Tech Company")}
Key Concepts: {concepts_str}
Candidate Experience & Projects: {state.get("resume_text", "")}

Interview Progress:
- Previous Question: {state.get("current_question", "None (First turn)")}
- Candidate Answer: {state.get("user_answer", state.get("query", ""))}
- Score: {state.get("score", "")}/10
- Evaluation Feedback: {state.get("feedback", "")}
- Identified Gaps/Mistakes: {state.get("mistakes", [])}
- Next Action: {state.get("next_action", "NEXT_TOPIC")}

CRITICAL INTERVIEW RULES:
1. ASK EXACTLY ONE QUESTION: Never ask a list of questions, bullet points, multiple sub-questions, or an exam paper. The candidate must answer one topic at a time.
2. NATURAL CONVERSATIONAL TONE: Speak directly to the candidate (e.g. "Welcome! Let's start with your real-time chat application...", or "Good point. Let's dig into that...").
3. TEXT-ONLY CONVERSATION: Never ask the candidate to sketch, draw, or upload diagrams. Ask them to explain concepts verbally, describe architecture in text, or provide short code/pseudocode.
4. ADAPTIVE PROGRESSION:
   - If Next Action is FOLLOW_UP: Acknowledge their point, gently challenge their omission/mistake, and ask ONE focused follow-up question.
   - If Next Action is NEXT_TOPIC: Acknowledge their good answer, and smoothly ask ONE fresh question on a different aspect of their stack or role.
   - If Next Action is END_INTERVIEW: Congratulate the candidate, give a brief performance summary, and conclude.
"""
    response = mock_model.invoke(prompt)
    question_text = response.content if hasattr(response, 'content') else str(response)
    return {
        "questions": question_text,
        "current_question": question_text,
    }

def route_start(state: Mock_State):
    """Route to extract_info on the very first turn, or evaluate_answer once an interview question is active."""
    if state.get("current_question"):
        return "evaluate_answer"
    return "extract_info"

builder = StateGraph(Mock_State)
builder.add_node("extract_info", extract_info)
builder.add_node("evaluate_answer", evaluate_answer)
builder.add_node("generate_questions", generate_questions)
builder.add_conditional_edges(START, route_start, ["extract_info", "evaluate_answer"])
builder.add_edge("extract_info", "generate_questions")
builder.add_edge("evaluate_answer", "generate_questions")
builder.add_edge("generate_questions", END)



checkpointer = MemorySaver()
mock_agent = builder.compile(checkpointer=checkpointer)