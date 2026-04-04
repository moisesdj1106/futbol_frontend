import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API_URL from '../config';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setSuccess('Cuenta creada. Redirigiendo...');
      setTimeout(() => navigate('/login'), 1500);
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">
          
          <h1>FUTBOL - STARS ⚽</h1>
          <p>Crea tu cuenta</p>
        </div>

        {error && <div className="alert-error">⚠ {error}</div>}
        {success && <div className="alert-success">✓ {success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <input
              className="form-control"
              placeholder="Tu nombre de usuario"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="tu@email.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1.8rem' }}>
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn-primary-custom" disabled={loading}>
            {loading ? 'CREANDO...' : 'CREAR CUENTA'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.8rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: 'var(--green)', textDecoration: 'none', fontWeight: 700 }}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
