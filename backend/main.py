"""
FastAPI application — The Sheriff's Last Conversation
Endpoints: /chat, /reset, /export, /start
Serves frontend static files from /frontend
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from backend.llm.conversation import (
    create_session,
    process_message,
    get_conversation_history,
    reset_session,
    get_opening_line,
    generate_letter,
)

app = FastAPI(title="The Sheriff's Last Conversation")

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request / Response models ---

class ChatRequest(BaseModel):
    session_id: str
    message: str


class SentimentData(BaseModel):
    label: str
    polarity: float
    intensity: float


class ChatResponse(BaseModel):
    response: str
    stage: int
    message_count: int
    ended: bool
    sentiment: SentimentData | None = None


class SessionResponse(BaseModel):
    session_id: str
    opening_line: str | None = None


class ExportResponse(BaseModel):
    messages: list[dict]


class LetterResponse(BaseModel):
    letter: str


# --- Endpoints ---

@app.post("/start", response_model=SessionResponse)
def start_conversation():
    """Create a new conversation session with an opening line."""
    session_id = create_session()
    return {"session_id": session_id, "opening_line": get_opening_line()}


@app.post("/chat")
def chat(req: ChatRequest):
    """Send a message to the sheriff and get his response."""
    try:
        result = process_message(req.session_id, req.message)
    except ValueError:
        raise HTTPException(status_code=404, detail="Session not found. Call /start first.")
    return JSONResponse(content=result)


@app.post("/reset", response_model=SessionResponse)
def reset(req: SessionResponse):
    """Reset the conversation and get a new session."""
    new_id = reset_session(req.session_id)
    return {"session_id": new_id}


@app.get("/export/{session_id}/letter", response_model=LetterResponse)
def export_letter(session_id: str):
    """Generate a personalized farewell letter from the Sheriff based on the conversation."""
    try:
        letter = generate_letter(session_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Session not found.")
    return {"letter": letter}


@app.get("/export/{session_id}", response_model=ExportResponse)
def export_conversation(session_id: str):
    """Export the full conversation history."""
    history = get_conversation_history(session_id)
    if not history:
        raise HTTPException(status_code=404, detail="Session not found or empty.")
    return {"messages": history}


@app.get("/health")
def health_check():
    return {"status": "alive", "character": "Sheriff Colin Baker"}


# --- Serve Frontend ---

@app.get("/")
def serve_index():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


# Mount static directories for CSS, JS, assets
app.mount("/styles", StaticFiles(directory=os.path.join(FRONTEND_DIR, "styles")), name="styles")
app.mount("/scripts", StaticFiles(directory=os.path.join(FRONTEND_DIR, "scripts")), name="scripts")
app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="assets")
