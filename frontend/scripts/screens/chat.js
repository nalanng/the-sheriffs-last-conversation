/**
 * Chat Screen — message sending, response handling, stage + sentiment.
 */

import * as api from "../api/client.js";
import { getState, setState } from "../state/store.js";
import { createUserBubble, createSheriffBubble, createNarratorBubble, createTypingIndicator, removeElement } from "../components/message.js";
import { typewrite } from "../components/typewriter.js";
import * as sentiment from "../components/sentiment.js";
import * as stage from "../components/stage.js";
import { getNarration } from "../components/stage.js";
import * as endScreen from "./end.js";

const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

export function init() {
    sendBtn.addEventListener("click", sendMessage);
    userInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !sendBtn.disabled) sendMessage();
    });
}

async function sendMessage() {
    const text = userInput.value.trim();
    const state = getState();
    if (!text || state.ended) return;

    // Disable input
    userInput.disabled = true;
    sendBtn.disabled = true;
    userInput.value = "";

    // Append user bubble
    const userBubble = createUserBubble(text);
    chatMessages.appendChild(userBubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    setState({ lastUserMessageEl: userBubble });

    // Show typing
    const typingEl = createTypingIndicator();
    chatMessages.appendChild(typingEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const data = await api.sendChat(state.sessionId, text);
        removeElement(typingEl);

        // Sheriff response
        const sheriffBubble = await showSheriffMessage(data.response);

        // Sentiment: user label on user bubble, response effect on sheriff bubble
        if (data.sentiment) {
            setState({ currentSentiment: data.sentiment.label });
            sentiment.apply(data.sentiment, userBubble);
            sentiment.applyResponseEffect(data.response_sentiment, sheriffBubble);
        }

        // Stage update
        const prevStage = state.currentStage;
        setState({ currentStage: data.stage, messageCount: data.message_count });
        stage.update(data.stage, prevStage);
        setState({ prevStage: data.stage });

        // Show narrator stage direction on stage transition
        if (data.stage !== prevStage) {
            const narration = getNarration(data.stage);
            if (narration) {
                const narratorEl = createNarratorBubble(narration);
                chatMessages.appendChild(narratorEl);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }

        // Check end
        if (data.ended) {
            setState({ ended: true });
            endScreen.beginEndSequence();
        } else {
            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();
        }
    } catch (err) {
        removeElement(typingEl);
        await showSheriffMessage("...*coughs*... I can't... the words won't come...");
        userInput.disabled = false;
        sendBtn.disabled = false;
    }
}

export async function showSheriffMessage(text) {
    const { container, contentEl } = createSheriffBubble();
    chatMessages.appendChild(container);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const speeds = { 1: 28, 2: 40, 3: 60 };
    const speed = speeds[getState().currentStage] || 28;
    await typewrite(contentEl, text, speed);
    return container;
}

export function focusInput() {
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();
}

export function hide() {
    document.getElementById("chat-screen").classList.add("hidden");
}

export function show() {
    document.getElementById("chat-screen").classList.remove("hidden");
}

export function clear() {
    chatMessages.innerHTML = "";
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.value = "";
}
