import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PlayerCard from '../components/PlayerCard';
import PlayerModal from '../components/PlayerModal';
import API_URL from '../config';

const POSITIONS = ['ALL', 'GK', 'DEF', 'MID', 'FWD'];

export default function Players() {
  const { token } = useAuth();
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/players`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setPlayers);
  }, [token]);

  const filtered = players.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.club?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || p.position_type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="page-wrapper">
      <h1 className="page-title">JUGADORES <span>REGISTRADOS</span></h1>
      <p className="page-subtitle">{players.length} jugadores en la base de datos</p>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-wrap" style={{ flex: '1', minWidth: '220px', maxWidth: '340px' }}>
          <span className="search-icon">🔍</span>
          <input
            className="form-control"
            placeholder="Buscar jugador o club..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {POSITIONS.map(pos => (
            <button
              key={pos}
              className={`filter-pill ${filter === pos ? 'active' : ''}`}
              onClick={() => setFilter(pos)}
            >
              {pos === 'ALL' ? 'Todos' : pos}
            </button>
          ))}
        </div>
      </div>

      <div className="players-grid">
        {filtered.map(p => (
          <PlayerCard
            key={p.id}
            player={p}
            showStats
            onClick={() => setSelected(p)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem', fontSize: '1.1rem' }}>
          No se encontraron jugadores
        </div>
      )}

      {selected && (
        <PlayerModal player={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
