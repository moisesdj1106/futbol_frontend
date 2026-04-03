import { useEffect } from 'react';

const STATS = [
  { key: 'pace',      label: 'Velocidad',  icon: '⚡' },
  { key: 'shooting',  label: 'Disparo',    icon: '🎯' },
  { key: 'passing',   label: 'Pase',       icon: '🔄' },
  { key: 'dribbling', label: 'Regate',     icon: '🌀' },
  { key: 'defending', label: 'Defensa',    icon: '🛡' },
  { key: 'physical',  label: 'Físico',     icon: '💪' },
];

function StatRow({ icon, label, value }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span>{icon}</span>{label.toUpperCase()}
        </span>
        <span style={{ fontFamily: 'Orbitron', fontWeight: 700, fontSize: '0.85rem', color: value >= 85 ? 'var(--green)' : value >= 70 ? '#ffd700' : 'var(--text)' }}>
          {value}
        </span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 3,
          width: `${value}%`,
          background: value >= 85
            ? 'linear-gradient(90deg, #00c96b, #00ff87)'
            : value >= 70
            ? 'linear-gradient(90deg, #b8860b, #ffd700)'
            : 'linear-gradient(90deg, #1a3a5c, #2a5a8c)',
          transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)',
        }} />
      </div>
    </div>
  );
}

export default function PlayerModal({ player, onClose }) {
  // Cerrar con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!player) return null;

  const overall = player.overall_rating;
  const overallColor = overall >= 90 ? '#00ff87' : overall >= 80 ? '#ffd700' : overall >= 70 ? '#ff9500' : '#aaa';

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ alignItems: 'center' }}
    >
      <div style={{
        background: 'var(--dark3)',
        border: '1px solid var(--border)',
        borderRadius: 24,
        width: '100%',
        maxWidth: 680,
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 60px rgba(0,255,135,0.06)',
        animation: 'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Header con imagen */}
        <div style={{
          position: 'relative',
          height: 260,
          background: 'linear-gradient(135deg, var(--dark4) 0%, var(--dark2) 100%)',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {/* Fondo decorativo */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse at 70% 50%, rgba(0,255,135,0.08) 0%, transparent 60%)`,
          }} />

          {/* Imagen del jugador */}
          {player.image_url ? (
            <img
              src={player.image_url}
              alt={player.name}
              style={{
                position: 'absolute',
                right: 0, bottom: 0,
                height: '100%',
                maxWidth: '55%',
                objectFit: 'cover',
                objectPosition: 'top center',
                filter: 'drop-shadow(-10px 0 30px rgba(0,0,0,0.5))',
              }}
            />
          ) : (
            <div style={{
              position: 'absolute', right: '5%', bottom: 0,
              fontSize: '10rem', opacity: 0.08, lineHeight: 1,
            }}>⚽</div>
          )}

          {/* Gradiente sobre imagen */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, var(--dark3) 35%, transparent 70%)',
          }} />

          {/* Info principal */}
          <div style={{ position: 'absolute', left: '1.8rem', bottom: '1.8rem', zIndex: 2 }}>
            {/* Overall */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 64, height: 64, borderRadius: 16,
              background: `linear-gradient(135deg, ${overallColor}22, ${overallColor}44)`,
              border: `2px solid ${overallColor}`,
              fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1.6rem',
              color: overallColor,
              boxShadow: `0 0 30px ${overallColor}44`,
              marginBottom: '0.8rem',
            }}>{overall}</div>

            <div style={{ fontFamily: 'Orbitron', fontSize: '1.5rem', color: '#fff', lineHeight: 1.1, marginBottom: '0.4rem' }}>
              {player.name}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{
                background: 'rgba(0,255,135,0.12)', color: 'var(--green)',
                border: '1px solid var(--border)', borderRadius: 6,
                padding: '0.2rem 0.6rem', fontSize: '0.7rem',
                fontFamily: 'Orbitron', fontWeight: 700, letterSpacing: 1,
              }}>{player.position_type}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{player.position}</span>
            </div>
          </div>

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16, zIndex: 3,
              background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-muted)', width: 36, height: 36, borderRadius: '50%',
              cursor: 'pointer', fontSize: '1rem', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,77,109,0.3)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >✕</button>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: '1.5rem 1.8rem', overflowY: 'auto', flex: 1 }}>
          {/* Datos del jugador */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.8rem', marginBottom: '1.5rem',
          }}>
            {[
              { label: 'Club', value: player.club },
              { label: 'Nacionalidad', value: player.nationality },
              { label: 'Edad', value: player.age ? `${player.age} años` : '—' },
              { label: 'Era', value: player.era || '—' },
            ].map(item => (
              <div key={item.label} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10, padding: '0.7rem 0.9rem',
              }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1px', marginBottom: '0.3rem' }}>
                  {item.label.toUpperCase()}
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Estadísticas */}
          <div style={{
            fontFamily: 'Orbitron', color: 'var(--green)', fontSize: '0.7rem',
            letterSpacing: '2px', marginBottom: '1rem',
          }}>ESTADÍSTICAS</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 2rem' }}>
            {STATS.map(s => (
              <StatRow key={s.key} icon={s.icon} label={s.label} value={player[s.key] ?? 0} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
