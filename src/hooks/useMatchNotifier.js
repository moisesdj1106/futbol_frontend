import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

// Solicita permiso de notificaciones del navegador
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  return result;
}

// Muestra una notificación nativa del navegador
function showNotification(title, body, icon) {
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
    });
  } catch { /* algunos navegadores móviles requieren service worker */ }
}

// Hook que monitorea un partido específico y notifica cambios de marcador
export function useMatchNotifier(matchId, homeTeam, awayTeam, enabled) {
  const { token } = useAuth();
  const lastScore = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!enabled || !matchId) return;

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
          const prevH = parseInt(lastScore.current.split('-')[0]);
          const prevA = parseInt(lastScore.current.split('-')[1]);

          if (hs > prevH) {
            showNotification(
              `⚽ GOL de ${homeTeam}!`,
              `${homeTeam} ${hs} - ${as_} ${awayTeam}`,
              null
            );
          } else if (as_ > prevA) {
            showNotification(
              `⚽ GOL de ${awayTeam}!`,
              `${homeTeam} ${hs} - ${as_} ${awayTeam}`,
              null
            );
          }
          lastScore.current = current;
        }
      } catch { /* ignorar errores de red */ }
    };

    check();
    intervalRef.current = setInterval(check, 30000);
    return () => clearInterval(intervalRef.current);
  }, [matchId, enabled, token]);
}
