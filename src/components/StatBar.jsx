export default function StatBar({ label, value, highlight }) {
  return (
    <div className="stat-bar-wrap">
      <div className="stat-bar-label">
        <span>{label}</span>
        <span style={{ color: highlight ? 'var(--green)' : 'var(--text)', fontFamily: 'Orbitron', fontSize: '0.75rem' }}>
          {value}
        </span>
      </div>
      <div className="stat-bar-track">
        <div
          className="stat-bar-fill"
          style={{
            width: `${value}%`,
            background: highlight
              ? 'linear-gradient(90deg, #00c96b, #00ff87)'
              : 'linear-gradient(90deg, #1a3a5c, #2a5a8c)',
          }}
        />
      </div>
    </div>
  );
}
