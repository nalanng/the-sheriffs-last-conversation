/**
 * Sentiment visual effects — dumb component.
 * Applies CSS classes and labeled indicators based on sentiment label.
 * Effect text is derived from the sheriff's actual response tone.
 */

const ALL_CLASSES = [
    "sentiment-anguished", "sentiment-somber",
    "sentiment-calm", "sentiment-warm", "sentiment-compassionate"
];

/* Human-readable label for the user's tone */
const SENTIMENT_LABELS = {
    anguished:     "anguished",
    somber:        "somber",
    calm:          "calm",
    warm:          "warm",
    compassionate: "compassionate",
};

export function apply(sentimentData, userMessageEl) {
    const label = sentimentData.label;

    // Update body class for lamp glow
    document.body.classList.remove(...ALL_CLASSES);
    document.body.classList.add(`sentiment-${label}`);

    // Tag user message bubble with sentiment label
    if (userMessageEl) {
        userMessageEl.classList.add(`sentiment-${label}`);

        const badge = document.createElement("span");
        badge.classList.add("sentiment-badge", `badge-${label}`);

        const dot = document.createElement("span");
        dot.classList.add("sentiment-dot", `dot-${label}`);

        const text = document.createElement("span");
        text.classList.add("sentiment-label");
        text.textContent = SENTIMENT_LABELS[label] || label;

        badge.appendChild(dot);
        badge.appendChild(text);
        userMessageEl.appendChild(badge);
    }
}

export function applyResponseEffect(responseSentiment, sheriffMessageEl) {
    const effect = responseSentiment && responseSentiment.effect;
    if (!effect || !sheriffMessageEl) return;

    const effectEl = document.createElement("span");
    effectEl.classList.add("response-effect");
    effectEl.textContent = effect;
    sheriffMessageEl.appendChild(effectEl);
}

export function clearAll() {
    document.body.classList.remove(...ALL_CLASSES);
}
