import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="navbar">
      <NavLink to="/players" className="brand">
        <span style={{ fontSize: '1.4rem' }}>⚽</span> FUTBOLSTARS
      </NavLink>

      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        <NavLink to="/players" className="nav-link">Jugadores</NavLink>
        <NavLink to="/versus" className="nav-link">Versus</NavLink>
        <NavLink to="/lineup" className="nav-link">Alineación</NavLink>
        <NavLink to="/match" className="nav-link">Partido</NavLink>
        {user?.role === 'admin' && (
          <>
            <span style={{ color: 'rgba(255,255,255,0.1)', margin: '0 0.25rem' }}>|</span>
            <NavLink to="/admin/players" className="nav-link">Jugadores</NavLink>
            <NavLink to="/admin/users" className="nav-link">Usuarios</NavLink>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'var(--text)', fontSize: '0.85rem', fontWeight: 600 }}>{user?.username}</div>
          <div style={{ color: user?.role === 'admin' ? 'var(--green)' : 'var(--text-muted)', fontSize: '0.65rem', fontFamily: 'Orbitron', letterSpacing: '1px' }}>
            {user?.role?.toUpperCase()}
          </div>
        </div>
        <button className="btn-logout" onClick={handleLogout}>Salir</button>
      </div>
    </nav>
  );
}
