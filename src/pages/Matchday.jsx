import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

const LEAGUES = [
  { code: 'PL',  name: 'Premier League',   flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'PD',  name: 'La Liga',          flag: '🇪🇸' },
  { code: 'BL1', name: 'Bundesliga',       flag: '🇩🇪' },
  { code: 'SA',  name: 'Serie A',          flag: '🇮🇹' },
  { code: 'FL1', name: 'Ligue 1',          flag: '🇫🇷' },
  { code: 'CL',  name: 'Champions League', flag: '⭐' },
];

const STATUS_COLOR = {
  SCHEDULED: 'var(--text-muted)',
  IN_PLAY: 'var(--red)',
  PAUSED: '#ffd700',
  FINISHED: 'var(--text-muted)',
};

function formatTime(utcDate) {
  return new Date(utcDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}
function formatDateGroup(utcDate) {
  return new Date(utcDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function Matchday() {
  const { token } = useAuth();
  const [league, setLeague] = useState('PL');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [matchday, setMatchday] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setData(null);
    const url = `${API_URL}/api/stats/matchday/${league}${matchday ? `?matchday=${matchday}` : ''}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [league, matchday, token]);

  // Agrupar por fecha
  const matches = data?.matches || [];
  const grouped = matches.reduce((acc, m) => {
    const key = formatDateGroup(m.utcDate);
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const currentMatchday = data?.filters?.matchday;
  const totalMatchdays = data?.resultSet?.count ? Math.ceil(data.resultSet.count / 10) : 38;

  return (
    <div className="page-wrapper">
      <h1 className="page-title">CALENDARIO <span>DE JORNADA</span></h1>
      <p className="page-subtitle">Partidos de los últimos 7 días y próximos 14 días</p>

      {/* Selector liga */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
        {LEAGUES.map(l => (
          <button key={l.code} onClick={() => { setLeague(l.code); setMatchday(''); }} style={{
            padding: '0.5rem 1.1rem', borderRadius: 10, cursor: 'pointer',
            border: `1px solid ${league === l.code ? 'var(--green)' : 'rgba(255,255,255,0.08)'}`,
            background: league === l.code ? 'rgba(0,255,135,0.1)' : 'rgba(255,255,255,0.02)',
            color: league === l.code ? 'var(--green)' : 'var(--text-muted)',
            fontWeight: 700, fontFamily: 'Rajdhani', fontSize: '0.88rem',
            transition: 'all 0.2s', whiteSpace: 'nowrap',
          }}>
            {l.flag} {l.name}
          </button>
        ))}
      </div>

      {/* Navegación de jornada */}
      {currentMatchday && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
          <button onClick={() => setMatchday(String(Math.max(1, (parseInt(matchday || currentMatchday) - 1))))}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', borderRadius: 8, padding: '0.4rem 0.8rem', cursor: 'pointer', fontSize: '1rem' }}>
            ‹
          </button>
          <div style={{ fontFamily: 'Orbitron', color: 'var(--green)', fontSize: '0.85rem', letterSpacing: '1px' }}>
            JORNADA {matchday || currentMatchday}
          </div>
          <button onClick={() => setMatchday(String(Math.min(totalMatchdays, (parseInt(matchday || currentMatchday) + 1))))}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', borderRadius: 8, padding: '0.4rem 0.8rem', cursor: 'pointer', fontSize: '1rem' }}>
            ›
          </button>
          <button onClick={() => setMatchday('')}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', borderRadius: 8, padding: '0.4rem 0.8rem', cursor: 'pointer', fontFamily: 'Rajdhani', fontSize: '0.82rem' }}>
            Actual
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>⏳</div>
          Cargando partidos...
        </div>
      )}

      {!loading && Object.entries(grouped).map(([date, dayMatches]) => (
        <div key={date} style={{ marginBottom: '2rem' }}>
          <div style={{
            fontFamily: 'Orbitron', fontSize: '0.72rem', color: 'var(--text-muted)',
            letterSpacing: '2px', textTransform: 'uppercase',
            marginBottom: '0.8rem', paddingBottom: '0.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            {date}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {dayMatches.map(m => {
              const isLive = m.status === 'IN_PLAY' || m.status === 'PAUSED';
              const isDone = m.status === 'FINISHED';
              const homeScore = m.score?.fullTime?.home ?? m.score?.halfTime?.home;
              const awayScore = m.score?.fullTime?.away ?? m.score?.halfTime?.away;

              return (
                <div key={m.id} style={{
                  background: isLive ? 'rgba(255,77,109,0.04)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isLive ? 'rgba(255,77,109,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 12, padding: '0.8rem 1.2rem',
                  display: 'grid', gridTemplateColumns: '1fr auto 1fr',
                  alignItems: 'center', gap: '1rem', position: 'relative', overflow: 'hidden',
                }}>
                  {isLive && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--red), transparent)' }} />}

                  {/* Local */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {m.homeTeam?.crest && <img src={m.homeTeam.crest} alt="" style={{ width: 26, height: 26, objectFit: 'contain', flexShrink: 0 }} />}
                    <span style={{ fontWeight: isDone && homeScore > awayScore ? 900 : 600, fontSize: '0.88rem', color: isDone && homeScore > awayScore ? 'var(--text)' : 'var(--text-muted)' }}>
                      {m.homeTeam?.shortName || m.homeTeam?.name}
                    </span>
                  </div>

                  {/* Centro */}
                  <div style={{ textAlign: 'center', minWidth: 80 }}>
                    {m.status === 'SCHEDULED' ? (
                      <div style={{ fontFamily: 'Orbitron', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{formatTime(m.utcDate)}</div>
                    ) : (
                      <div style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1.3rem', color: isLive ? 'var(--green)' : 'var(--text)' }}>
                        {homeScore ?? '—'}<span style={{ color: 'var(--text-muted)', margin: '0 0.2rem', fontSize: '0.9rem' }}>:</span>{awayScore ?? '—'}
                      </div>
                    )}
                    <div style={{ fontSize: '0.62rem', color: STATUS_COLOR[m.status] || 'var(--text-muted)', fontFamily: 'Orbitron', marginTop: '0.2rem' }}>
                      {isLive ? `● ${m.minute || ''}' EN VIVO` : m.status === 'FINISHED' ? 'FIN' : ''}
                    </div>
                  </div>

                  {/* Visitante */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', justifyContent: 'flex-end' }}>
                    <span style={{ fontWeight: isDone && awayScore > homeScore ? 900 : 600, fontSize: '0.88rem', textAlign: 'right', color: isDone && awayScore > homeScore ? 'var(--text)' : 'var(--text-muted)' }}>
                      {m.awayTeam?.shortName || m.awayTeam?.name}
                    </span>
                    {m.awayTeam?.crest && <img src={m.awayTeam.crest} alt="" style={{ width: 26, height: 26, objectFit: 'contain', flexShrink: 0 }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
