import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config';

const EMPTY = {
  name:'', age:'', nationality:'', club:'', position:'', position_type:'FWD',
  overall_rating:'', pace:'', shooting:'', passing:'', dribbling:'', defending:'', physical:'',
  image_url:'', era:''
};

export default function ManagePlayers() {
  const { token } = useAuth();
  const [players, setPlayers] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [filterPos, setFilterPos] = useState('ALL');
  const [filterClub, setFilterClub] = useState('');

  const load = () =>
    fetch(`${API_URL}/api/players`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setPlayers);

  useEffect(() => { load(); }, []);

  const clubs = [...new Set(players.map(p => p.club).filter(Boolean))].sort();

  const filtered = players.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchPos = filterPos === 'ALL' || p.position_type === filterPos;
    const matchClub = !filterClub || p.club === filterClub;
    return matchSearch && matchPos && matchClub;
  });

  const openCreate = () => { setForm(EMPTY); setEditing(null); setModal(true); setMsg(''); };
  const openEdit = (p) => { setForm({ ...p }); setEditing(p.id); setModal(true); setMsg(''); };

  const save = async (e) => {
    e.preventDefault();
    const url = editing ? `${API_URL}/api/players/${editing}` : `${API_URL}/api/players`;
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    if (res.ok) { setModal(false); load(); setMsg(editing ? 'Jugador actualizado' : 'Jugador creado'); setTimeout(() => setMsg(''), 3000); }
  };

  const remove = async (id) => {
    if (!confirm('¿Eliminar este jugador?')) return;
    await fetch(`${API_URL}/api/players/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  const field = (key, label, type = 'text') => (
    <div style={{ marginBottom: '0.8rem' }}>
      <label className="form-label">{label}</label>
      <input type={type} className="form-control" value={form[key] ?? ''}
        onChange={e => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">GESTIONAR <span>JUGADORES</span></h1>
          <p className="page-subtitle">{filtered.length} de {players.length} jugadores</p>
        </div>
        <button className="btn-primary-custom" style={{ width: 'auto' }} onClick={openCreate}>+ NUEVO JUGADOR</button>
      </div>

      {msg && <div className="alert-success">{msg}</div>}

      {/* Filtros */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.2rem' }}>
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 300 }}>
            <span className="search-icon">🔍</span>
            <input className="form-control" placeholder="Buscar por nombre..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {['ALL','GK','DEF','MID','FWD'].map(pos => (
            <button key={pos} className={`filter-pill ${filterPos === pos ? 'active' : ''}`} onClick={() => setFilterPos(pos)}>
              {pos === 'ALL' ? 'Todos' : pos}
            </button>
          ))}

          <select
            className="form-control"
            style={{ maxWidth: 200 }}
            value={filterClub}
            onChange={e => setFilterClub(e.target.value)}
          >
            <option value="">Todos los clubes</option>
            {clubs.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {(search || filterPos !== 'ALL' || filterClub) && (
            <button className="btn-secondary-custom" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
              onClick={() => { setSearch(''); setFilterPos('ALL'); setFilterClub(''); }}>
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ overflowX: 'auto' }}>
        <table className="dark-table" style={{ minWidth: 600 }}>
          <thead>
            <tr>
              <th>NOMBRE</th><th>POS</th><th>CLUB</th><th>NACIÓN</th><th>OVERALL</th><th>ERA</th><th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {p.image_url && (
                      <img src={p.image_url} alt={p.name} style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', objectPosition: 'top' }} />
                    )}
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                  </div>
                </td>
                <td>
                  <span style={{
                    background: 'rgba(0,255,135,0.1)', color: 'var(--green)',
                    border: '1px solid var(--border)', borderRadius: 5,
                    padding: '0.1rem 0.45rem', fontSize: '0.65rem', fontFamily: 'Orbitron', fontWeight: 700,
                  }}>{p.position_type}</span>
                </td>
                <td style={{ color: 'var(--text-muted)' }}>{p.club}</td>
                <td style={{ color: 'var(--text-muted)' }}>{p.nationality}</td>
                <td style={{ color: 'var(--green)', fontFamily: 'Orbitron', fontWeight: 700 }}>{p.overall_rating}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{p.era}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-secondary-custom" style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }} onClick={() => openEdit(p)}>Editar</button>
                    <button className="btn-danger-custom" onClick={() => remove(p.id)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No se encontraron jugadores</div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <h3>{editing ? 'EDITAR JUGADOR' : 'NUEVO JUGADOR'}</h3>
            <form onSubmit={save}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                {field('name', 'NOMBRE')}
                {field('age', 'EDAD', 'number')}
                {field('nationality', 'NACIONALIDAD')}
                {field('club', 'CLUB')}
                {field('position', 'POSICIÓN')}
                <div style={{ marginBottom: '0.8rem' }}>
                  <label className="form-label">TIPO POSICIÓN</label>
                  <select className="form-control" value={form.position_type}
                    onChange={e => setForm({ ...form, position_type: e.target.value })}>
                    {['GK','DEF','MID','FWD'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                {field('overall_rating', 'OVERALL', 'number')}
                {field('era', 'ERA')}
                {field('pace', 'VELOCIDAD', 'number')}
                {field('shooting', 'DISPARO', 'number')}
                {field('passing', 'PASE', 'number')}
                {field('dribbling', 'REGATE', 'number')}
                {field('defending', 'DEFENSA', 'number')}
                {field('physical', 'FÍSICO', 'number')}
              </div>
              {field('image_url', 'URL IMAGEN')}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn-primary-custom">GUARDAR</button>
                <button type="button" className="btn-secondary-custom" onClick={() => setModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
