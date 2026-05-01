"""
Conversation manager — tracks sessions, message counts,
stage transitions, and orchestrates RAG + LLM + Sentiment Analysis.
"""

import uuid
from backend.llm.sheriff_prompt import get_system_prompt, get_stage
from backend.llm.client import chat_completion, generate_farewell_letter
from backend.llm.sentiment import analyze_sentiment, generate_response_effect
from backend.rag.retriever import get_relevant_context

# In-memory session storage: {session_id: {"messages": [...], "message_count": int, "ended": bool}}
sessions: dict = {}

MAX_MESSAGES = 10  # After this, conversation ends


OPENING_LINE = (
    "You came... I heard the door. Pull up a chair, stranger. "
    "The lamp won't hold much longer, and neither will I. "
    "But I reckon I've got a few words left in me yet."
)


def create_session() -> str:
    """Create a new conversation session and return its ID with an opening line."""
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "messages": [{"role": "assistant", "content": OPENING_LINE}],
        "message_count": 0,
        "ended": False,
    }
    return session_id


def get_opening_line() -> str:
    """Return the sheriff's opening line."""
    return OPENING_LINE


def get_session(session_id: str) -> dict | None:
    """Retrieve session data, or None if not found."""
    return sessions.get(session_id)


def process_message(session_id: str, user_message: str) -> dict:
    """
    Process a user message and return the sheriff's response.

    Returns:
        {
            "response": str,
            "stage": int,
            "message_count": int,
            "ended": bool,
        }
    """
    session = sessions.get(session_id)
    if not session:
        raise ValueError("Session not found")

    if session["ended"]:
        return {
            "response": "",
            "stage": 3,
            "message_count": session["message_count"],
            "ended": True,
        }

    # Increment message count (counts user messages)
    session["message_count"] += 1
    count = session["message_count"]

    # Add user message to history
    session["messages"].append({"role": "user", "content": user_message})

    # Sentiment Analysis (3rd AI technique) — analyze user's emotional tone
    sentiment = analyze_sentiment(user_message)

    # Get current stage (for frontend visuals)
    stage = get_stage(count)

    # Get RAG context based on the user's message
    context = get_relevant_context(user_message, k=3)

    # Get stage-appropriate system prompt (message 10 gets the "Knock..." prompt)
    system_prompt = get_system_prompt(count)

    # Call LLM with stage-based token limit + user sentiment
    is_final = count >= MAX_MESSAGES
    response = chat_completion(
        system_prompt, session["messages"], context,
        stage=stage, is_final=is_final, user_sentiment=sentiment["label"]
    )

    # Add assistant response to history
    session["messages"].append({"role": "assistant", "content": response})

    # Sentiment Analysis on sheriff's response — reveals how he actually reacted
    response_sentiment = analyze_sentiment(response)

    # End conversation at message 10 or if LLM says "Knock..." early
    if count >= MAX_MESSAGES or response.strip().lower().startswith("knock"):
        session["ended"] = True

    return {
        "response": response,
        "stage": stage,
        "message_count": count,
        "ended": session["ended"],
        "sentiment": {
            "label": sentiment["label"],
            "polarity": sentiment["polarity"],
            "intensity": sentiment["intensity"],
        },
        "response_sentiment": {
            "label": response_sentiment["label"],
            "polarity": response_sentiment["polarity"],
            "effect": generate_response_effect(response_sentiment, stage, response),
        },
    }


def get_conversation_history(session_id: str) -> list[dict]:
    """Return the full message history for a session."""
    session = sessions.get(session_id)
    if not session:
        return []
    return session["messages"]


def generate_letter(session_id: str) -> str:
    """Generate a personalized farewell letter based on the conversation."""
    session = sessions.get(session_id)
    if not session:
        raise ValueError("Session not found")
    return generate_farewell_letter(session["messages"])


def reset_session(session_id: str) -> str:
    """Delete a session and create a new one."""
    sessions.pop(session_id, None)
    return create_session()
