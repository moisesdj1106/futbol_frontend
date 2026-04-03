export default function PlayerCard({ player, selected, onClick, showStats }) {
  const stats = [
    { key: 'pace', lbl: 'VEL' },
    { key: 'shooting', lbl: 'DIS' },
    { key: 'passing', lbl: 'PAS' },
    { key: 'dribbling', lbl: 'REG' },
    { key: 'defending', lbl: 'DEF' },
    { key: 'physical', lbl: 'FIS' },
  ];

  return (
    <div className={`player-card ${selected ? 'selected' : ''}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="player-img-wrap">
        {player.image_url
          ? <img src={player.image_url} alt={player.name} />
          : <span className="no-img">⚽</span>
        }
        <div className="overall-badge">{player.overall_rating}</div>
        <div className="pos-badge">{player.position_type}</div>
      </div>

      <div className="player-info">
        <div className="player-name">{player.name}</div>
        <div className="player-club">{player.club} · {player.nationality}</div>
        {player.era && <span className="player-era">{player.era}</span>}

        {showStats && (
          <div className="mini-stats">
            {stats.map(s => (
              <div key={s.key} className="mini-stat">
                <div className="val">{player[s.key]}</div>
                <div className="lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
