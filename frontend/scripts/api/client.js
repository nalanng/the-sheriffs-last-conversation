/**
 * Centralized API client — all backend calls go through here.
 */

const API_BASE = window.location.origin;

export async function startSession() {
    const res = await fetch(`${API_BASE}/start`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to start session");
    return res.json(); // { session_id, opening_line }
}

export async function sendChat(sessionId, message) {
    const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message }),
    });
    if (!res.ok) throw new Error("Failed to send message");
    return res.json(); // { response, stage, message_count, ended, sentiment }
}

export async function resetSession(sessionId) {
    const res = await fetch(`${API_BASE}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
    });
    if (!res.ok) throw new Error("Failed to reset session");
    return res.json(); // { session_id }
}

export async function fetchLetter(sessionId) {
    const res = await fetch(`${API_BASE}/export/${sessionId}/letter`);
    if (!res.ok) throw new Error("Failed to fetch letter");
    return res.json(); // { letter }
}
