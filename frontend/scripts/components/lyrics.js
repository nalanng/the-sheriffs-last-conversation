/**
 * Dylan lyrics overlay — ghostly text at stage transitions.
 * Pure render function.
 */

const LYRICS = [
    ["Mama, take this badge off of me", "I can't use it anymore..."],
    ["It's gettin' dark, too dark to see", "I feel like I'm knockin' on heaven's door..."],
];

export function show(stageNum) {
    const overlay = document.getElementById("lyrics-overlay");
    const lines = stageNum === 2 ? LYRICS[0] : LYRICS[1];

    overlay.innerHTML = "";
    lines.forEach((line, idx) => {
        const p = document.createElement("p");
        p.classList.add("lyric-line");
        p.textContent = line;
        p.style.animationDelay = `${idx * 2}s`;
        overlay.appendChild(p);
    });

    setTimeout(() => { overlay.innerHTML = ""; }, (lines.length * 2 + 4) * 1000);
}
