"""
LLM client — sends messages to OpenAI GPT-4o-mini and returns the response.
"""

import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

MODEL = "gpt-4o-mini"


def chat_completion(system_prompt: str, messages: list[dict], context: str = "", stage: int = 1, is_final: bool = False, user_sentiment: str = "calm") -> str:
    """
    Send a chat completion request to GPT-4o-mini.

    Args:
        system_prompt: The sheriff character system prompt.
        messages: List of {"role": "user"/"assistant", "content": "..."} dicts.
        context: RAG-retrieved historical context to inject.
        stage: Current conversation stage (1, 2, or 3) — controls max_tokens.
        user_sentiment: NLP-detected emotional tone of the user's message.

    Returns:
        The assistant's response text.
    """
    full_system = system_prompt

    # Inject sentiment awareness — sheriff responds to emotional tone
    sentiment_cues = {
        "anguished": "The stranger's voice trembles with pain. Respond with gravity and raw honesty.",
        "somber": "The stranger speaks with a heavy heart. Let your words carry understanding.",
        "calm": "The stranger is steady. Speak as you will.",
        "warm": "The stranger shows kindness. You may let your guard down a little.",
        "compassionate": "The stranger's words are full of compassion. Allow yourself vulnerability.",
    }
    cue = sentiment_cues.get(user_sentiment, "")
    if cue:
        full_system += f"\n\nSTRANGER'S TONE: {cue}"

    if context:
        full_system += f"\n\nHISTORICAL CONTEXT (use naturally in your response, do not quote directly):\n{context}"

    api_messages = [{"role": "system", "content": full_system}]
    api_messages.extend(messages)

    # Token limits per stage — enforces shorter responses as sheriff fades
    stage_tokens = {1: 250, 2: 80, 3: 60}

    # Message 10 (final) gets minimal tokens — just enough for "Knock..."
    if is_final:
        max_tokens = 10
    else:
        max_tokens = stage_tokens.get(stage, 250)

    response = client.chat.completions.create(
        model=MODEL,
        messages=api_messages,
        temperature=0.8,
        max_tokens=max_tokens,
    )

    return response.choices[0].message.content


FAREWELL_LETTER_PROMPT = """You are a literary writer channeling the voice of Sheriff Colin Baker —
a dying lawman in 1881 New Mexico, from Sam Peckinpah's "Pat Garrett & Billy the Kid."

You have just finished your LAST conversation with a stranger who sat by your deathbed.
Based on this conversation, write a deeply personal FAREWELL LETTER addressed to that stranger.

Rules:
- Write in first person as Sheriff Colin Baker.
- This is NOT a transcript. It is a letter — intimate, poetic, raw.
- Reference specific things the stranger said or asked during the conversation.
- Weave in themes from the conversation: the badge, Billy the Kid, Vietnam, Dylan, duty, regret, freedom.
- The letter should feel like a dying man's last words committed to paper.
- Structure: Start with "Dear Stranger," and end with a final farewell.
- Keep the 1881/1970s cultural atmosphere — no modern references.
- Length: 300-500 words. Make every word count.
- Write in English.
"""


def generate_farewell_letter(messages: list[dict]) -> str:
    """
    Generate a personalized farewell letter from the Sheriff
    based on the actual conversation that took place.
    """
    # Build a summary of the conversation for context
    conversation_text = ""
    for msg in messages:
        role = "Stranger" if msg["role"] == "user" else "Sheriff Baker"
        conversation_text += f"{role}: {msg['content']}\n"

    api_messages = [
        {"role": "system", "content": FAREWELL_LETTER_PROMPT},
        {
            "role": "user",
            "content": f"Here is the full conversation that took place:\n\n{conversation_text}\n\nNow write the Sheriff's farewell letter to this stranger.",
        },
    ]

    response = client.chat.completions.create(
        model=MODEL,
        messages=api_messages,
        temperature=0.85,
        max_tokens=800,
    )

    return response.choices[0].message.content
