import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import StatBar from '../components/StatBar';

const STATS = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];
const STAT_LABELS = {
  pace: 'Velocidad', shooting: 'Disparo', passing: 'Pase',
  dribbling: 'Regate', defending: 'Defensa', physical: 'Físico',
};

function MiniCard({ player, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? 'rgba(0,255,135,0.08)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${selected ? 'var(--green)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '12px',
        padding: '0.75rem 1rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.8rem',
        transition: 'all 0.2s',
        boxShadow: selected ? '0 0 15px rgba(0,255,135,0.15)' : 'none',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: '10px', overflow: 'hidden', flexShrink: 0,
        background: 'var(--dark4)', border: `1px solid ${selected ? 'var(--green)' : 'rgba(255,255,255,0.08)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
      }}>
        {player.image_url ? <img src={player.image_url} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} /> : '⚽'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{player.name}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{player.club}</div>
      </div>
      <div style={{ fontFamily: 'Orbitron', color: selected ? 'var(--green)' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
        {player.overall_rating}
      </div>
    </div>
  );
}

function PlayerColumn({ player, score, total, isWinner, side }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      {/* Imagen grande */}
      <div style={{
        width: '100%', maxWidth: 220, height: 260,
        borderRadius: '16px', overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(0,255,135,0.05) 0%, var(--dark2) 100%)',
        border: `2px solid ${isWinner ? 'var(--green)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: isWinner ? '0 0 40px rgba(0,255,135,0.2)' : 'none',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        position: 'relative',
      }}>
        {isWinner && (
          <div style={{
            position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--green)', color: '#060912', fontFamily: 'Orbitron',
            fontSize: '0.6rem', fontWeight: 900, padding: '0.2rem 0.7rem',
            borderRadius: '20px', letterSpacing: '2px', zIndex: 2,
          }}>GANADOR</div>
        )}
        {player.image_url
          ? <img src={player.image_url} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
          : <span style={{ fontSize: '6rem', opacity: 0.15, paddingBottom: '1rem' }}>⚽</span>
        }
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
          padding: '1rem 0.8rem 0.8rem',
        }}>
          <div style={{ fontFamily: 'Orbitron', fontSize: '0.85rem', color: '#fff', textAlign: 'center' }}>{player.name}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center' }}>{player.era}</div>
        </div>
      </div>

      {/* Score */}
      <div style={{
        fontFamily: 'Orbitron', fontSize: '2.5rem', fontWeight: 900,
        color: isWinner ? 'var(--green)' : 'var(--text-muted)',
        textShadow: isWinner ? '0 0 30px rgba(0,255,135,0.5)' : 'none',
      }}>
        {score}<span style={{ fontSize: '1rem', opacity: 0.5 }}>/{total}</span>
      </div>

      {/* Stats */}
      <div style={{ width: '100%' }}>
        {STATS.map(s => (
          <StatBar
            key={s}
            label={STAT_LABELS[s]}
            value={player[s]}
            highlight={side === 'left'
              ? player[s] > (player._opponent?.[s] ?? 0)
              : player[s] > (player._opponent?.[s] ?? 0)
            }
          />
        ))}
      </div>
    </div>
  );
}

export default function Versus() {
  const { token } = useAuth();
  const [players, setPlayers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetch('/api/players', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setPlayers);
  }, [token]);

  const toggleSelect = (player) => {
    if (selected.find(p => p.id === player.id)) {
      setSelected(selected.filter(p => p.id !== player.id));
      setResult(null);
    } else if (selected.length < 2) {
      setSelected([...selected, player]);
      setResult(null);
    }
  };

  const compare = async () => {
    if (selected.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/players/versus/${selected[0].id}/${selected[1].id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      // Adjuntar oponente para highlight de stats
      data.player1._opponent = data.player2;
      data.player2._opponent = data.player1;
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  const filtered = players.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.club?.toLowerCase().includes(search.toLowerCase());
    return filter === 'ALL' ? matchSearch : matchSearch && p.position_type === filter;
  });

  return (
    <div className="page-wrapper">
      <h1 className="page-title">VERSUS <span>COMPARADOR</span></h1>
      <p className="page-subtitle">Selecciona 2 jugadores y descubre quién domina</p>

      {/* Slots */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'stretch', flexWrap: 'wrap' }}>
        {[0, 1].map(i => (
          <div key={i} style={{
            flex: 1, minWidth: 200,
            background: selected[i] ? 'rgba(0,255,135,0.05)' : 'rgba(255,255,255,0.02)',
            border: `1px ${selected[i] ? 'solid' : 'dashed'} ${selected[i] ? 'var(--green)' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: '14px', padding: '1rem 1.2rem',
            display: 'flex', alignItems: 'center', gap: '0.8rem',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', background: 'var(--dark4)',
              border: `1px solid ${selected[i] ? 'var(--green)' : 'rgba(255,255,255,0.1)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Orbitron', fontWeight: 900, color: selected[i] ? 'var(--green)' : 'var(--text-muted)',
              fontSize: '0.85rem', flexShrink: 0,
            }}>
              {selected[i] ? selected[i].overall_rating : i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {selected[i] ? (
                <>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected[i].name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{selected[i].club}</div>
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Jugador {i + 1} — elige abajo</div>
              )}
            </div>
            {selected[i] && (
              <button onClick={() => toggleSelect(selected[i])} style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: '1.1rem', padding: '0.2rem',
              }}>✕</button>
            )}
          </div>
        ))}

        <button
          className="btn-primary-custom"
          style={{ width: 'auto', padding: '0 2rem', alignSelf: 'stretch' }}
          onClick={compare}
          disabled={selected.length < 2 || loading}
        >
          {loading ? '...' : '⚡ COMPARAR'}
        </button>
      </div>

      {/* Resultado */}
      {result && (
        <div style={{ marginBottom: '3rem' }}>
          {/* Dos columnas + VS central */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1.5rem', alignItems: 'start', marginBottom: '1.5rem' }}>
            <PlayerColumn
              player={result.player1}
              score={result.scores.player1}
              total={STATS.length}
              isWinner={result.winner.id === result.player1.id}
              side="left"
            />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '5rem', gap: '0.5rem' }}>
              <div style={{
                fontFamily: 'Orbitron', fontSize: '2.2rem', fontWeight: 900,
                color: 'var(--green)', textShadow: '0 0 30px rgba(0,255,135,0.5)',
                animation: 'pulse 2s ease-in-out infinite',
              }}>VS</div>
            </div>

            <PlayerColumn
              player={result.player2}
              score={result.scores.player2}
              total={STATS.length}
              isWinner={result.winner.id === result.player2.id}
              side="right"
            />
          </div>

          {/* Veredicto */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,255,135,0.08), rgba(0,255,135,0.02))',
            border: '1px solid var(--green)',
            borderRadius: '16px', padding: '2rem', textAlign: 'center', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', fontSize: '8rem', opacity: 0.04, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>🏆</div>
            <div style={{ fontFamily: 'Orbitron', color: 'var(--green)', fontSize: '0.7rem', letterSpacing: '4px', marginBottom: '0.5rem' }}>🏆 GANADOR</div>
            <div style={{ fontFamily: 'Orbitron', fontSize: '1.8rem', color: '#fff', marginBottom: '0.8rem' }}>{result.winner.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, maxWidth: 600, margin: '0 auto' }}>{result.verdict}</div>
          </div>
        </div>
      )}

      {/* Filtros y lista */}
      <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 320 }}>
          <span className="search-icon">🔍</span>
          <input className="form-control" placeholder="Buscar jugador..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['ALL','GK','DEF','MID','FWD'].map(pos => (
          <button key={pos} className={`filter-pill ${filter === pos ? 'active' : ''}`} onClick={() => setFilter(pos)}>
            {pos === 'ALL' ? 'Todos' : pos}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {filtered.map(p => (
          <MiniCard
            key={p.id}
            player={p}
            selected={!!selected.find(s => s.id === p.id)}
            onClick={() => toggleSelect(p)}
          />
        ))}
      </div>
    </div>
  );
}
