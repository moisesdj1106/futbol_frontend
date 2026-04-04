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

function TeamSelector({ label, league, onLeagueChange, teams, loading, value, onChange, exclude }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      {/* Selector de liga */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
        {LEAGUES.map(l => (
          <button key={l.code} onClick={() => onLeagueChange(l.code)} style={{
            padding: '0.3rem 0.7rem', borderRadius: 8, cursor: 'pointer',
            border: `1px solid ${league === l.code ? 'var(--green)' : 'rgba(255,255,255,0.08)'}`,
            background: league === l.code ? 'rgba(0,255,135,0.1)' : 'transparent',
            color: league === l.code ? 'var(--green)' : 'var(--text-muted)',
            fontWeight: 700, fontFamily: 'Rajdhani', fontSize: '0.78rem',
            transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}>
            {l.flag}
          </button>
        ))}
      </div>
      {/* Selector de equipo */}
      <select
        className="form-control"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={loading}
      >
        <option value="">{loading ? 'Cargando...' : 'Seleccionar equipo...'}</option>
        {teams
          .filter(t => !exclude || t.id !== parseInt(exclude))
          .map(t => <option key={t.id} value={t.id}>{t.name}</option>)
        }
      </select>
      {value && teams.find(t => t.id === parseInt(value)) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
          {teams.find(t => t.id === parseInt(value))?.crest && (
            <img src={teams.find(t => t.id === parseInt(value)).crest} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
          )}
          <span style={{ color: 'var(--green)', fontSize: '0.82rem', fontWeight: 600 }}>
            {teams.find(t => t.id === parseInt(value))?.name}
          </span>
        </div>
      )}
    </div>
  );
}

export default function H2H() {
  const { token } = useAuth();

  const [league1, setLeague1] = useState('PL');
  const [league2, setLeague2] = useState('PD');
  const [teams1, setTeams1] = useState([]);
  const [teams2, setTeams2] = useState([]);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [searched, setSearched] = useState(false);

  // Cargar equipos liga 1
  useEffect(() => {
    setLoading1(true); setTeams1([]); setTeam1('');
    fetch(`${API_URL}/api/teams/competitions/${league1}/teams`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setTeams1(Array.isArray(d) ? d : []))
      .finally(() => setLoading1(false));
  }, [league1, token]);

  // Cargar equipos liga 2
  useEffect(() => {
    setLoading2(true); setTeams2([]); setTeam2('');
    fetch(`${API_URL}/api/teams/competitions/${league2}/teams`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setTeams2(Array.isArray(d) ? d : []))
      .finally(() => setLoading2(false));
  }, [league2, token]);

  const search = async () => {
    if (!team1 || !team2) return;
    setLoading(true); setMatches([]); setStats(null); setSearched(true);

    try {
      // Buscar en los partidos finalizados del equipo 1 si jugó contra el equipo 2
      const res = await fetch(`${API_URL}/api/stats/team/${team1}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const t1 = parseInt(team1), t2 = parseInt(team2);

      const h2h = (data.matches || []).filter(m =>
        (m.homeTeam?.id === t1 || m.awayTeam?.id === t1) &&
        (m.homeTeam?.id === t2 || m.awayTeam?.id === t2)
      );

      setMatches(h2h);

      // Calcular stats
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

  const t1Info = teams1.find(t => t.id === parseInt(team1));
  const t2Info = teams2.find(t => t.id === parseInt(team2));

  return (
    <div className="page-wrapper">
      <h1 className="page-title">HISTORIAL <span>H2H</span></h1>
      <p className="page-subtitle">Enfrentamientos históricos entre dos equipos de cualquier liga</p>

      {/* Selectores */}
      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1.5rem', alignItems: 'start' }}>
          <TeamSelector
            label="EQUIPO 1"
            league={league1}
            onLeagueChange={l => { setLeague1(l); setTeam1(''); }}
            teams={teams1}
            loading={loading1}
            value={team1}
            onChange={setTeam1}
          />

          <div style={{ textAlign: 'center', paddingTop: '2.5rem' }}>
            <div style={{ fontFamily: 'Orbitron', color: 'var(--green)', fontSize: '1.3rem', fontWeight: 900 }}>VS</div>
          </div>

          <TeamSelector
            label="EQUIPO 2"
            league={league2}
            onLeagueChange={l => { setLeague2(l); setTeam2(''); }}
            teams={teams2}
            loading={loading2}
            value={team2}
            onChange={setTeam2}
          />
        </div>

        <div style={{ marginTop: '1.2rem' }}>
          <button
            className="btn-primary-custom"
            style={{ width: 'auto', padding: '0.75rem 2.5rem' }}
            onClick={search}
            disabled={!team1 || !team2 || loading}
          >
            {loading ? 'BUSCANDO...' : '🔍 VER HISTORIAL'}
          </button>
        </div>
      </div>

      {/* Stats resumen */}
      {stats && t1Info && t2Info && (
        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem' }}>
            <div style={{ textAlign: 'center' }}>
              {t1Info.crest && <img src={t1Info.crest} alt="" style={{ width: 52, height: 52, objectFit: 'contain', marginBottom: '0.4rem' }} />}
              <div style={{ fontFamily: 'Orbitron', fontSize: '0.8rem' }}>{t1Info.shortName || t1Info.name}</div>
            </div>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'Orbitron', fontSize: '0.72rem' }}>
              {stats.total} partidos
            </div>
            <div style={{ textAlign: 'center' }}>
              {t2Info.crest && <img src={t2Info.crest} alt="" style={{ width: 52, height: 52, objectFit: 'contain', marginBottom: '0.4rem' }} />}
              <div style={{ fontFamily: 'Orbitron', fontSize: '0.8rem' }}>{t2Info.shortName || t2Info.name}</div>
            </div>
          </div>

          {stats.total === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem', fontSize: '0.88rem' }}>
              No se encontraron enfrentamientos recientes entre estos equipos.<br />
              <span style={{ fontSize: '0.78rem' }}>Puede que no hayan jugado en los últimos partidos disponibles o sean de ligas que no se han cruzado.</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', textAlign: 'center' }}>
              {[
                { label: 'Victorias', v1: stats.w1, v2: stats.w2 },
                { label: 'Empates', v1: stats.draws, v2: stats.draws },
                { label: 'Goles', v1: stats.gf1, v2: stats.gf2 },
              ].map(item => (
                <div key={item.label} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '0.8rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontFamily: 'Orbitron', letterSpacing: '1px', marginBottom: '0.5rem' }}>{item.label}</div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1.4rem', color: item.v1 > item.v2 ? 'var(--green)' : 'var(--text)' }}>{item.v1}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                    <span style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1.4rem', color: item.v2 > item.v1 ? 'var(--green)' : 'var(--text)' }}>{item.v2}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lista de partidos */}
      {matches.length > 0 && (
        <div>
          <div style={{ fontFamily: 'Orbitron', color: 'var(--text-muted)', fontSize: '0.68rem', letterSpacing: '2px', marginBottom: '0.8rem' }}>
            ÚLTIMOS ENFRENTAMIENTOS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {matches.map(m => {
              const hs = m.score?.fullTime?.home ?? 0;
              const as_ = m.score?.fullTime?.away ?? 0;
              return (
                <div key={m.id} style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12, padding: '0.8rem 1.2rem',
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
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textAlign: 'right', minWidth: 90 }}>
                    {formatDate(m.utcDate)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {searched && !loading && matches.length === 0 && stats?.total === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
          No se encontraron enfrentamientos entre estos equipos en los datos disponibles
        </div>
      )}
    </div>
  );
}
