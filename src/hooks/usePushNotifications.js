import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const { token } = useAuth();
  const [permission, setPermission] = useState(Notification.permission);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    setSubscribed(!!sub);
  };

  const subscribe = async () => {
    if (!('serviceWorker' in navigator)) {
      alert('Tu navegador no soporta notificaciones push');
      return;
    }
    setLoading(true);
    try {
      // Registrar service worker
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Pedir permiso
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return;

      // Obtener clave pública del backend
      const keyRes = await fetch(`${API_URL}/api/push/vapid-public-key`);
      const { publicKey } = await keyRes.json();

      // Suscribirse
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Guardar suscripción en el backend
      await fetch(`${API_URL}/api/teams/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      setSubscribed(true);
    } catch (err) {
      console.error('Error suscribiendo:', err);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    setSubscribed(false);
  };

  const supported = 'serviceWorker' in navigator && 'PushManager' in window;

  return { permission, subscribed, loading, supported, subscribe, unsubscribe };
}
