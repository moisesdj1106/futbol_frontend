import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config';

export default function ManageUsers() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', role: 'user' });
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');

  const load = () =>
    fetch(`${API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setUsers);

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u => {
    const matchSearch = u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const openEdit = (u) => { setForm({ username: u.username, email: u.email, role: u.role }); setEditing(u.id); setModal(true); setMsg(''); };

  const save = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/api/users/${editing}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    if (res.ok) { setModal(false); load(); setMsg('Usuario actualizado'); setTimeout(() => setMsg(''), 3000); }
  };

  const remove = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    await fetch(`${API_URL}/api/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  return (
    <div className="page-wrapper">
      <h1 className="page-title">GESTIONAR <span>USUARIOS</span></h1>
      <p className="page-subtitle">{filtered.length} de {users.length} usuarios registrados</p>

      {msg && <div className="alert-success">{msg}</div>}

      {/* Filtros */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.2rem' }}>
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 340 }}>
            <span className="search-icon">🔍</span>
            <input className="form-control" placeholder="Buscar por nombre o email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {['ALL', 'admin', 'user'].map(role => (
            <button key={role} className={`filter-pill ${filterRole === role ? 'active' : ''}`} onClick={() => setFilterRole(role)}>
              {role === 'ALL' ? 'Todos' : role === 'admin' ? 'Admins' : 'Usuarios'}
            </button>
          ))}

          {(search || filterRole !== 'ALL') && (
            <button className="btn-secondary-custom" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
              onClick={() => { setSearch(''); setFilterRole('ALL'); }}>
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ overflowX: 'auto' }}>
        <table className="dark-table" style={{ minWidth: 500 }}>
          <thead>
            <tr><th>USUARIO</th><th>EMAIL</th><th>ROL</th><th>REGISTRO</th><th>ACCIONES</th></tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.username}</td>
                <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                <td>
                  <span style={{
                    background: u.role === 'admin' ? 'rgba(0,255,135,0.1)' : 'rgba(255,255,255,0.05)',
                    color: u.role === 'admin' ? 'var(--green)' : 'var(--text-muted)',
                    border: `1px solid ${u.role === 'admin' ? 'var(--border)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 5, padding: '0.15rem 0.6rem',
                    fontSize: '0.7rem', fontFamily: 'Orbitron', fontWeight: 700,
                  }}>{u.role.toUpperCase()}</span>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {new Date(u.created_at).toLocaleDateString('es-ES')}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-secondary-custom" style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }} onClick={() => openEdit(u)}>Editar</button>
                    <button className="btn-danger-custom" onClick={() => remove(u.id)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No se encontraron usuarios</div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-box">
            <h3>EDITAR USUARIO</h3>
            <form onSubmit={save}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">USUARIO</label>
                <input className="form-control" value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })} required />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">EMAIL</label>
                <input type="email" className="form-control" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">ROL</label>
                <select className="form-control" value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
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
