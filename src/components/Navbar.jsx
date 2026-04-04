import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { to: '/players',  label: 'Jugadores', icon: '👥' },
  { to: '/versus',   label: 'Versus',    icon: '⚡' },
  { to: '/lineup',   label: 'Alineación',icon: '📋' },
  { to: '/match',    label: 'Partido',   icon: '🏟' },
  { to: '/teams',    label: 'Equipos',   icon: '⭐' },
  { to: '/live',     label: 'En Vivo',   icon: '🔴' },
];

const ADMIN_LINKS = [
  { to: '/admin/players', label: 'Jugadores', icon: '⚙' },
  { to: '/admin/users',   label: 'Usuarios',  icon: '👤' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); setOpen(false); };
  const close = () => setOpen(false);

  return (
    <>
      <nav style={{
        background: 'rgba(6,9,18,0.97)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
        padding: '0 1.5rem',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 200,
        gap: '1rem',
      }}>
        {/* Logo */}
        <NavLink to="/players" onClick={close} style={{
          color: 'var(--green)', fontFamily: 'Orbitron', fontSize: '1rem',
          letterSpacing: '2px', textDecoration: 'none', flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          textShadow: '0 0 20px rgba(0,255,135,0.4)',
        }}>
          ⚽ <span>FUTBOL - STARS</span>
        </NavLink>

        {/* Links desktop — centrados */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.1rem',
          flex: 1, justifyContent: 'center',
        }} className="nav-desktop">
          {NAV_LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                color: isActive ? 'var(--green)' : 'var(--text-muted)',
                fontWeight: 600, fontSize: '0.82rem', letterSpacing: '0.5px',
                padding: '0.35rem 0.7rem', borderRadius: 8,
                textDecoration: 'none', transition: 'all 0.15s', whiteSpace: 'nowrap',
                background: isActive ? 'rgba(0,255,135,0.08)' : 'transparent',
              })}
            >
              {link.label}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <>
              <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', margin: '0 0.3rem' }} />
              {ADMIN_LINKS.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  style={({ isActive }) => ({
                    color: isActive ? 'var(--green)' : 'rgba(107,122,153,0.7)',
                    fontWeight: 600, fontSize: '0.78rem',
                    padding: '0.3rem 0.6rem', borderRadius: 8,
                    textDecoration: 'none', transition: 'all 0.15s', whiteSpace: 'nowrap',
                    background: isActive ? 'rgba(0,255,135,0.08)' : 'transparent',
                  })}
                >
                  {link.icon} {link.label}
                </NavLink>
              ))}
            </>
          )}
        </div>

        {/* Usuario + logout desktop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexShrink: 0 }} className="nav-desktop">
          <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
            <div style={{ color: 'var(--text)', fontSize: '0.82rem', fontWeight: 700 }}>{user?.username}</div>
            <div style={{
              color: user?.role === 'admin' ? 'var(--green)' : 'var(--text-muted)',
              fontSize: '0.58rem', fontFamily: 'Orbitron', letterSpacing: '1px',
            }}>{user?.role?.toUpperCase()}</div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Salir</button>
        </div>

        {/* Hamburguesa móvil */}
        <button
          onClick={() => setOpen(!open)}
          className="nav-hamburger"
          aria-label="Menú"
          style={{
            background: open ? 'rgba(0,255,135,0.1)' : 'none',
            border: `1px solid ${open ? 'var(--green)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 8, color: open ? 'var(--green)' : 'var(--text)',
            cursor: 'pointer', padding: '0.4rem 0.7rem',
            fontSize: '1.1rem', lineHeight: 1, transition: 'all 0.2s',
          }}
        >
          {open ? '✕' : '☰'}
        </button>
      </nav>

      {/* Menú móvil */}
      {open && (
        <div style={{
          position: 'fixed', top: 60, left: 0, right: 0, bottom: 0,
          background: 'rgba(6,9,18,0.98)',
          backdropFilter: 'blur(20px)',
          zIndex: 199,
          display: 'flex', flexDirection: 'column',
          padding: '1rem',
          borderTop: '1px solid var(--border)',
          overflowY: 'auto',
          animation: 'fadeInUp 0.2s ease',
        }}>
          {/* Info usuario */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.8rem',
            padding: '0.9rem 1rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 12, marginBottom: '1rem',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--green), var(--green-dark))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Orbitron', fontWeight: 900, color: '#060912', fontSize: '0.95rem',
            }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{user?.username}</div>
              <div style={{ color: user?.role === 'admin' ? 'var(--green)' : 'var(--text-muted)', fontSize: '0.65rem', fontFamily: 'Orbitron' }}>
                {user?.role?.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Links principales */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.8rem' }}>
            {NAV_LINKS.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={close}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.8rem 1rem', borderRadius: 10,
                  textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem',
                  color: isActive ? 'var(--green)' : 'var(--text)',
                  background: isActive ? 'rgba(0,255,135,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isActive ? 'var(--border)' : 'rgba(255,255,255,0.05)'}`,
                  transition: 'all 0.15s',
                })}
              >
                <span style={{ fontSize: '1.1rem' }}>{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Admin links */}
          {user?.role === 'admin' && (
            <>
              <div style={{
                color: 'var(--text-muted)', fontSize: '0.65rem', fontFamily: 'Orbitron',
                letterSpacing: '2px', padding: '0.5rem 0.3rem 0.4rem',
              }}>ADMINISTRACIÓN</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.8rem' }}>
                {ADMIN_LINKS.map(link => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={close}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      padding: '0.8rem 1rem', borderRadius: 10,
                      textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem',
                      color: isActive ? 'var(--green)' : 'var(--text-muted)',
                      background: isActive ? 'rgba(0,255,135,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isActive ? 'var(--border)' : 'rgba(255,255,255,0.04)'}`,
                    })}
                  >
                    <span>{link.icon}</span>{link.label}
                  </NavLink>
                ))}
              </div>
            </>
          )}

          <div style={{ flex: 1 }} />

          <button onClick={handleLogout} style={{
            background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.25)',
            color: 'var(--red)', borderRadius: 10, padding: '0.85rem',
            cursor: 'pointer', fontFamily: 'Rajdhani', fontWeight: 700,
            fontSize: '1rem', width: '100%',
          }}>
            Cerrar sesión
          </button>
        </div>
      )}

      <style>{`
        .nav-hamburger { display: none; }
        @media (max-width: 900px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: block !important; }
        }
        @media (min-width: 901px) {
          .navbar a:hover {
            color: var(--text) !important;
            background: rgba(255,255,255,0.05) !important;
          }
        }
      `}</style>
    </>
  );
}
