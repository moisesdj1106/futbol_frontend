import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); setOpen(false); };
  const close = () => setOpen(false);

  return (
    <>
      <nav style={{
        background: 'rgba(6,9,18,0.95)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
        padding: '0 1.2rem',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 200,
      }}>
        {/* Logo */}
        <NavLink to="/players" onClick={close} style={{
          color: 'var(--green)', fontFamily: 'Orbitron', fontSize: '1.1rem',
          letterSpacing: '2px', textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          textShadow: '0 0 20px rgba(0,255,135,0.4)',
        }}>
          ⚽ FUTBOLSTARS
        </NavLink>

        {/* Links desktop */}
        <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }} className="nav-desktop">
          <NavLink to="/players" className="nav-link">Jugadores</NavLink>
          <NavLink to="/versus" className="nav-link">Versus</NavLink>
          <NavLink to="/lineup" className="nav-link">Alineación</NavLink>
          <NavLink to="/match" className="nav-link">Partido</NavLink>
          <NavLink to="/teams" className="nav-link">Equipos</NavLink>
          <NavLink to="/live" className="nav-link">En Vivo</NavLink>
          {user?.role === 'admin' && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.1)', margin: '0 0.2rem' }}>|</span>
              <NavLink to="/admin/players" className="nav-link">Gestionar</NavLink>
              <NavLink to="/admin/users" className="nav-link">Usuarios</NavLink>
            </>
          )}
        </div>

        {/* Usuario + logout desktop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }} className="nav-desktop">
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'var(--text)', fontSize: '0.82rem', fontWeight: 600 }}>{user?.username}</div>
            <div style={{ color: user?.role === 'admin' ? 'var(--green)' : 'var(--text-muted)', fontSize: '0.6rem', fontFamily: 'Orbitron', letterSpacing: '1px' }}>
              {user?.role?.toUpperCase()}
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Salir</button>
        </div>

        {/* Hamburguesa móvil */}
        <button
          onClick={() => setOpen(!open)}
          className="nav-hamburger"
          aria-label="Menú"
          style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, color: 'var(--text)', cursor: 'pointer',
            padding: '0.4rem 0.6rem', fontSize: '1.2rem', lineHeight: 1,
          }}
        >
          {open ? '✕' : '☰'}
        </button>
      </nav>

      {/* Menú móvil desplegable */}
      {open && (
        <div style={{
          position: 'fixed', top: 60, left: 0, right: 0, bottom: 0,
          background: 'rgba(6,9,18,0.98)',
          backdropFilter: 'blur(20px)',
          zIndex: 199,
          display: 'flex', flexDirection: 'column',
          padding: '1.5rem 1.2rem',
          borderTop: '1px solid var(--border)',
          overflowY: 'auto',
          animation: 'fadeInUp 0.2s ease',
        }}>
          {/* Info usuario */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.8rem',
            padding: '1rem', background: 'rgba(255,255,255,0.03)',
            borderRadius: 12, marginBottom: '1.5rem',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--green), var(--green-dark))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Orbitron', fontWeight: 900, color: '#060912', fontSize: '1rem',
            }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>{user?.username}</div>
              <div style={{ color: user?.role === 'admin' ? 'var(--green)' : 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'Orbitron' }}>
                {user?.role?.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Links */}
          {[
            { to: '/players', label: '👥 Jugadores' },
            { to: '/versus', label: '⚡ Versus' },
            { to: '/lineup', label: '📋 Alineación' },
            { to: '/match', label: '🏟 Partido' },
            { to: '/teams', label: '⭐ Equipos' },
            { to: '/live', label: '🔴 En Vivo' },
          ].map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={close}
              style={({ isActive }) => ({
                display: 'block', padding: '0.9rem 1rem',
                borderRadius: 10, marginBottom: '0.4rem',
                textDecoration: 'none', fontWeight: 700, fontSize: '1rem',
                color: isActive ? 'var(--green)' : 'var(--text)',
                background: isActive ? 'rgba(0,255,135,0.08)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--border)' : 'transparent'}`,
                transition: 'all 0.15s',
              })}
            >
              {link.label}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'Orbitron', letterSpacing: '2px', margin: '1rem 0 0.5rem', padding: '0 0.5rem' }}>
                ADMINISTRACIÓN
              </div>
              {[
                { to: '/admin/players', label: '⚙ Gestionar Jugadores' },
                { to: '/admin/users', label: '👤 Gestionar Usuarios' },
              ].map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={close}
                  style={({ isActive }) => ({
                    display: 'block', padding: '0.9rem 1rem',
                    borderRadius: 10, marginBottom: '0.4rem',
                    textDecoration: 'none', fontWeight: 700, fontSize: '1rem',
                    color: isActive ? 'var(--green)' : 'var(--text-muted)',
                    background: isActive ? 'rgba(0,255,135,0.08)' : 'transparent',
                    border: `1px solid ${isActive ? 'var(--border)' : 'transparent'}`,
                  })}
                >
                  {link.label}
                </NavLink>
              ))}
            </>
          )}

          <div style={{ flex: 1 }} />

          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.3)',
              color: 'var(--red)', borderRadius: 10, padding: '0.9rem',
              cursor: 'pointer', fontFamily: 'Rajdhani', fontWeight: 700,
              fontSize: '1rem', width: '100%', marginTop: '1rem',
            }}
          >
            Cerrar sesión
          </button>
        </div>
      )}

      <style>{`
        .nav-hamburger { display: none; }
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: block !important; }
        }
      `}</style>
    </>
  );
}
