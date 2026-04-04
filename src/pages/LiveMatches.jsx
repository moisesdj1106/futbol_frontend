import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import API_URL from '../config';

function formatDate(utcDate) {
  const d = new Date(utcDate);
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}
function formatTime(utcDate) {
  return new Date(utcDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

const STATUS_LABEL = {
  SCHEDULED: { label: 'Programado', color: 'var(--text-muted)' },
  IN_PLAY:   { label: 'EN VIVO',    color: 'var(--red)' },
  PAUSED:    { label: 'Descanso',   color: '#ffd700' },
  FINISHED:  { label: 'Finalizado', color: 'var(--text-muted)' },
  POSTPONED: { label: 'Aplazado',   color: 'var(--text-muted)' },
};

function MatchCard({ match, onSelect, selected }) {
  const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED';
  const status = STATUS_LABEL[match.status] || { label: match.status, color: 'var(--text-muted)' };

  return (
    <div
      onClick={() => onSelect(match)}
      style={{
        background: selected ? 'rgba(0,255,135,0.06)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${selected ? 'var(--green)' : isLive ? 'rgba(255,77,109,0.3)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 14, padding: '1rem 1.2rem',
        cursor: 'pointer', transition: 'all 0.2s',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {isLive && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, var(--red), transparent)',
          animation: 'pulse 2s infinite',
        }} />
      )}

      {/* Liga */}
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.6rem', display: 'flex', justifyContent: 'space-between' }}>
        <span>{match.competition?.name}</span>
        <span style={{ color: status.color, fontFamily: 'Orbitron', fontSize: '0.65rem', fontWeight: 700 }}>
          {isLive && <span style={{ marginRight: '0.3rem' }}>●</span>}
          {isLive ? `${match.minute || ''}' ${status.label}` : status.label}
        </span>
      </div>

      {/* Equipos y marcador */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.8rem' }}>
        {/* Local */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {match.homeTeam?.crest && <img src={match.homeTeam.crest} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />}
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{match.homeTeam?.shortName || match.homeTeam?.name}</span>
        </div>

        {/* Marcador */}
        <div style={{ textAlign: 'center' }}>
          {match.status === 'SCHEDULED' ? (
            <div style={{ fontFamily: 'Orbitron', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {formatTime(match.utcDate)}
            </div>
          ) : (
            <div style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1.3rem', color: isLive ? 'var(--green)' : 'var(--text)' }}>
              {match.score?.fullTime?.home ?? match.score?.halfTime?.home ?? '—'}
              <span style={{ color: 'var(--text-muted)', margin: '0 0.3rem' }}>:</span>
              {match.score?.fullTime?.away ?? match.score?.halfTime?.away ?? '—'}
            </div>
          )}
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {formatDate(match.utcDate)}
          </div>
        </div>

        {/* Visitante */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', justifyContent: 'flex-end' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', textAlign: 'right' }}>{match.awayTeam?.shortName || match.awayTeam?.name}</span>
          {match.awayTeam?.crest && <img src={match.awayTeam.crest} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />}
        </div>
      </div>
    </div>
  );
}

function LiveDetail({ matchId }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const intervalRef = useRef(null);

  const load = () =>
    fetch(`${API_URL}/api/teams/match/${matchId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setData);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 30000); // actualiza cada 30s
    return () => clearInterval(intervalRef.current);
  }, [matchId]);

  if (!data) return <div style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>Cargando...</div>;

  const isLive = data.status === 'IN_PLAY' || data.status === 'PAUSED';
  const goals = (data.goals || []);
  const bookings = (data.bookings || []);

  return (
    <div className="glass-card" style={{ marginTop: '1.5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ color: isLive ? 'var(--red)' : 'var(--text-muted)', fontFamily: 'Orbitron', fontSize: '0.7rem', letterSpacing: '3px', marginBottom: '0.5rem' }}>
          {isLive ? `● EN VIVO · ${data.minute || 0}'` : STATUS_LABEL[data.status]?.label || data.status}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            {data.homeTeam?.crest && <img src={data.homeTeam.crest} alt="" style={{ width: 48, height: 48, objectFit: 'contain', marginBottom: '0.4rem' }} />}
            <div style={{ fontFamily: 'Orbitron', fontSize: '0.8rem' }}>{data.homeTeam?.shortName}</div>
          </div>
          <div style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '2.5rem', color: isLive ? 'var(--green)' : 'var(--text)' }}>
            {data.score?.fullTime?.home ?? data.score?.halfTime?.home ?? 0}
            <span style={{ color: 'var(--text-muted)', margin: '0 0.5rem', fontSize: '1.5rem' }}>:</span>
            {data.score?.fullTime?.away ?? data.score?.halfTime?.away ?? 0}
          </div>
          <div style={{ textAlign: 'center' }}>
            {data.awayTeam?.crest && <img src={data.awayTeam.crest} alt="" style={{ width: 48, height: 48, objectFit: 'contain', marginBottom: '0.4rem' }} />}
            <div style={{ fontFamily: 'Orbitron', fontSize: '0.8rem' }}>{data.awayTeam?.shortName}</div>
          </div>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>{data.competition?.name} · {formatDate(data.utcDate)}</div>
        {isLive && <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.3rem' }}>Actualiza cada 30 segundos</div>}
      </div>

      {/* Eventos */}
      {(goals.length > 0 || bookings.length > 0) && (
        <div>
          <div style={{ fontFamily: 'Orbitron', color: 'var(--green)', fontSize: '0.7rem', letterSpacing: '2px', marginBottom: '0.8rem' }}>EVENTOS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {[...goals.map(g => ({ ...g, type: 'GOAL' })), ...bookings]
              .sort((a, b) => (a.minute || 0) - (b.minute || 0))
              .map((ev, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.8rem',
                  padding: '0.5rem 0.8rem', borderRadius: 8,
                  background: ev.type === 'GOAL' ? 'rgba(0,255,135,0.05)' : 'rgba(255,200,0,0.04)',
                  border: `1px solid ${ev.type === 'GOAL' ? 'rgba(0,255,135,0.12)' : 'rgba(255,200,0,0.1)'}`,
                }}>
                  <span style={{ fontFamily: 'Orbitron', fontSize: '0.68rem', color: 'var(--text-muted)', minWidth: 30 }}>{ev.minute}'</span>
                  <span>{ev.type === 'GOAL' ? '⚽' : ev.card === 'RED' ? '🟥' : '🟨'}</span>
                  <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 600 }}>{ev.scorer?.name || ev.player?.name}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ev.team?.name}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {goals.length === 0 && bookings.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem', fontSize: '0.9rem' }}>
          Sin eventos registrados aún
        </div>
      )}
    </div>
  );
}

export default function LiveMatches() {
  const { token } = useAuth();
  const { favorites } = useFavorites();
  const [tab, setTab] = useState('favorites'); // favorites | live
  const [matches, setMatches] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(false);

  // Partidos de favoritos
  useEffect(() => {
    if (tab !== 'favorites' || favorites.length === 0) return;
    setLoading(true);
    fetch(`${API_URL}/api/teams/favorites/matches`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setMatches(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [tab, favorites, token]);

  // Partidos en vivo globales
  useEffect(() => {
    if (tab !== 'live') return;
    setLoading(true);
    fetch(`${API_URL}/api/teams/live`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setLiveMatches(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [tab, token]);

  const displayMatches = tab === 'live' ? liveMatches : matches;

  return (
    <div className="page-wrapper">
      <h1 className="page-title">PARTIDOS <span>EN VIVO</span></h1>
      <p className="page-subtitle">Sigue los partidos de tus equipos favoritos en tiempo real</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[
          { key: 'favorites', label: '⭐ Mis Equipos' },
          { key: 'live', label: '🔴 En Vivo Ahora' },
        ].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSelectedMatch(null); }} style={{
            padding: '0.6rem 1.4rem', borderRadius: 10,
            border: `1px solid ${tab === t.key ? 'var(--green)' : 'rgba(255,255,255,0.08)'}`,
            background: tab === t.key ? 'rgba(0,255,135,0.1)' : 'transparent',
            color: tab === t.key ? 'var(--green)' : 'var(--text-muted)',
            cursor: 'pointer', fontWeight: 700, fontFamily: 'Rajdhani', fontSize: '0.95rem',
            transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'favorites' && favorites.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '3rem',
          background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: 16, color: 'var(--text-muted)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.8rem' }}>⭐</div>
          <div style={{ fontFamily: 'Orbitron', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Sin equipos favoritos</div>
          <div style={{ fontSize: '0.88rem' }}>Ve a la sección Equipos y sigue los que te gusten</div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>Cargando partidos...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedMatch ? '1fr 1fr' : '1fr', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {displayMatches.length === 0 && !loading && favorites.length > 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                No hay partidos próximos para tus equipos
              </div>
            )}
            {displayMatches.map(m => (
              <MatchCard
                key={m.id}
                match={m}
                selected={selectedMatch?.id === m.id}
                onSelect={setSelectedMatch}
              />
            ))}
          </div>

          {selectedMatch && (
            <div>
              <LiveDetail matchId={selectedMatch.id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
