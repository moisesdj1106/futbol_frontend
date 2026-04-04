import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { usePushNotifications } from '../hooks/usePushNotifications';
import API_URL from '../config';

const COMPETITIONS = [
  { code: 'PL',  name: 'Premier League',    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'PD',  name: 'La Liga',           flag: '🇪🇸' },
  { code: 'BL1', name: 'Bundesliga',        flag: '🇩🇪' },
  { code: 'SA',  name: 'Serie A',           flag: '🇮🇹' },
  { code: 'FL1', name: 'Ligue 1',           flag: '🇫🇷' },
  { code: 'CL',  name: 'Champions League',  flag: '⭐' },
];

function TeamCard({ team, isFav, onToggle }) {
  return (
    <div style={{
      background: 'linear-gradient(160deg, var(--dark3), var(--dark2))',
      border: `1px solid ${isFav ? 'var(--green)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 16, padding: '1.2rem',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem',
      transition: 'all 0.25s', position: 'relative',
      boxShadow: isFav ? '0 0 20px rgba(0,255,135,0.1)' : 'none',
    }}>
      {/* Escudo */}
      <div style={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {team.crest
          ? <img src={team.crest} alt={team.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          : <span style={{ fontSize: '2.5rem' }}>⚽</span>
        }
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Orbitron', fontSize: '0.78rem', color: 'var(--text)', marginBottom: '0.2rem' }}>
          {team.shortName || team.name}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{team.area?.name}</div>
      </div>

      <button
        onClick={() => onToggle(team)}
        style={{
          width: '100%', padding: '0.5rem',
          borderRadius: 8, border: `1px solid ${isFav ? 'var(--green)' : 'rgba(255,255,255,0.1)'}`,
          background: isFav ? 'rgba(0,255,135,0.1)' : 'transparent',
          color: isFav ? 'var(--green)' : 'var(--text-muted)',
          cursor: 'pointer', fontFamily: 'Rajdhani', fontWeight: 700,
          fontSize: '0.82rem', transition: 'all 0.2s',
        }}
      >
        {isFav ? '★ Siguiendo' : '☆ Seguir'}
      </button>
    </div>
  );
}

export default function Teams() {
  const { token } = useAuth();
  const { isFav, toggle } = useFavorites();
  const { permission, subscribed, loading: pushLoading, supported, subscribe, unsubscribe } = usePushNotifications();
  const [competition, setCompetition] = useState('PL');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setTeams([]);
    fetch(`${API_URL}/api/teams/competitions/${competition}/teams`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => { if (!cancelled) setTeams(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setTeams([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [competition, token]);

  const filtered = teams.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.shortName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <h1 className="page-title">EQUIPOS <span>& FAVORITOS</span></h1>
      <p className="page-subtitle">Sigue tus equipos y mantente al día con sus partidos</p>

      {/* Banner de notificaciones */}
      {supported && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: subscribed ? 'rgba(0,255,135,0.06)' : 'rgba(255,200,0,0.05)',
          border: `1px solid ${subscribed ? 'var(--border)' : 'rgba(255,200,0,0.2)'}`,
          borderRadius: 12, padding: '0.9rem 1.2rem', marginBottom: '1.5rem',
          flexWrap: 'wrap', gap: '0.8rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ fontSize: '1.3rem' }}>{subscribed ? '🔔' : '🔕'}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {subscribed ? 'Notificaciones activadas' : 'Activa las notificaciones'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                {subscribed
                  ? 'Recibirás alertas de goles y tarjetas de tus equipos'
                  : 'Recibe alertas de goles y tarjetas aunque tengas otra pestaña abierta'}
              </div>
            </div>
          </div>
          {permission === 'denied' ? (
            <div style={{ color: 'var(--red)', fontSize: '0.8rem' }}>Bloqueado en el navegador</div>
          ) : (
            <button
              onClick={subscribed ? unsubscribe : subscribe}
              disabled={pushLoading}
              style={{
                padding: '0.5rem 1.2rem', borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${subscribed ? 'rgba(255,77,109,0.3)' : 'var(--green)'}`,
                background: subscribed ? 'rgba(255,77,109,0.08)' : 'rgba(0,255,135,0.1)',
                color: subscribed ? 'var(--red)' : 'var(--green)',
                fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.88rem',
                transition: 'all 0.2s',
              }}
            >
              {pushLoading ? '...' : subscribed ? 'Desactivar' : 'Activar notificaciones'}
            </button>
          )}
        </div>
      )}

      {/* Selector de liga */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {COMPETITIONS.map(c => (
          <button
            key={c.code}
            onClick={() => setCompetition(c.code)}
            style={{
              padding: '0.5rem 1rem', borderRadius: 10,
              border: `1px solid ${competition === c.code ? 'var(--green)' : 'rgba(255,255,255,0.08)'}`,
              background: competition === c.code ? 'rgba(0,255,135,0.1)' : 'transparent',
              color: competition === c.code ? 'var(--green)' : 'var(--text-muted)',
              cursor: 'pointer', fontWeight: 700, fontFamily: 'Rajdhani',
              fontSize: '0.88rem', transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
          >
            {c.flag} {c.name}
          </button>
        ))}
      </div>

      {/* Búsqueda */}
      <div className="search-wrap" style={{ maxWidth: 300, marginBottom: '1.5rem' }}>
        <span className="search-icon">🔍</span>
        <input className="form-control" placeholder="Buscar equipo..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          Cargando equipos...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
          {filtered.map(team => (
            <TeamCard key={team.id} team={team} isFav={isFav(team.id)} onToggle={toggle} />
          ))}
        </div>
      )}
    </div>
  );
}
