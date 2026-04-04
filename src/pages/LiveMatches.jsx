import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import API_URL from '../config';

function formatDate(utcDate) {
  return new Date(utcDate).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
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
  const home = match.score?.fullTime?.home ?? match.score?.halfTime?.home;
  const away = match.score?.fullTime?.away ?? match.score?.halfTime?.away;

  return (
    <div onClick={() => onSelect(match)} style={{
      background: selected ? 'rgba(0,255,135,0.06)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${selected ? 'var(--green)' : isLive ? 'rgba(255,77,109,0.3)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 14, padding: '1rem 1.2rem',
      cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
    }}>
      {isLive && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--red), transparent)' }} />}

      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.6rem', display: 'flex', justifyContent: 'space-between' }}>
        <span>{match.competition?.name}</span>
        <span style={{ color: status.color, fontFamily: 'Orbitron', fontSize: '0.65rem', fontWeight: 700 }}>
          {isLive && '● '}{isLive && match.minute ? `${match.minute}'` : ''} {status.label}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {match.homeTeam?.crest && <img src={match.homeTeam.crest} alt="" style={{ width: 28, height: 28, objectFit: 'contain', flexShrink: 0 }} />}
          <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{match.homeTeam?.shortName || match.homeTeam?.name}</span>
        </div>

        <div style={{ textAlign: 'center', minWidth: 70 }}>
          {match.status === 'SCHEDULED' ? (
            <div style={{ fontFamily: 'Orbitron', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{formatTime(match.utcDate)}</div>
          ) : (
            <div style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1.4rem', color: isLive ? 'var(--green)' : 'var(--text)' }}>
              {home ?? '—'}<span style={{ color: 'var(--text-muted)', margin: '0 0.2rem' }}>:</span>{away ?? '—'}
            </div>
          )}
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{formatDate(match.utcDate)}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', justifyContent: 'flex-end' }}>
          <span style={{ fontWeight: 700, fontSize: '0.88rem', textAlign: 'right' }}>{match.awayTeam?.shortName || match.awayTeam?.name}</span>
          {match.awayTeam?.crest && <img src={match.awayTeam.crest} alt="" style={{ width: 28, height: 28, objectFit: 'contain', flexShrink: 0 }} />}
        </div>
      </div>
    </div>
  );
}

// ── Componente de alineación ──
function LineupDisplay({ lineup, teamName, crest }) {
  if (!lineup || !lineup.startXI || lineup.startXI.length === 0) return (
    <div style={{
      textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem',
      background: 'rgba(255,255,255,0.02)', borderRadius: 10,
      border: '1px dashed rgba(255,255,255,0.08)', fontSize: '0.82rem',
    }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>📋</div>
      Alineación no publicada aún.<br/>
      <span style={{ fontSize: '0.75rem' }}>Disponible ~1h antes del partido</span>
    </div>
  );

  const starters = lineup.startXI.map(p => p.player);
  const bench = lineup.bench?.map(p => p.player) || [];
  const formation = lineup.formation || '';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
        {crest && <img src={crest} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />}
        <div>
          <div style={{ fontFamily: 'Orbitron', fontSize: '0.8rem', color: 'var(--text)' }}>{teamName}</div>
          {formation && <div style={{ color: 'var(--green)', fontSize: '0.7rem', fontFamily: 'Orbitron' }}>{formation}</div>}
        </div>
      </div>

      <div style={{ marginBottom: '0.8rem' }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'Orbitron', letterSpacing: '1px', marginBottom: '0.4rem' }}>TITULARES</div>
        {starters.map((p, i) => (
          <div key={p.id || i} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.35rem 0.6rem', borderRadius: 6, marginBottom: '0.2rem',
            background: 'rgba(0,255,135,0.04)', border: '1px solid rgba(0,255,135,0.08)',
          }}>
            <span style={{ fontFamily: 'Orbitron', fontSize: '0.65rem', color: 'var(--green)', minWidth: 20 }}>{p.shirtNumber}</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{p.name}</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: 'var(--text-muted)' }}>{p.position}</span>
          </div>
        ))}
      </div>

      {bench.length > 0 && (
        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'Orbitron', letterSpacing: '1px', marginBottom: '0.4rem' }}>SUPLENTES</div>
          {bench.map((p, i) => (
            <div key={p.id || i} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.3rem 0.6rem', borderRadius: 6, marginBottom: '0.2rem',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <span style={{ fontFamily: 'Orbitron', fontSize: '0.62rem', color: 'var(--text-muted)', minWidth: 20 }}>{p.shirtNumber}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Detalle completo del partido ──
function MatchDetail({ matchId }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('events');
  const intervalRef = useRef(null);

  const load = () =>
    fetch(`${API_URL}/api/teams/match/${matchId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setData).catch(() => {});

  useEffect(() => {
    setData(null);
    setTab('events');
    load();
    intervalRef.current = setInterval(load, 30000);
    return () => clearInterval(intervalRef.current);
  }, [matchId]);

  if (!data) return (
    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>Cargando...
    </div>
  );

  if (data.status === 'UNAVAILABLE') return (
    <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.8rem' }}>🔒</div>
      <div style={{ fontFamily: 'Orbitron', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Detalle no disponible</div>
      <div style={{ fontSize: '0.82rem' }}>Este partido no tiene información detallada disponible en el plan actual de la API</div>
    </div>
  );

  const isLive = data.status === 'IN_PLAY' || data.status === 'PAUSED';
  const home = data.score?.fullTime?.home ?? data.score?.halfTime?.home ?? 0;
  const away = data.score?.fullTime?.away ?? data.score?.halfTime?.away ?? 0;
  const goals = data.goals || [];
  const bookings = data.bookings || [];
  const subs = data.substitutions || [];
  const allEvents = [
    ...goals.map(e => ({ ...e, _type: 'goal' })),
    ...bookings.map(e => ({ ...e, _type: 'card' })),
    ...subs.map(e => ({ ...e, _type: 'sub' })),
  ].sort((a, b) => (a.minute || 0) - (b.minute || 0));

  const homeLineup = data.lineups?.find(l => l.team?.id === data.homeTeam?.id);
  const awayLineup = data.lineups?.find(l => l.team?.id === data.awayTeam?.id);

  return (
    <div className="glass-card">
      {/* Marcador */}
      <div style={{ textAlign: 'center', marginBottom: '1.2rem', paddingBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ color: isLive ? 'var(--red)' : 'var(--text-muted)', fontFamily: 'Orbitron', fontSize: '0.65rem', letterSpacing: '3px', marginBottom: '0.6rem' }}>
          {isLive ? `● EN VIVO · ${data.minute || 0}'` : STATUS_LABEL[data.status]?.label || data.status}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            {data.homeTeam?.crest && <img src={data.homeTeam.crest} alt="" style={{ width: 44, height: 44, objectFit: 'contain', marginBottom: '0.3rem' }} />}
            <div style={{ fontFamily: 'Orbitron', fontSize: '0.72rem' }}>{data.homeTeam?.shortName}</div>
          </div>
          <div style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '2.8rem', color: isLive ? 'var(--green)' : 'var(--text)', lineHeight: 1 }}>
            {home}<span style={{ color: 'var(--text-muted)', margin: '0 0.4rem', fontSize: '1.5rem' }}>:</span>{away}
          </div>
          <div style={{ textAlign: 'center' }}>
            {data.awayTeam?.crest && <img src={data.awayTeam.crest} alt="" style={{ width: 44, height: 44, objectFit: 'contain', marginBottom: '0.3rem' }} />}
            <div style={{ fontFamily: 'Orbitron', fontSize: '0.72rem' }}>{data.awayTeam?.shortName}</div>
          </div>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.5rem' }}>
          {data.competition?.name} · {formatDate(data.utcDate)}
          {isLive && <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>· actualiza cada 30s</span>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
        {[
          { key: 'events', label: '📋 Eventos' },
          { key: 'lineups', label: '👥 Alineaciones' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '0.4rem 1rem', borderRadius: 8, cursor: 'pointer',
            border: `1px solid ${tab === t.key ? 'var(--green)' : 'rgba(255,255,255,0.08)'}`,
            background: tab === t.key ? 'rgba(0,255,135,0.08)' : 'transparent',
            color: tab === t.key ? 'var(--green)' : 'var(--text-muted)',
            fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.85rem',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Eventos */}
      {tab === 'events' && (
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {allEvents.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem', fontSize: '0.85rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>
                {isLive ? '⏳' : '📋'}
              </div>
              {isLive
                ? 'Sin eventos registrados aún en este partido'
                : data.status === 'SCHEDULED'
                  ? 'El partido aún no ha comenzado'
                  : 'No hay eventos disponibles para este partido'}
            </div>
          ) : allEvents.map((ev, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '0.8rem',
              padding: '0.5rem 0.7rem', borderRadius: 8, marginBottom: '0.3rem',
              background: ev._type === 'goal' ? 'rgba(0,255,135,0.05)' : ev._type === 'card' ? 'rgba(255,200,0,0.04)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${ev._type === 'goal' ? 'rgba(0,255,135,0.12)' : ev._type === 'card' ? 'rgba(255,200,0,0.1)' : 'rgba(255,255,255,0.04)'}`,
            }}>
              <span style={{ fontFamily: 'Orbitron', fontSize: '0.65rem', color: 'var(--text-muted)', minWidth: 28 }}>{ev.minute}'</span>
              <span style={{ fontSize: '1rem' }}>
                {ev._type === 'goal' ? '⚽' : ev._type === 'sub' ? '🔄' : ev.card === 'RED' ? '🟥' : '🟨'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ev.scorer?.name || ev.player?.name || ev.playerOut?.name}
                </div>
                {ev._type === 'sub' && ev.playerIn?.name && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--green)' }}>↑ {ev.playerIn.name}</div>
                )}
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0 }}>{ev.team?.shortName || ev.team?.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Alineaciones */}
      {tab === 'lineups' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <LineupDisplay lineup={homeLineup} teamName={data.homeTeam?.name} crest={data.homeTeam?.crest} side="home" />
          <LineupDisplay lineup={awayLineup} teamName={data.awayTeam?.name} crest={data.awayTeam?.crest} side="away" />
        </div>
      )}
    </div>
  );
}

export default function LiveMatches() {
  const { token } = useAuth();
  const { favorites } = useFavorites();
  const [tab, setTab] = useState('favorites');
  const [matches, setMatches] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab !== 'favorites') return;
    setLoading(true);
    fetch(`${API_URL}/api/teams/favorites/matches`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setMatches(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [tab, favorites.length, token]);

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
          <div>Ve a la sección Equipos y sigue los que te gusten</div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>Cargando partidos...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedMatch ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {displayMatches.length === 0 && !loading && (tab === 'live' || favorites.length > 0) && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                {tab === 'live' ? 'No hay partidos en vivo ahora mismo' : 'No hay partidos próximos para tus equipos'}
              </div>
            )}
            {displayMatches.map(m => (
              <MatchCard key={m.id} match={m} selected={selectedMatch?.id === m.id} onSelect={setSelectedMatch} />
            ))}
          </div>

          {selectedMatch && (
            <div>
              <MatchDetail matchId={selectedMatch.id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
