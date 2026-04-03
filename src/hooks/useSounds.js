// Genera sonidos con Web Audio API, sin archivos externos
export function useSounds() {
  const ctx = () => new (window.AudioContext || window.webkitAudioContext)();

  const whistle = () => {
    const ac = ctx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2800, ac.currentTime);
    osc.frequency.linearRampToValueAtTime(3200, ac.currentTime + 0.08);
    osc.frequency.linearRampToValueAtTime(2600, ac.currentTime + 0.18);
    gain.gain.setValueAtTime(0.4, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.22);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.22);
  };

  const goal = () => {
    const ac = ctx();
    // Crowd roar simulado con noise + filtro
    const bufferSize = ac.sampleRate * 1.5;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = ac.createBufferSource();
    source.buffer = buffer;

    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 600;
    filter.Q.value = 0.5;

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0.6, ac.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0.8, ac.currentTime + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 1.5);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    source.start();

    // Tono de celebración encima
    const osc = ac.createOscillator();
    const og = ac.createGain();
    osc.connect(og); og.connect(ac.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, ac.currentTime);
    osc.frequency.setValueAtTime(550, ac.currentTime + 0.15);
    osc.frequency.setValueAtTime(660, ac.currentTime + 0.3);
    og.gain.setValueAtTime(0.15, ac.currentTime);
    og.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.6);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.6);
  };

  const finalWhistle = () => {
    // Tres pitidos cortos
    [0, 0.35, 0.7].forEach(delay => {
      const ac = ctx();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      osc.type = 'sine';
      osc.frequency.value = 3000;
      gain.gain.setValueAtTime(0.35, ac.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + 0.18);
      osc.start(ac.currentTime + delay);
      osc.stop(ac.currentTime + delay + 0.2);
    });
  };

  return { whistle, goal, finalWhistle };
}
