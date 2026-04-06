import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

// Sonido de gol con Web Audio API
function playGoalSound() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();

    // Crowd roar
    const bufferSize = ac.sampleRate * 1.2;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ac.createBufferSource();
    noise.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 500;
    filter.Q.value = 0.4;
    const noiseGain = ac.createGain();
    noiseGain.gain.setValueAtTime(0, ac.currentTime);
    noiseGain.gain.linearRampToValueAtTime(0.5, ac.currentTime + 0.1);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 1.2);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ac.destination);
    noise.start();

    // Tono de celebración
    [0, 0.15, 0.3].forEach((delay, i) => {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.connect(g); g.connect(ac.destination);
      osc.type = 'square';
      osc.frequency.value = [440, 550, 660][i];
      g.gain.setValueAtTime(0.12, ac.currentTime + delay);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + 0.25);
      osc.start(ac.currentTime + delay);
      osc.stop(ac.currentTime + delay + 0.3);
    });
  } catch { /* ignorar si el navegador bloquea */ }
}

// Notificación nativa del navegador
function showNotification(title, body) {
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon: '/favicon.ico', badge: '/favicon.ico' });
  } catch { /* ignorar */ }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return await Notification.requestPermission();
}

// Hook que monitorea UN partido y detecta cambios de marcador
export function useMatchNotifier(matchId, homeTeam, awayTeam, enabled, token) {
  const lastScore = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!enabled || !matchId || !token) return;

    const check = async () => {
      try {
        const res = await fetch(`${API_URL}/api/teams/match/${matchId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data || data.status === 'UNAVAILABLE') return;

        const hs = data.score?.fullTime?.home ?? data.score?.halfTime?.home ?? 0;
        const as_ = data.score?.fullTime?.away ?? data.score?.halfTime?.away ?? 0;
        const current = `${hs}-${as_}`;

        if (lastScore.current === null) {
          lastScore.current = current;
          return;
        }

        if (current !== lastScore.current) {
          const [prevH, prevA] = lastScore.current.split('-').map(Number);
          lastScore.current = current;

          playGoalSound();

          if (hs > prevH) {
            showNotification(`⚽ GOL de ${homeTeam}!`, `${homeTeam} ${hs} - ${as_} ${awayTeam}`);
          } else if (as_ > prevA) {
            showNotification(`⚽ GOL de ${awayTeam}!`, `${homeTeam} ${hs} - ${as_} ${awayTeam}`);
          } else {
            showNotification(`📊 Marcador actualizado`, `${homeTeam} ${hs} - ${as_} ${awayTeam}`);
          }
        }
      } catch { /* ignorar errores de red */ }
    };

    // Ejecutar inmediatamente y luego cada 30s
    check();
    intervalRef.current = setInterval(check, 30000);

    return () => {
      clearInterval(intervalRef.current);
      lastScore.current = null;
    };
  }, [matchId, enabled, token]);
}
