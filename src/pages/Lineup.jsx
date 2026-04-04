import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

const PRESET_FORMATIONS = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2', '4-3-2-1', '3-4-3', '5-4-1'];

function validateFormation(f) {
  const parts = f.trim().split('-');
  if (parts.length < 3 || parts.length > 4) return 'Debe tener 3 o 4 líneas (ej: 4-3-3 o 4-2-3-1)';
  const nums = parts.map(Number);
  if (nums.some(isNaN) || nums.some(n => n < 1 || n > 6)) return 'Cada línea debe tener entre 1 y 6 jugadores';
  const total = nums.reduce((a, b) => a + b, 0);
  if (total !== 10) return `La suma debe ser 10 (tienes ${total})`;
  return null;
}

function FieldPlayer({ player }) {
  return (
    <div className="field-player">
      <div className="avatar">
        {player.image_url
          ? <img src={player.image_url} alt={player.name} />
          : '⚽'}
      </div>
      <div className="p-name">{player.name.split(' ').pop()}</div>
      <div className="p-rating">{player.overall_rating}</div>
    </div>
  );
}

export default function Lineup() {
  const { token } = useAuth();
  const [formation, setFormation] = useState('4-3-3');
  const [customInput, setCustomInput] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [lineup, setLineup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const activeFormation = useCustom ? customInput : formation;

  const generate = async () => {
    setError('');
    const f = activeFormation.trim();
    const validationError = validateFormation(f);
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/players/lineup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ formation: f }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setLineup(data);
    } catch {
      setError('Error al generar la alineación');
    } finally {
      setLoading(false);
    }
  };

  const allPlayers = lineup
    ? [...lineup.lineup.forwards, ...lineup.lineup.midfielders, ...lineup.lineup.defenders, ...lineup.lineup.goalkeeper]
    : [];

  return (
    <div className="page-wrapper">
      <h1 className="page-title">ALINEACIÓN <span>IDEAL</span></h1>
      <p className="page-subtitle">Elige o escribe una formación y genera el once perfecto</p>

      {/* Selector de formación */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {PRESET_FORMATIONS.map(f => (
              <button
                key={f}
                className={`formation-pill ${!useCustom && formation === f ? 'active' : ''}`}
                onClick={() => { setFormation(f); setUseCustom(false); setLineup(null); setError(''); }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Formación personalizada */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="custom-toggle"
                checked={useCustom}
                onChange={e => { setUseCustom(e.target.checked); setLineup(null); setError(''); }}
                style={{ accentColor: 'var(--green)', width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="custom-toggle" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
                Formación personalizada
              </label>
            </div>
            {useCustom && (
              <input
                className="form-control"
                style={{ maxWidth: 160 }}
                placeholder="ej: 3-3-4"
                value={customInput}
                onChange={e => { setCustomInput(e.target.value); setLineup(null); }}
              />
            )}
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Formación activa:{' '}
              <span style={{ color: 'var(--green)', fontFamily: 'Orbitron', fontWeight: 700 }}>
                {activeFormation || '—'}
              </span>
            </div>
          </div>
        </div>

        {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>⚠ {error}</div>}

        <button
          className="btn-primary-custom"
          style={{ width: 'auto', padding: '0.75rem 2.5rem' }}
          onClick={generate}
          disabled={loading}
        >
          {loading ? 'GENERANDO...' : '⚡ GENERAR ONCE IDEAL'}
        </button>
      </div>

      {/* Resultado */}
      {lineup && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
          {/* Campo */}
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <span style={{ fontFamily: 'Orbitron', color: 'var(--green)', fontSize: '1.1rem', letterSpacing: '4px' }}>
                {lineup.formation}
              </span>
            </div>
            <div className="field">
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.1 }} viewBox="0 0 400 580" preserveAspectRatio="none">
                <rect x="15" y="15" width="370" height="550" fill="none" stroke="white" strokeWidth="2" rx="4"/>
                <line x1="15" y1="290" x2="385" y2="290" stroke="white" strokeWidth="1.5"/>
                <circle cx="200" cy="290" r="55" fill="none" stroke="white" strokeWidth="1.5"/>
                <circle cx="200" cy="290" r="4" fill="white"/>
                <rect x="115" y="15" width="170" height="65" fill="none" stroke="white" strokeWidth="1.5"/>
                <rect x="115" y="500" width="170" height="65" fill="none" stroke="white" strokeWidth="1.5"/>
                <rect x="155" y="15" width="90" height="28" fill="none" stroke="white" strokeWidth="1.5"/>
                <rect x="155" y="537" width="90" height="28" fill="none" stroke="white" strokeWidth="1.5"/>
                <circle cx="200" cy="100" r="3" fill="white" opacity="0.6"/>
                <circle cx="200" cy="480" r="3" fill="white" opacity="0.6"/>
              </svg>

              <div className="field-row">
                {lineup.lineup.forwards.map(p => <FieldPlayer key={p.id} player={p} />)}
              </div>
              <div className="field-row">
                {lineup.lineup.midfielders.map(p => <FieldPlayer key={p.id} player={p} />)}
              </div>
              <div className="field-row">
                {lineup.lineup.defenders.map(p => <FieldPlayer key={p.id} player={p} />)}
              </div>
              <div className="field-row">
                {lineup.lineup.goalkeeper.map(p => <FieldPlayer key={p.id} player={p} />)}
              </div>
            </div>
          </div>

          {/* Lista */}
          <div className="glass-card">
            <div style={{ fontFamily: 'Orbitron', color: 'var(--green)', fontSize: '0.75rem', letterSpacing: '2px', marginBottom: '1rem' }}>
              ONCE TITULAR
            </div>
            <table className="dark-table">
              <thead>
                <tr><th>#</th><th>JUGADOR</th><th>POS</th><th>OVR</th></tr>
              </thead>
              <tbody>
                {allPlayers.map((p, i) => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'Orbitron', fontSize: '0.7rem', width: 30 }}>{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{p.club}</div>
                    </td>
                    <td>
                      <span style={{
                        background: 'rgba(0,255,135,0.1)', color: 'var(--green)',
                        border: '1px solid var(--border)', borderRadius: '5px',
                        padding: '0.1rem 0.45rem', fontSize: '0.65rem',
                        fontFamily: 'Orbitron', fontWeight: 700,
                      }}>{p.position_type}</span>
                    </td>
                    <td style={{ color: 'var(--green)', fontFamily: 'Orbitron', fontWeight: 700, fontSize: '0.9rem' }}>{p.overall_rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
