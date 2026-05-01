/**
 * Intro Screen — "Enter the Room" flow.
 */

import * as api from "../api/client.js";
import { setState } from "../state/store.js";
import * as chatScreen from "./chat.js";

const introEl = document.getElementById("intro-screen");
const chatEl = document.getElementById("chat-screen");

export function init() {
    document.getElementById("start-btn").addEventListener("click", start);
}

async function start() {
    try {
        const data = await api.startSession();
        setState({ sessionId: data.session_id });

        // Switch screens
        introEl.classList.add("hidden");
        chatEl.classList.remove("hidden");

        // Show opening line
        if (data.opening_line) {
            await chatScreen.showSheriffMessage(data.opening_line);
        }

        chatScreen.focusInput();
    } catch (err) {
        alert("Could not connect to the server. Make sure the backend is running.");
    }
}

export function show() {
    introEl.classList.remove("hidden");
}

export function hide() {
    introEl.classList.add("hidden");
}
