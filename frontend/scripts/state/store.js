/**
 * Central state store — single source of truth for all app state.
 */

const state = {
    sessionId: null,
    currentStage: 1,
    prevStage: 1,
    ended: false,
    messageCount: 0,
    currentSentiment: "calm",
    lastUserMessageEl: null,
};

export function getState() {
    return state;
}

export function setState(updates) {
    Object.assign(state, updates);
}

export function resetState() {
    state.sessionId = null;
    state.currentStage = 1;
    state.prevStage = 1;
    state.ended = false;
    state.messageCount = 0;
    state.currentSentiment = "calm";
    state.lastUserMessageEl = null;
}
