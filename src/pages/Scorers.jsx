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

function ScorerCard({ scorer, rank }) {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const isTop3 = rank <= 3;

  return (
    <div style={{
      background: isTop3
        ? `linear-gradient(135deg, rgba(0,255,135,0.08), rgba(0,255,135,0.02))`
        : 'rgba(255,255,255,0.02)',
      border: `1px solid ${isTop3 ? 'var(--border)' : 'rgba(255,255,255,0.05)'}`,
      borderRadius: 14, padding: '1rem 1.2rem',
      display: 'flex', alignItems: 'center', gap: '1rem',
      transition: 'all 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
    >
      {/* Rank */}
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: isTop3 ? 'rgba(0,255,135,0.1)' : 'rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Orbitron', fontWeight: 900,
        fontSize: isTop3 ? '1.2rem' : '0.85rem',
        color: isTop3 ? 'var(--green)' : 'var(--text-muted)',
      }}>
        {medals[rank] || rank}
      </div>

      {/* Foto placeholder */}
      <div style={{
        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, var(--dark3), var(--dark4))',
        border: `2px solid ${isTop3 ? 'var(--green)' : 'rgba(255,255,255,0.1)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.2rem', overflow: 'hidden',
      }}>
        {scorer.player?.photo
          ? <img src={scorer.player.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : '⚽'
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {scorer.player?.name}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
          {scorer.team?.crest && <img src={scorer.team.crest} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />}
          {scorer.team?.shortName || scorer.team?.name}
          {scorer.player?.nationality && <span>· {scorer.player.nationality}</span>}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1.2rem', flexShrink: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1.4rem', color: 'var(--green)', lineHeight: 1 }}>
            {scorer.goals ?? 0}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', marginTop: '0.2rem' }}>GOLES</div>
        </div>
        {scorer.assists != null && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Orbitron', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', lineHeight: 1 }}>
              {scorer.assists}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', marginTop: '0.2rem' }}>ASIST.</div>
          </div>
        )}
        {scorer.playedMatches != null && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Orbitron', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1 }}>
              {scorer.playedMatches}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.62rem', marginTop: '0.2rem' }}>PJ</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Scorers() {
  const { token } = useAuth();
  const [league, setLeague] = useState('PL');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setData(null);
    fetch(`${API_URL}/api/stats/scorers/${league}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [league, token]);

  const scorers = data?.scorers || [];

  return (
    <div className="page-wrapper">
      <h1 className="page-title">TABLA DE <span>GOLEADORES</span></h1>
      <p className="page-subtitle">Los máximos anotadores de la temporada</p>

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
          Cargando goleadores...
        </div>
      )}

      {!loading && scorers.length > 0 && (
        <div>
          {/* Header liga */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            {data?.competition?.emblem && (
              <img src={data.competition.emblem} alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
            )}
            <div>
              <div style={{ fontFamily: 'Orbitron', color: 'var(--green)', fontSize: '0.9rem' }}>{data?.competition?.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Top {scorers.length} goleadores</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {scorers.map((s, i) => (
              <ScorerCard key={s.player?.id || i} scorer={s} rank={i + 1} />
            ))}
          </div>
        </div>
      )}

      {!loading && scorers.length === 0 && data && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
          No hay datos de goleadores disponibles para esta liga
        </div>
      )}
    </div>
  );
}
