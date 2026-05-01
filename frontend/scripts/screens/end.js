/**
 * End Screen — knock sound, darkness, letter export, narration, restart.
 */

import * as api from "../api/client.js";
import { getState, resetState } from "../state/store.js";
import { playKnock } from "../components/audio.js";
import * as narration from "../components/narration.js";
import * as sentiment from "../components/sentiment.js";
import * as stage from "../components/stage.js";
import * as chatScreen from "./chat.js";
import * as introScreen from "./intro.js";

const chatEl = document.getElementById("chat-screen");
const endEl = document.getElementById("end-screen");
const exportBtn = document.getElementById("export-btn");
const listenBtn = document.getElementById("listen-btn");
const restartBtn = document.getElementById("restart-btn");
const letterDisplay = document.getElementById("letter-display");
const letterText = document.getElementById("letter-text");

let cachedLetter = null;

export function init() {
    exportBtn.addEventListener("click", exportLetter);
    listenBtn.addEventListener("click", listenToLetter);
    restartBtn.addEventListener("click", restart);
}

export function beginEndSequence() {
    playKnock();
    document.body.classList.add("ended");
    cachedLetter = null;

    // Disable chat input
    document.getElementById("user-input").disabled = true;
    document.getElementById("send-btn").disabled = true;

    // Transition to end screen after pause
    setTimeout(() => {
        chatEl.classList.add("hidden");
        endEl.classList.remove("hidden");
        setTimeout(() => playKnock(), 2000);
    }, 5000);
}

/** Fetch letter from API (cached after first call). */
async function fetchLetterText() {
    if (cachedLetter) return cachedLetter;
    const data = await api.fetchLetter(getState().sessionId);
    cachedLetter = data.letter;
    return cachedLetter;
}

async function listenToLetter() {
    // If already narrating, stop
    if (narration.isNarrating()) {
        narration.stop();
        listenBtn.textContent = "Listen to the Sheriff's Last Letter";
        listenBtn.classList.remove("narrating");
        letterDisplay.classList.add("hidden");
        return;
    }

    listenBtn.disabled = true;
    listenBtn.textContent = "The Sheriff gathers his last breath...";

    try {
        const text = await fetchLetterText();

        // Show letter on screen while reading
        letterText.textContent = text;
        letterDisplay.classList.remove("hidden");
        letterDisplay.scrollTop = 0;

        listenBtn.disabled = false;
        listenBtn.textContent = "Stop Narration";
        listenBtn.classList.add("narrating");

        await narration.speak(text, {
            onEnd: () => {
                listenBtn.textContent = "Listen Again";
                listenBtn.classList.remove("narrating");
            },
        });
    } catch (err) {
        letterDisplay.classList.add("hidden");
        listenBtn.textContent = "Listen to the Sheriff's Last Letter";
        if (err.message === "Speech synthesis not supported") {
            alert("Your browser does not support voice narration.");
        } else {
            alert("Could not generate the letter. Please try again.");
        }
    } finally {
        listenBtn.disabled = false;
    }
}

async function exportLetter() {
    exportBtn.disabled = true;
    exportBtn.textContent = "The Sheriff is writing his last letter...";

    try {
        const text = await fetchLetterText();

        let letter = "THE SHERIFF'S LAST LETTER TO YOU\n";
        letter += "=".repeat(48) + "\n\n";
        letter += "New Mexico, 1881\n\n";
        letter += "-".repeat(48) + "\n\n";
        letter += text + "\n\n";
        letter += "-".repeat(48) + "\n\n";
        letter += '"Mama, take this badge off of me\n';
        letter += 'I can\'t use it anymore"\n';
        letter += "  \u2014 Bob Dylan, Knockin' on Heaven's Door (1973)\n";

        const blob = new Blob([letter], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "sheriffs-last-letter.txt";
        a.click();
        URL.revokeObjectURL(url);
    } catch (err) {
        alert("Could not generate the letter. Please try again.");
    } finally {
        exportBtn.disabled = false;
        exportBtn.textContent = "Download the Sheriff's Last Letter";
    }
}

async function restart() {
    narration.stop();
    cachedLetter = null;

    try {
        const data = await api.resetSession(getState().sessionId);
        resetState();
    } catch (err) {
        resetState();
    }

    // Clear all visual state
    sentiment.clearAll();
    stage.clearAll();
    chatScreen.clear();
    letterDisplay.classList.add("hidden");
    listenBtn.textContent = "Listen to the Sheriff's Last Letter";
    listenBtn.classList.remove("narrating");

    // Switch screens
    endEl.classList.add("hidden");
    introScreen.show();
}
