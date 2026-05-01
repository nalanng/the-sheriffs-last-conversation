/**
 * Narration module — reads the sheriff's farewell letter aloud
 * using the Web Speech API with a deep, slow, weathered voice.
 */

let currentUtterance = null;
let isSpeaking = false;

/**
 * Find the best male English voice available in the browser.
 * Prefers deeper / older-sounding voices.
 */
function pickVoice() {
    const voices = speechSynthesis.getVoices();

    // Priority: deep male English voices commonly found across browsers
    const preferred = [
        "Google UK English Male",
        "Microsoft David",
        "Microsoft Mark",
        "Daniel",
        "Google US English",
        "Alex",
        "Fred",
    ];

    for (const name of preferred) {
        const v = voices.find(
            (v) => v.name.includes(name) && v.lang.startsWith("en")
        );
        if (v) return v;
    }

    // Fallback: any English male voice
    const anyMale = voices.find(
        (v) =>
            v.lang.startsWith("en") &&
            (v.name.toLowerCase().includes("male") ||
                v.name.includes("David") ||
                v.name.includes("Mark") ||
                v.name.includes("Daniel") ||
                v.name.includes("James"))
    );
    if (anyMale) return anyMale;

    // Last resort: any English voice
    return voices.find((v) => v.lang.startsWith("en")) || voices[0] || null;
}

/**
 * Speak the given text in the sheriff's weathered voice.
 * Returns a Promise that resolves when speaking finishes.
 *
 * @param {string} text - The letter text to read aloud
 * @param {object} [callbacks] - Optional event callbacks
 * @param {function} [callbacks.onStart] - Called when speech begins
 * @param {function} [callbacks.onEnd] - Called when speech ends
 * @param {function} [callbacks.onWord] - Called on each word boundary (charIndex)
 */
export function speak(text, callbacks = {}) {
    return new Promise((resolve, reject) => {
        if (!("speechSynthesis" in window)) {
            reject(new Error("Speech synthesis not supported"));
            return;
        }

        // Stop any current narration
        stop();

        const utterance = new SpeechSynthesisUtterance(text);
        currentUtterance = utterance;

        // Sheriff voice config — deep, slow, deliberate
        utterance.rate = 0.75;   // Slow, weathered pace
        utterance.pitch = 0.8;   // Deep tone
        utterance.volume = 1.0;

        const voice = pickVoice();
        if (voice) utterance.voice = voice;

        utterance.onstart = () => {
            isSpeaking = true;
            callbacks.onStart?.();
        };

        utterance.onend = () => {
            isSpeaking = false;
            currentUtterance = null;
            callbacks.onEnd?.();
            resolve();
        };

        utterance.onerror = (e) => {
            isSpeaking = false;
            currentUtterance = null;
            callbacks.onEnd?.();
            // 'canceled' is not a real error, just a stop() call
            if (e.error === "canceled" || e.error === "interrupted") {
                resolve();
            } else {
                reject(e);
            }
        };

        utterance.onboundary = (e) => {
            if (e.name === "word") {
                callbacks.onWord?.(e.charIndex);
            }
        };

        // Chrome bug workaround: voices may not be loaded yet
        if (speechSynthesis.getVoices().length === 0) {
            speechSynthesis.addEventListener("voiceschanged", () => {
                const v = pickVoice();
                if (v) utterance.voice = v;
                speechSynthesis.speak(utterance);
            }, { once: true });
        } else {
            speechSynthesis.speak(utterance);
        }
    });
}

/** Stop current narration. */
export function stop() {
    if (speechSynthesis.speaking || speechSynthesis.pending) {
        speechSynthesis.cancel();
    }
    isSpeaking = false;
    currentUtterance = null;
}

/** Is narration currently playing? */
export function isNarrating() {
    return isSpeaking;
}

// Pre-load voices on module import
if ("speechSynthesis" in window) {
    speechSynthesis.getVoices();
}
