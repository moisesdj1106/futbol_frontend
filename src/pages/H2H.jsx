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

function formatDate(d) {
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function H2H() {
  const { token } = useAuth();
  const [league, setLeague] = useState('PL');
  const [teams, setTeams] = useState([]);
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    setLoadingTeams(true); setTeams([]); setTeam1(''); setTeam2(''); setMatches([]); setStats(null);
    fetch(`${API_URL}/api/teams/competitions/${league}/teams`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setTeams(Array.isArray(d) ? d : []))
      .finally(() => setLoadingTeams(false));
  }, [league, token]);

  const search = async () => {
    if (!team1 || !team2 || team1 === team2) return;
    setLoading(true); setMatches([]); setStats(null);

    // Buscar partidos del equipo 1 finalizados
    try {
      const res = await fetch(`${API_URL}/api/stats/team/${team1}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const h2h = (data.matches || []).filter(m =>
        (m.homeTeam?.id === parseInt(team1) || m.awayTeam?.id === parseInt(team1)) &&
        (m.homeTeam?.id === parseInt(team2) || m.awayTeam?.id === parseInt(team2))
      );

      setMatches(h2h);

      // Calcular stats
      const t1 = parseInt(team1), t2 = parseInt(team2);
      let w1 = 0, w2 = 0, draws = 0, gf1 = 0, gf2 = 0;
      h2h.forEach(m => {
        const isHome1 = m.homeTeam?.id === t1;
        const hs = m.score?.fullTime?.home ?? 0;
        const as_ = m.score?.fullTime?.away ?? 0;
        gf1 += isHome1 ? hs : as_;
        gf2 += isHome1 ? as_ : hs;
        if (hs === as_) draws++;
        else if ((isHome1 && hs > as_) || (!isHome1 && as_ > hs)) w1++;
        else w2++;
      });
      setStats({ w1, w2, draws, gf1, gf2, total: h2h.length });
    } catch { /* sin datos */ }
    setLoading(false);
  };

  const t1Info = teams.find(t => t.id === parseInt(team1));
  const t2Info = teams.find(t => t.id === parseInt(team2));

  return (
    <div className="page-wrapper">
      <h1 className="page-title">HISTORIAL <span>H2H</span></h1>
      <p className="page-subtitle">Enfrentamientos históricos entre dos equipos</p>

      {/* Liga */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
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

      {/* Selectores de equipo */}
      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label className="form-label">EQUIPO LOCAL</label>
            <select className="form-control" value={team1} onChange={e => setTeam1(e.target.value)} disabled={loadingTeams}>
              <option value="">Seleccionar equipo...</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div style={{ textAlign: 'center', paddingBottom: '0.5rem' }}>
            <div style={{ fontFamily: 'Orbitron', color: 'var(--green)', fontSize: '1.2rem', fontWeight: 900 }}>VS</div>
          </div>
          <div>
            <label className="form-label">EQUIPO VISITANTE</label>
            <select className="form-control" value={team2} onChange={e => setTeam2(e.target.value)} disabled={loadingTeams}>
              <option value="">Seleccionar equipo...</option>
              {teams.filter(t => t.id !== parseInt(team1)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <button className="btn-primary-custom" style={{ width: 'auto', padding: '0.75rem 2rem' }}
            onClick={search} disabled={!team1 || !team2 || loading}>
            {loading ? 'BUSCANDO...' : '🔍 VER HISTORIAL'}
          </button>
        </div>
      </div>

      {/* Stats resumen */}
      {stats && t1Info && t2Info && (
        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem' }}>
            <div style={{ textAlign: 'center' }}>
              {t1Info.crest && <img src={t1Info.crest} alt="" style={{ width: 48, height: 48, objectFit: 'contain', marginBottom: '0.4rem' }} />}
              <div style={{ fontFamily: 'Orbitron', fontSize: '0.8rem' }}>{t1Info.shortName || t1Info.name}</div>
            </div>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'Orbitron', fontSize: '0.75rem' }}>
              {stats.total} partidos
            </div>
            <div style={{ textAlign: 'center' }}>
              {t2Info.crest && <img src={t2Info.crest} alt="" style={{ width: 48, height: 48, objectFit: 'contain', marginBottom: '0.4rem' }} />}
              <div style={{ fontFamily: 'Orbitron', fontSize: '0.8rem' }}>{t2Info.shortName || t2Info.name}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', textAlign: 'center' }}>
            {[
              { label: 'Victorias', v1: stats.w1, v2: stats.w2, color: 'var(--green)' },
              { label: 'Empates', v1: stats.draws, v2: stats.draws, color: '#ffd700' },
              { label: 'Goles', v1: stats.gf1, v2: stats.gf2, color: 'var(--text-muted)' },
            ].map(item => (
              <div key={item.label} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '0.8rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontFamily: 'Orbitron', letterSpacing: '1px', marginBottom: '0.5rem' }}>{item.label}</div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.8rem' }}>
                  <span style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1.4rem', color: item.v1 > item.v2 ? 'var(--green)' : 'var(--text)' }}>{item.v1}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                  <span style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1.4rem', color: item.v2 > item.v1 ? 'var(--green)' : 'var(--text)' }}>{item.v2}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de partidos */}
      {matches.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontFamily: 'Orbitron', color: 'var(--text-muted)', fontSize: '0.7rem', letterSpacing: '2px', marginBottom: '0.5rem' }}>
            ÚLTIMOS ENFRENTAMIENTOS
          </div>
          {matches.map(m => {
            const hs = m.score?.fullTime?.home ?? 0;
            const as_ = m.score?.fullTime?.away ?? 0;
            return (
              <div key={m.id} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10, padding: '0.7rem 1rem',
                display: 'grid', gridTemplateColumns: '1fr auto 1fr auto',
                alignItems: 'center', gap: '0.8rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {m.homeTeam?.crest && <img src={m.homeTeam.crest} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />}
                  <span style={{ fontSize: '0.85rem', fontWeight: hs > as_ ? 700 : 400 }}>{m.homeTeam?.shortName}</span>
                </div>
                <div style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1.1rem', color: 'var(--text)', textAlign: 'center', minWidth: 60 }}>
                  {hs}<span style={{ color: 'var(--text-muted)', margin: '0 0.2rem', fontSize: '0.8rem' }}>:</span>{as_}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: as_ > hs ? 700 : 400 }}>{m.awayTeam?.shortName}</span>
                  {m.awayTeam?.crest && <img src={m.awayTeam.crest} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textAlign: 'right', minWidth: 80 }}>{formatDate(m.utcDate)}</div>
              </div>
            );
          })}
        </div>
      )}

      {stats && matches.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
          No se encontraron enfrentamientos recientes entre estos equipos
        </div>
      )}
    </div>
  );
}
