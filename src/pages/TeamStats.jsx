import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import API_URL from '../config';

const LEAGUES = [
  { code: 'PL',  name: 'Premier League',   flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'PD',  name: 'La Liga',          flag: '🇪🇸' },
  { code: 'BL1', name: 'Bundesliga',       flag: '🇩🇪' },
  { code: 'SA',  name: 'Serie A',          flag: '🇮🇹' },
  { code: 'FL1', name: 'Ligue 1',          flag: '🇫🇷' },
];

function StatCircle({ value, max, label, color }) {
  const pct = Math.min((value / max) * 100, 100);
  const r = 28, circ = 2 * Math.PI * r;
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={70} height={70} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={35} cy={35} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
        <circle cx={35} cy={35} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div style={{ marginTop: '-50px', fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1rem', color }}>{value}</div>
      <div style={{ marginTop: '30px', color: 'var(--text-muted)', fontSize: '0.65rem', fontFamily: 'Orbitron', letterSpacing: '1px' }}>{label}</div>
    </div>
  );
}

function FormStrip({ matches, teamId }) {
  return (
    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
      {matches.slice(-10).map((m, i) => {
        const isHome = m.homeTeam?.id === teamId;
        const hs = m.score?.fullTime?.home ?? 0;
        const as_ = m.score?.fullTime?.away ?? 0;
        const teamScore = isHome ? hs : as_;
        const oppScore = isHome ? as_ : hs;
        const result = teamScore > oppScore ? 'W' : teamScore < oppScore ? 'L' : 'D';
        const colors = { W: '#00ff87', D: '#ffd700', L: '#ff4d6d' };
        const opp = isHome ? m.awayTeam : m.homeTeam;
        return (
          <div key={i} title={`${opp?.shortName || opp?.name} ${teamScore}-${oppScore}`} style={{
            width: 32, height: 32, borderRadius: 8,
            background: `${colors[result]}18`, border: `1px solid ${colors[result]}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Orbitron', fontWeight: 900, fontSize: '0.7rem', color: colors[result],
            cursor: 'default',
          }}>{result}</div>
        );
      })}
    </div>
  );
}

export default function TeamStats() {
  const { token } = useAuth();
  const { favorites } = useFavorites();
  const [league, setLeague] = useState('PL');
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTeams([]); setSelectedTeam(''); setData(null);
    fetch(`${API_URL}/api/teams/competitions/${league}/teams`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setTeams(Array.isArray(d) ? d : []));
  }, [league, token]);

  useEffect(() => {
    if (!selectedTeam) return;
    setLoading(true); setData(null);
    fetch(`${API_URL}/api/stats/team/${selectedTeam}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setData)
      .finally(() => setLoading(false));
  }, [selectedTeam, token]);

  const teamInfo = teams.find(t => t.id === parseInt(selectedTeam));
  const matches = data?.matches || [];
  const finished = matches.filter(m => m.status === 'FINISHED');
  const teamId = parseInt(selectedTeam);

  // Calcular stats
  let wins = 0, draws = 0, losses = 0, gf = 0, ga = 0;
  finished.forEach(m => {
    const isHome = m.homeTeam?.id === teamId;
    const hs = m.score?.fullTime?.home ?? 0;
    const as_ = m.score?.fullTime?.away ?? 0;
    const ts = isHome ? hs : as_;
    const os = isHome ? as_ : hs;
    gf += ts; ga += os;
    if (ts > os) wins++;
    else if (ts === os) draws++;
    else losses++;
  });
  const pts = wins * 3 + draws;

  // Racha actual
  const recent = [...finished].reverse().slice(0, 5);
  let streak = 0, streakType = '';
  for (const m of recent) {
    const isHome = m.homeTeam?.id === teamId;
    const hs = m.score?.fullTime?.home ?? 0;
    const as_ = m.score?.fullTime?.away ?? 0;
    const ts = isHome ? hs : as_;
    const os = isHome ? as_ : hs;
    const r = ts > os ? 'W' : ts < os ? 'L' : 'D';
    if (!streakType) streakType = r;
    if (r === streakType) streak++;
    else break;
  }

  return (
    <div className="page-wrapper">
      <h1 className="page-title">ESTADÍSTICAS <span>DE EQUIPO</span></h1>
      <p className="page-subtitle">Rendimiento del equipo en la temporada actual</p>

      {/* Liga */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
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

      {/* Selector equipo */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 200, maxWidth: 400 }}>
          <label className="form-label">SELECCIONAR EQUIPO</label>
          <select className="form-control" value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}>
            <option value="">Elige un equipo...</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        {/* Favoritos rápidos */}
        {favorites.length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {favorites.slice(0, 4).map(f => (
              <button key={f.team_id} onClick={() => setSelectedTeam(String(f.team_id))} style={{
                padding: '0.4rem 0.8rem', borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${selectedTeam === String(f.team_id) ? 'var(--green)' : 'rgba(255,255,255,0.1)'}`,
                background: selectedTeam === String(f.team_id) ? 'rgba(0,255,135,0.1)' : 'transparent',
                color: selectedTeam === String(f.team_id) ? 'var(--green)' : 'var(--text-muted)',
                fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.82rem',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}>
                {f.team_crest && <img src={f.team_crest} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />}
                {f.team_short || f.team_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>⏳</div>Cargando estadísticas...
        </div>
      )}

      {!loading && data && teamInfo && finished.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header equipo */}
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            {teamInfo.crest && <img src={teamInfo.crest} alt="" style={{ width: 72, height: 72, objectFit: 'contain' }} />}
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Orbitron', fontSize: '1.3rem', marginBottom: '0.3rem' }}>{teamInfo.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{teamInfo.area?.name} · Fundado {teamInfo.founded}</div>
              {streak > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <span style={{
                    background: streak >= 3 ? 'rgba(0,255,135,0.1)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${streak >= 3 ? 'var(--border)' : 'rgba(255,255,255,0.08)'}`,
                    color: streak >= 3 ? 'var(--green)' : 'var(--text-muted)',
                    borderRadius: 6, padding: '0.2rem 0.7rem', fontSize: '0.75rem',
                    fontFamily: 'Orbitron', fontWeight: 700,
                  }}>
                    {streak} {streakType === 'W' ? 'victorias' : streakType === 'D' ? 'empates' : 'derrotas'} seguidas
                  </span>
                </div>
              )}
            </div>
            <div style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '2.5rem', color: 'var(--green)' }}>
              {pts}<span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '0.3rem' }}>pts</span>
            </div>
          </div>

          {/* Círculos de stats */}
          <div className="glass-card">
            <div style={{ fontFamily: 'Orbitron', color: 'var(--green)', fontSize: '0.72rem', letterSpacing: '2px', marginBottom: '1.5rem' }}>
              ÚLTIMOS {finished.length} PARTIDOS
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1rem' }}>
              <StatCircle value={wins} max={finished.length} label="VICTORIAS" color="#00ff87" />
              <StatCircle value={draws} max={finished.length} label="EMPATES" color="#ffd700" />
              <StatCircle value={losses} max={finished.length} label="DERROTAS" color="#ff4d6d" />
              <StatCircle value={gf} max={Math.max(gf, ga, 1)} label="GOLES A FAVOR" color="#00c9ff" />
              <StatCircle value={ga} max={Math.max(gf, ga, 1)} label="GOLES EN CONTRA" color="#ff9500" />
            </div>
          </div>

          {/* Forma reciente */}
          <div className="glass-card">
            <div style={{ fontFamily: 'Orbitron', color: 'var(--green)', fontSize: '0.72rem', letterSpacing: '2px', marginBottom: '1rem' }}>
              FORMA RECIENTE
            </div>
            <FormStrip matches={finished} teamId={teamId} />
          </div>
        </div>
      )}

      {!loading && selectedTeam && finished.length === 0 && data && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
          No hay partidos finalizados disponibles para este equipo
        </div>
      )}
    </div>
  );
}
