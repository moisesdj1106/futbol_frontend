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

function FormBadge({ result }) {
  const colors = { W: '#00ff87', D: '#ffd700', L: '#ff4d6d' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 20, height: 20, borderRadius: 4, fontSize: '0.6rem', fontWeight: 900,
      background: `${colors[result]}22`, color: colors[result],
      border: `1px solid ${colors[result]}44`, fontFamily: 'Orbitron',
    }}>{result}</span>
  );
}

export default function Standings() {
  const { token } = useAuth();
  const [league, setLeague] = useState('PL');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setData(null);
    fetch(`${API_URL}/api/stats/standings/${league}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [league, token]);

  const table = data?.standings?.[0]?.table || [];
  const leagueInfo = LEAGUES.find(l => l.code === league);

  return (
    <div className="page-wrapper">
      <h1 className="page-title">TABLA DE <span>POSICIONES</span></h1>
      <p className="page-subtitle">Clasificación actualizada de las principales ligas</p>

      {/* Selector de liga */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {LEAGUES.map(l => (
          <button key={l.code} onClick={() => setLeague(l.code)} style={{
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

      {loading && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>⏳</div>
          Cargando clasificación...
        </div>
      )}

      {!loading && table.length > 0 && (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            background: 'rgba(0,255,135,0.05)', padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: '1rem',
          }}>
            {data?.competition?.emblem && (
              <img src={data.competition.emblem} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            )}
            <div>
              <div style={{ fontFamily: 'Orbitron', color: 'var(--green)', fontSize: '0.9rem', letterSpacing: '1px' }}>
                {leagueInfo?.flag} {data?.competition?.name}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                Temporada {data?.season?.startDate?.slice(0,4)}/{data?.season?.endDate?.slice(2,4)}
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['#', 'EQUIPO', 'PJ', 'G', 'E', 'P', 'GF', 'GC', 'DG', 'PTS', 'FORMA'].map(h => (
                    <th key={h} style={{
                      padding: '0.7rem 0.8rem', textAlign: h === 'EQUIPO' ? 'left' : 'center',
                      color: 'var(--green)', fontFamily: 'Orbitron', fontSize: '0.62rem',
                      letterSpacing: '1px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.map((row, i) => {
                  const isTop4 = i < 4;
                  const isRelegation = i >= table.length - 3;
                  const isTop6 = i >= 4 && i < 6;
                  return (
                    <tr key={row.team.id} style={{
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '0.75rem 0.8rem', textAlign: 'center', width: 40 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'center' }}>
                          <div style={{
                            width: 3, height: 20, borderRadius: 2,
                            background: isTop4 ? 'var(--green)' : isTop6 ? '#ffd700' : isRelegation ? 'var(--red)' : 'transparent',
                          }} />
                          <span style={{ fontFamily: 'Orbitron', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.position}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                          {row.team.crest && <img src={row.team.crest} alt="" style={{ width: 24, height: 24, objectFit: 'contain', flexShrink: 0 }} />}
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap' }}>{row.team.shortName || row.team.name}</span>
                        </div>
                      </td>
                      {[row.playedGames, row.won, row.draw, row.lost, row.goalsFor, row.goalsAgainst, row.goalDifference].map((v, j) => (
                        <td key={j} style={{ padding: '0.75rem 0.8rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{v}</td>
                      ))}
                      <td style={{ padding: '0.75rem 0.8rem', textAlign: 'center' }}>
                        <span style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '0.9rem', color: 'var(--text)' }}>{row.points}</span>
                      </td>
                      <td style={{ padding: '0.75rem 0.8rem' }}>
                        <div style={{ display: 'flex', gap: '0.2rem', justifyContent: 'center' }}>
                          {(row.form || '').split(',').filter(Boolean).slice(-5).map((r, k) => (
                            <FormBadge key={k} result={r} />
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Leyenda */}
          <div style={{ padding: '0.8rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { color: 'var(--green)', label: 'Champions League' },
              { color: '#ffd700', label: 'Europa League' },
              { color: 'var(--red)', label: 'Descenso' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <div style={{ width: 3, height: 14, borderRadius: 2, background: item.color }} />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
