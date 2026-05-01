/**
 * Stage transition effects — flash, shake, lyrics, text update.
 */

import { show as showLyrics } from "./lyrics.js";

const STAGE_TEXTS = {
    1: "The sheriff speaks with a fire still burning...",
    2: "His voice grows softer... the fight is leaving him...",
    3: "Barely a whisper now...",
};

/* Stage direction narrations — shown in chat when stage transitions */
const STAGE_NARRATIONS = {
    2: "The sheriff's hand slips from the edge of the desk. He coughs — the lamp flickers. The room feels a little darker now.",
    3: "His breathing is barely audible. The lamp clings to its last flame. Darkness creeps in from every corner of the room.",
};

export function getNarration(stage) {
    return STAGE_NARRATIONS[stage] || null;
}

export function update(stage, prevStage) {
    // Update body stage class
    document.body.classList.remove("stage-1", "stage-2", "stage-3");
    document.body.classList.add(`stage-${stage}`);

    // Transition effects (only when stage actually changes)
    if (stage !== prevStage) {
        // Screen flash
        const flash = document.getElementById("stage-flash");
        flash.classList.remove("flash");
        void flash.offsetWidth; // reflow to restart animation
        flash.classList.add("flash");

        // Screen shake
        document.body.classList.add("screen-shake");
        setTimeout(() => document.body.classList.remove("screen-shake"), 500);

        // Dylan lyrics
        if (stage === 2 || stage === 3) {
            showLyrics(stage);
        }
    }

    // Update stage indicator text
    const stageText = document.getElementById("stage-text");
    stageText.textContent = STAGE_TEXTS[stage] || "";
}

export function clearAll() {
    document.body.classList.remove("stage-1", "stage-2", "stage-3", "ended");
}
