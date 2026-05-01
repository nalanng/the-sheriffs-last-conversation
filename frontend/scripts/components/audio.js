/**
 * Web Audio knock synthesizer — no mp3 needed.
 * Pure function: generates three-knock sound.
 */

let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

export function playKnock() {
    const ac = getAudioContext();
    const now = ac.currentTime;

    for (let i = 0; i < 3; i++) {
        const t = now + i * 0.45;

        // Noise burst — filtered white noise
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
