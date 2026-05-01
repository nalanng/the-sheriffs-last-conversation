/**
 * Particle system — dust motes drifting in lamplight.
 * Reads currentStage, ended, currentSentiment from store.
 */

import { getState } from "../state/store.js";

const PARTICLE_COUNT = 60;
let particles = [];
let canvas, ctx;

const SENTIMENT_COLORS = {
    anguished:     "200, 60, 60",
    somber:        "100, 120, 180",
    calm:          "255, 200, 120",
    warm:          "255, 160, 40",
    compassionate: "100, 220, 140",
};

export function init() {
    canvas = document.getElementById("particles");
    ctx = canvas.getContext("2d");

    resize();
    window.addEventListener("resize", resize);

    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.8 + 0.4,
            dx: (Math.random() - 0.5) * 0.3,
            dy: -Math.random() * 0.25 - 0.05,
            alpha: Math.random() * 0.4 + 0.1,
            pulse: Math.random() * Math.PI * 2,
        });
    }

    draw();
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { currentStage, ended, currentSentiment } = getState();
    const intensityMap = { 1: 1, 2: 0.55, 3: 0.2 };
    const intensity = ended ? 0 : (intensityMap[currentStage] || 1);
    const color = SENTIMENT_COLORS[currentSentiment] || SENTIMENT_COLORS.calm;

    for (const p of particles) {
        p.x += p.dx;
        p.y += p.dy;
        p.pulse += 0.015;

        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        const glow = (Math.sin(p.pulse) + 1) / 2;
        const a = p.alpha * intensity * (0.6 + glow * 0.4);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${a})`;
        ctx.fill();
    }

    requestAnimationFrame(draw);
}
