/**
 * Message bubble creators — dumb components.
 * Return DOM elements, know nothing about state.
 */

export function createUserBubble(text) {
    const div = document.createElement("div");
    div.classList.add("message", "user");
    div.textContent = text;
    return div;
}

export function createSheriffBubble() {
    const div = document.createElement("div");
    div.classList.add("message", "sheriff");

    const speaker = document.createElement("span");
    speaker.classList.add("speaker");
    speaker.textContent = "Sheriff Baker";
    div.appendChild(speaker);

    const content = document.createElement("span");
    content.classList.add("sheriff-text");
    div.appendChild(content);

    return { container: div, contentEl: content };
}

export function createNarratorBubble(text) {
    const div = document.createElement("div");
    div.classList.add("message", "narrator");
    div.textContent = text;
    return div;
}

export function createTypingIndicator() {
    const div = document.createElement("div");
    div.classList.add("typing-indicator");
    div.textContent = "The sheriff is gathering his words...";
    return div;
}

export function removeElement(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
}
