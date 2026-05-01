/**
 * The Sheriff's Last Conversation
 * Full application: particles, typewriter, lyrics overlay, Web Audio knock, end sequence.
 */

const API_BASE = window.location.origin;

// ─── State ───────────────────────────────────────────────────────────
let sessionId = null;
let currentStage = 1;
let ended = false;
let messageCount = 0;
let currentSentiment = "calm"; // NLP-detected user emotion

// ─── DOM ─────────────────────────────────────────────────────────────
const introScreen  = document.getElementById("intro-screen");
const chatScreen   = document.getElementById("chat-screen");
const endScreen    = document.getElementById("end-screen");
const chatMessages = document.getElementById("chat-messages");
const userInput    = document.getElementById("user-input");
const sendBtn      = document.getElementById("send-btn");
const startBtn     = document.getElementById("start-btn");
const exportBtn    = document.getElementById("export-btn");
const restartBtn   = document.getElementById("restart-btn");
const stageText    = document.getElementById("stage-text");
const lyricsOverlay = document.getElementById("lyrics-overlay");
const canvas       = document.getElementById("particles");
const ctx          = canvas.getContext("2d");

// ─── Event Listeners ─────────────────────────────────────────────────
startBtn.addEventListener("click", startConversation);
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !sendBtn.disabled) sendMessage();
});
exportBtn.addEventListener("click", exportLetter);
restartBtn.addEventListener("click", restartConversation);

// =====================================================================
//  1. PARTICLE SYSTEM  — dust motes drifting in lamplight
// =====================================================================
let particles = [];
const PARTICLE_COUNT = 60;

function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function initParticles() {
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
}

function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Lamp intensity factor — dims with stage
    const intensityMap = { 1: 1, 2: 0.55, 3: 0.2 };
    const intensity = ended ? 0 : (intensityMap[currentStage] || 1);

    for (const p of particles) {
        p.x += p.dx;
        p.y += p.dy;
        p.pulse += 0.015;

        // Wrap around edges
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        const glow = (Math.sin(p.pulse) + 1) / 2;
        const a = p.alpha * intensity * (0.6 + glow * 0.4);

        // Sentiment-reactive particle color
        const particleColor = sentimentParticleColor(currentSentiment);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particleColor}, ${a})`;
        ctx.fill();
    }

    requestAnimationFrame(drawParticles);
}

// Sentiment → particle color mapping
function sentimentParticleColor(label) {
    const colors = {
        anguished:     "200, 60, 60",    // deep red
        somber:        "100, 120, 180",  // steel blue
        calm:          "255, 200, 120",  // default amber
        warm:          "255, 160, 40",   // bright orange-gold
        compassionate: "100, 220, 140",  // soft green
    };
    return colors[label] || colors.calm;
}

initParticles();
drawParticles();

// =====================================================================
//  2. TYPEWRITER EFFECT  — sheriff's words appear letter by letter
// =====================================================================
function typewriterAppend(container, text, speed = 30) {
    return new Promise((resolve) => {
        const cursor = document.createElement("span");
        cursor.classList.add("typewriter-cursor");
        container.appendChild(cursor);

        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                container.insertBefore(
                    document.createTextNode(text[i]),
                    cursor
                );
                i++;
                // Auto-scroll while typing
                chatMessages.scrollTop = chatMessages.scrollHeight;
            } else {
                clearInterval(interval);
                cursor.remove();
                resolve();
            }
        }, speed);
    });
}

// =====================================================================
//  3. LYRICS OVERLAY  — ghostly Dylan lyrics at stage transitions
// =====================================================================
const LYRICS = [
    // Stage 1 → 2 transition
    ["Mama, take this badge off of me", "I can't use it anymore..."],
    // Stage 2 → 3 transition
    ["It's gettin' dark, too dark to see", "I feel like I'm knockin' on heaven's door..."],
];

function showLyrics(lines) {
    lyricsOverlay.innerHTML = "";
    lines.forEach((line, idx) => {
        const p = document.createElement("p");
        p.classList.add("lyric-line");
        p.textContent = line;
        p.style.animationDelay = `${idx * 2}s`;
        lyricsOverlay.appendChild(p);
    });
    // Clear after animation
    setTimeout(() => { lyricsOverlay.innerHTML = ""; }, (lines.length * 2 + 4) * 1000);
}

// =====================================================================
//  4. WEB AUDIO  — synthesised knock sound (no mp3 needed)
// =====================================================================
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

function playKnock() {
    const ac = getAudioContext();
    const now = ac.currentTime;

    // Three knocks, spaced apart
    for (let i = 0; i < 3; i++) {
        const t = now + i * 0.45;

        // Noise burst for the "hit" — filtered white noise
        const bufferSize = ac.sampleRate * 0.08;
        const noiseBuffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let j = 0; j < bufferSize; j++) {
            data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufferSize * 0.15));
        }
        const noise = ac.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = ac.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 400;
        filter.Q.value = 2;

        const noiseGain = ac.createGain();
        noiseGain.gain.setValueAtTime(0.6, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ac.destination);
        noise.start(t);
        noise.stop(t + 0.15);

        // Low thud oscillator
        const osc = ac.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);

        const oscGain = ac.createGain();
        oscGain.gain.setValueAtTime(0.5, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        osc.connect(oscGain);
        oscGain.connect(ac.destination);
        osc.start(t);
        osc.stop(t + 0.25);
    }
}

// =====================================================================
//  5. CONVERSATION FLOW
// =====================================================================

async function startConversation() {
    try {
        const res = await fetch(`${API_BASE}/start`, { method: "POST" });
        const data = await res.json();
        sessionId = data.session_id;

        // Transition screens
        introScreen.classList.add("hidden");
        chatScreen.classList.remove("hidden");
        userInput.focus();

        // Show the sheriff's opening line if returned
        if (data.opening_line) {
            await appendSheriffMessage(data.opening_line);
        }
    } catch (err) {
        alert("Could not connect to the server. Make sure the backend is running.");
    }
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text || ended) return;

    userInput.disabled = true;
    sendBtn.disabled = true;

    appendUserMessage(text);
    userInput.value = "";

    const typingEl = showTyping();

    try {
        const res = await fetch(`${API_BASE}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId, message: text }),
        });
        const data = await res.json();

        removeTyping(typingEl);

        // Update sentiment from NLP analysis
        if (data.sentiment) {
            currentSentiment = data.sentiment.label;
            applySentimentEffects(data.sentiment);
        }

        // Show sheriff's response with typewriter
        await appendSheriffMessage(data.response);

        // Update stage effects
        updateStage(data.stage, data.message_count);
        messageCount = data.message_count;

        if (data.ended) {
            ended = true;
            endConversation();
        } else {
            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();
        }
    } catch (err) {
        removeTyping(typingEl);
        await appendSheriffMessage("...*coughs*... I can't... the words won't come...");
        userInput.disabled = false;
        sendBtn.disabled = false;
    }
}

// ─── Message DOM helpers ─────────────────────────────────────────────
let lastUserMessageEl = null;

function appendUserMessage(text) {
    const div = document.createElement("div");
    div.classList.add("message", "user");
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    lastUserMessageEl = div;
}

async function appendSheriffMessage(text) {
    const div = document.createElement("div");
    div.classList.add("message", "sheriff");

    const speaker = document.createElement("span");
    speaker.classList.add("speaker");
    speaker.textContent = "Sheriff Baker";
    div.appendChild(speaker);

    const content = document.createElement("span");
    content.classList.add("sheriff-text");
    div.appendChild(content);

    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Typewriter — speed slows in later stages (words heavier)
    const speeds = { 1: 28, 2: 40, 3: 60 };
    const speed = speeds[currentStage] || 28;
    await typewriterAppend(content, text, speed);
}

function showTyping() {
    const div = document.createElement("div");
    div.classList.add("typing-indicator");
    div.textContent = "The sheriff is gathering his words...";
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return div;
}

function removeTyping(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
}

// ─── Stage Effects ───────────────────────────────────────────────────
let prevStage = 1;

function updateStage(stage, count) {
    currentStage = stage;

    document.body.classList.remove("stage-1", "stage-2", "stage-3");
    document.body.classList.add(`stage-${stage}`);

    // Stage transition: flash + lyrics
    if (stage !== prevStage) {
        // Screen flash
        const flash = document.getElementById("stage-flash");
        flash.classList.remove("flash");
        void flash.offsetWidth;          // reflow to restart animation
        flash.classList.add("flash");

        // Subtle screen shake
        document.body.classList.add("screen-shake");
        setTimeout(() => document.body.classList.remove("screen-shake"), 500);

        // Show lyrics for this transition
        if (stage === 2) showLyrics(LYRICS[0]);
        if (stage === 3) showLyrics(LYRICS[1]);

        prevStage = stage;
    }

    // Update stage text
    const texts = {
        1: "The sheriff speaks with a fire still burning...",
        2: "His voice grows softer... the fight is leaving him...",
        3: "Barely a whisper now...",
    };
    stageText.textContent = texts[stage] || "";
}

// ─── Sentiment Effects ──────────────────────────────────────────────
function applySentimentEffects(sentiment) {
    // Add sentiment CSS class to body for lamp/glow color shifts
    document.body.classList.remove(
        "sentiment-anguished", "sentiment-somber",
        "sentiment-calm", "sentiment-warm", "sentiment-compassionate"
    );
    document.body.classList.add(`sentiment-${sentiment.label}`);

    // Tag the user's message bubble with sentiment indicator
    if (lastUserMessageEl) {
        lastUserMessageEl.classList.add(`sentiment-${sentiment.label}`);

        // Add subtle sentiment dot indicator
        const dot = document.createElement("span");
        dot.classList.add("sentiment-dot", `dot-${sentiment.label}`);
        dot.title = `Tone: ${sentiment.label}`;
        lastUserMessageEl.appendChild(dot);
    }
}

// ─── End Sequence ────────────────────────────────────────────────────
function endConversation() {
    // Play knock sound
    playKnock();

    // Apply ended visual state (darkness descends)
    document.body.classList.add("ended");

    // Disable input
    userInput.disabled = true;
    sendBtn.disabled = true;

    // After a pause, transition to end screen
    setTimeout(() => {
        chatScreen.classList.add("hidden");
        endScreen.classList.remove("hidden");

        // Play one more knock on the end screen
        setTimeout(() => playKnock(), 2000);
    }, 5000);
}

// ─── Export Letter ───────────────────────────────────────────────────
async function exportLetter() {
    // Disable button while generating
    exportBtn.disabled = true;
    exportBtn.textContent = "The Sheriff is writing his last letter...";

    try {
        const res = await fetch(`${API_BASE}/export/${sessionId}/letter`);
        const data = await res.json();

        let letter = "THE SHERIFF'S LAST LETTER TO YOU\n";
        letter += "=".repeat(48) + "\n\n";
        letter += "New Mexico, 1881\n\n";
        letter += "-".repeat(48) + "\n\n";
        letter += data.letter + "\n\n";
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

// ─── Restart ─────────────────────────────────────────────────────────
async function restartConversation() {
    try {
        const res = await fetch(`${API_BASE}/reset`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId }),
        });
        const data = await res.json();
        sessionId = data.session_id;
    } catch (err) {
        // Start fresh on failure
    }

    ended = false;
    currentStage = 1;
    prevStage = 1;
    messageCount = 0;
    currentSentiment = "calm";
    lastUserMessageEl = null;
    document.body.classList.remove(
        "stage-1", "stage-2", "stage-3", "ended",
        "sentiment-anguished", "sentiment-somber",
        "sentiment-calm", "sentiment-warm", "sentiment-compassionate"
    );
    chatMessages.innerHTML = "";
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.value = "";

    endScreen.classList.add("hidden");
    introScreen.classList.remove("hidden");
}
