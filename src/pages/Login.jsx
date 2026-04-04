import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      login(data.user, data.token);
      navigate('/players');
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
          <div className="icon">⚽</div>
          <h1>FUTBOLSTARS</h1>
          <p>Estadísticas · Versus · Alineaciones</p>
        </div>

        {error && <div className="alert-error">⚠ {error}</div>}

        <form onSubmit={handleSubmit}>
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
            {loading ? 'INGRESANDO...' : 'INGRESAR AL CAMPO'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.8rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          ¿No tienes cuenta?{' '}
          <Link to="/register" style={{ color: 'var(--green)', textDecoration: 'none', fontWeight: 700 }}>
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
