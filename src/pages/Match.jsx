import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useSounds } from "../hooks/useSounds";
import API_URL from "../config";

// Cuantos de cada posicion se permiten por equipo
const POS_LIMITS = { GK: 1, DEF: 4, MID: 4, FWD: 3 };
const POS_LABELS = { GK: "Portero", DEF: "Defensa", MID: "Mediocampista", FWD: "Delantero" };
const TEAM_COLORS = { 1: "0,150,255", 2: "255,100,0" };

function posCount(team, pos) {
  return team.filter(p => p.position_type === pos).length;
}

function canAdd(team, player) {
  if (team.length >= 11) return { ok: false, reason: "Equipo completo (11/11)" };
  const limit = POS_LIMITS[player.position_type];
  const current = posCount(team, player.position_type);
  if (current >= limit) return { ok: false, reason: `Máx ${limit} ${POS_LABELS[player.position_type]}(s)` };
  return { ok: true };
}

// Card de jugador para seleccion
function SelectableCard({ player, status, onAdd, activeTeam }) {
  // status: "free" | "team1" | "team2" | "blocked"
  const color = TEAM_COLORS[activeTeam];
  const isInTeam = status === "team1" || status === "team2";
  const isBlocked = status === "blocked";
  const [tooltip, setTooltip] = useState("");

  const handleClick = () => {
    if (isBlocked) return;
    const result = onAdd(player);
    if (result && !result.ok) {
      setTooltip(result.reason);
      setTimeout(() => setTooltip(""), 2000);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        background: isInTeam
          ? `rgba(${status === "team1" ? TEAM_COLORS[1] : TEAM_COLORS[2]},0.1)`
          : "linear-gradient(160deg, var(--dark3) 0%, var(--dark2) 100%)",
        border: `1px solid ${
          isInTeam
            ? `rgba(${status === "team1" ? TEAM_COLORS[1] : TEAM_COLORS[2]},0.5)`
            : isBlocked ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.07)"
        }`,
        borderRadius: 16,
        overflow: "hidden",
        cursor: isBlocked ? "not-allowed" : "pointer",
        opacity: isBlocked ? 0.35 : 1,
        transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        position: "relative",
        transform: isInTeam ? "scale(0.97)" : undefined,
      }}
      onMouseEnter={e => { if (!isBlocked && !isInTeam) e.currentTarget.style.transform = "translateY(-5px) scale(1.02)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = isInTeam ? "scale(0.97)" : ""; }}
    >
      {/* Imagen */}
      <div style={{
        height: 160, position: "relative", overflow: "hidden",
        background: "linear-gradient(180deg, rgba(0,255,135,0.03) 0%, rgba(0,0,0,0.5) 100%)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}>
        {player.image_url
          ? <img src={player.image_url} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
          : <span style={{ fontSize: "4rem", opacity: 0.12, paddingBottom: "0.5rem" }}>⚽</span>
        }
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)" }} />

        {/* Overall badge */}
        <div style={{
          position: "absolute", top: 8, left: 8,
          background: isInTeam
            ? `linear-gradient(135deg, rgb(${status === "team1" ? TEAM_COLORS[1] : TEAM_COLORS[2]}), rgba(${status === "team1" ? TEAM_COLORS[1] : TEAM_COLORS[2]},0.7))`
            : "linear-gradient(135deg, var(--green), var(--green-dark))",
          color: "#060912", fontFamily: "Orbitron", fontWeight: 900,
          fontSize: "0.9rem", width: 40, height: 40, borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        }}>{player.overall_rating}</div>

        {/* Pos badge */}
        <div style={{
          position: "absolute", top: 8, right: 8,
          background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.15)",
          color: "#fff", fontFamily: "Orbitron", fontWeight: 700,
          fontSize: "0.6rem", padding: "0.2rem 0.45rem", borderRadius: 5, letterSpacing: 1,
        }}>{player.position_type}</div>

        {/* Equipo badge */}
        {isInTeam && (
          <div style={{
            position: "absolute", bottom: 8, right: 8,
            background: `rgba(${status === "team1" ? TEAM_COLORS[1] : TEAM_COLORS[2]},0.9)`,
            color: "#fff", fontFamily: "Orbitron", fontWeight: 700,
            fontSize: "0.6rem", padding: "0.2rem 0.5rem", borderRadius: 5, letterSpacing: 1,
          }}>EQ {status === "team1" ? "1" : "2"}</div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "0.75rem 0.9rem" }}>
        <div style={{ fontFamily: "Orbitron", fontSize: "0.78rem", marginBottom: "0.2rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {player.name}
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>{player.club}</div>
      </div>

      {/* Tooltip de error */}
      {tooltip && (
        <div style={{
          position: "absolute", inset: 0, background: "rgba(255,77,109,0.85)",
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 16, fontSize: "0.8rem", fontWeight: 700, color: "#fff",
          textAlign: "center", padding: "0.5rem", zIndex: 10,
        }}>{tooltip}</div>
      )}
    </div>
  );
}

function TeamPanel({ team, name, color, onRemove }) {
  const byPos = { GK: [], DEF: [], MID: [], FWD: [] };
  team.forEach(p => byPos[p.position_type]?.push(p));

  return (
    <div className="glass-card" style={{ borderColor: `rgba(${color},0.25)`, height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div style={{ fontFamily: "Orbitron", color: `rgb(${color})`, fontSize: "0.85rem", letterSpacing: "2px" }}>{name}</div>
        <div style={{
          fontFamily: "Orbitron", fontWeight: 900, fontSize: "1rem",
          color: team.length === 11 ? "var(--green)" : `rgb(${color})`,
        }}>{team.length}/11</div>
      </div>

      {/* Barra de progreso */}
      <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginBottom: "1rem", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 2, transition: "width 0.3s",
          width: `${(team.length / 11) * 100}%`,
          background: team.length === 11 ? "var(--green)" : `rgb(${color})`,
        }} />
      </div>

      {/* Slots por posicion */}
      {Object.entries(byPos).map(([pos, players]) => (
        <div key={pos} style={{ marginBottom: "0.8rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "Orbitron", letterSpacing: "1px" }}>{pos}</span>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{players.length}/{POS_LIMITS[pos]}</span>
          </div>
          {players.length === 0 ? (
            <div style={{
              height: 32, borderRadius: 8, border: "1px dashed rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-muted)", fontSize: "0.72rem",
            }}>vacío</div>
          ) : (
            players.map(p => (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.35rem 0.6rem", borderRadius: 8, marginBottom: "0.25rem",
                background: `rgba(${color},0.07)`, border: `1px solid rgba(${color},0.15)`,
              }}>
                <span style={{ flex: 1, fontSize: "0.82rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
                <span style={{ fontFamily: "Orbitron", fontSize: "0.72rem", color: "var(--green)" }}>{p.overall_rating}</span>
                <button onClick={() => onRemove(p)} style={{
                  background: "none", border: "none", color: "var(--text-muted)",
                  cursor: "pointer", fontSize: "0.85rem", padding: "0 0.2rem", lineHeight: 1,
                }}>✕</button>
              </div>
            ))
          )}
        </div>
      ))}

      {team.length === 11 && (
        <div style={{
          textAlign: "center", color: "var(--green)", fontFamily: "Orbitron",
          fontSize: "0.7rem", letterSpacing: "2px", marginTop: "0.5rem",
          padding: "0.5rem", background: "rgba(0,255,135,0.06)", borderRadius: 8,
        }}>✓ EQUIPO LISTO</div>
      )}
    </div>
  );
}

function ScoreBoard({ score1, score2, teamName1, teamName2, winner, running }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, var(--dark3), var(--dark4))",
      border: "1px solid var(--border)", borderRadius: 20, padding: "2rem",
      display: "flex", alignItems: "center", justifyContent: "space-around",
      marginBottom: "1.5rem", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(0,255,135,0.04), transparent 70%)", pointerEvents: "none" }} />
      {[
        { name: teamName1, score: score1, color: TEAM_COLORS[1], w: winner === 1 },
        { name: teamName2, score: score2, color: TEAM_COLORS[2], w: winner === 2 },
      ].map((t, i) => (
        <div key={i} style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontFamily: "Orbitron", fontSize: "0.7rem", color: `rgb(${t.color})`, letterSpacing: "2px", marginBottom: "0.5rem" }}>{t.name}</div>
          <div style={{
            fontFamily: "Orbitron", fontSize: "4.5rem", fontWeight: 900, lineHeight: 1,
            color: t.w ? "var(--green)" : "#fff",
            textShadow: t.w ? "0 0 40px rgba(0,255,135,0.6)" : "none",
            transition: "all 0.3s",
          }}>{t.score}</div>
          {t.w && <div style={{ color: "var(--green)", fontFamily: "Orbitron", fontSize: "0.6rem", letterSpacing: "3px", marginTop: "0.3rem" }}>GANADOR 🏆</div>}
        </div>
      ))}
      <div style={{ fontFamily: "Orbitron", fontSize: "1.2rem", color: "var(--text-muted)", padding: "0 1rem" }}>
        {running ? <span style={{ color: "var(--red)", animation: "pulse 1s infinite" }}>●</span> : "—"}
      </div>
    </div>
  );
}

export default function Match() {
  const { token } = useAuth();
  const sounds = useSounds();
  const [players, setPlayers] = useState([]);
  const [team1, setTeam1] = useState([]);
  const [team2, setTeam2] = useState([]);
  const [teamName1, setTeamName1] = useState("Equipo 1");
  const [teamName2, setTeamName2] = useState("Equipo 2");
  const [activeTeam, setActiveTeam] = useState(1);
  const [result, setResult] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [visibleEvents, setVisibleEvents] = useState([]);
  const [liveScore1, setLiveScore1] = useState(0);
  const [liveScore2, setLiveScore2] = useState(0);
  const [simDone, setSimDone] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPos, setFilterPos] = useState("ALL");
  const eventsRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/api/players`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setPlayers);
  }, [token]);

  const getStatus = (player) => {
    if (team1.find(p => p.id === player.id)) return "team1";
    if (team2.find(p => p.id === player.id)) return "team2";
    return "free";
  };

  const handleAdd = (player) => {
    const team = activeTeam === 1 ? team1 : team2;
    const setTeam = activeTeam === 1 ? setTeam1 : setTeam2;
    const status = getStatus(player);

    // Si ya esta en el equipo activo, lo quita
    if ((activeTeam === 1 && status === "team1") || (activeTeam === 2 && status === "team2")) {
      setTeam(team.filter(p => p.id !== player.id));
      return { ok: true };
    }
    // Si esta en el otro equipo, bloqueado
    if (status !== "free") return { ok: false, reason: "Ya en otro equipo" };

    const check = canAdd(team, player);
    if (!check.ok) return check;
    setTeam([...team, player]);
    return { ok: true };
  };

  const simulate = async () => {
    if (team1.length !== 11 || team2.length !== 11) return;
    setSimulating(true);
    setResult(null);
    setVisibleEvents([]);
    setLiveScore1(0);
    setLiveScore2(0);
    setSimDone(false);

    sounds.whistle();

    try {
      const res = await fetch(`${API_URL}/api/match/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ team1, team2 }),
      });
      const data = await res.json();
      setResult(data);

      let s1 = 0, s2 = 0;
      for (let i = 0; i < data.events.length; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const ev = data.events[i];
        if (ev.type === "goal") {
          if (ev.team === 1) { s1++; setLiveScore1(s1); }
          else { s2++; setLiveScore2(s2); }
          sounds.goal();
        }
        setVisibleEvents(prev => [...prev, ev]);
        if (eventsRef.current) eventsRef.current.scrollTop = eventsRef.current.scrollHeight;
      }

      await new Promise(r => setTimeout(r, 800));
      sounds.finalWhistle();
      setSimDone(true);
    } finally {
      setSimulating(false);
    }
  };

  const reset = () => {
    setTeam1([]); setTeam2([]);
    setResult(null); setVisibleEvents([]);
    setLiveScore1(0); setLiveScore2(0);
    setSimDone(false);
  };

  const filtered = players.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.club?.toLowerCase().includes(search.toLowerCase());
    return filterPos === "ALL" ? matchSearch : matchSearch && p.position_type === filterPos;
  });

  const isRunning = simulating;
  const bothReady = team1.length === 11 && team2.length === 11;

  return (
    <div className="page-wrapper">
      <h1 className="page-title">SIMULAR <span>PARTIDO</span></h1>
      <p className="page-subtitle">Arma dos equipos de 11 y simula el partido en vivo</p>

      {/* Marcador */}
      {(result || simulating) && (
        <ScoreBoard
          score1={liveScore1} score2={liveScore2}
          teamName1={teamName1} teamName2={teamName2}
          winner={simDone ? result?.winner : 0}
          running={isRunning}
        />
      )}

      {/* Eventos */}
      {visibleEvents.length > 0 && (
        <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontFamily: "Orbitron", color: isRunning ? "var(--red)" : "var(--green)", fontSize: "0.72rem", letterSpacing: "2px", marginBottom: "0.8rem" }}>
            {isRunning ? "🔴 EN VIVO" : "📋 RESUMEN"}
          </div>
          <div ref={eventsRef} style={{ maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {visibleEvents.map((ev, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "0.8rem",
                padding: "0.55rem 0.8rem", borderRadius: 8,
                background: ev.type === "goal" ? "rgba(0,255,135,0.06)" : "rgba(255,200,0,0.04)",
                border: `1px solid ${ev.type === "goal" ? "rgba(0,255,135,0.15)" : "rgba(255,200,0,0.1)"}`,
                animation: "fadeInUp 0.3s ease",
              }}>
                <span style={{ fontFamily: "Orbitron", fontSize: "0.68rem", color: "var(--text-muted)", minWidth: 32 }}>{ev.minute}&apos;</span>
                <span style={{ fontSize: "1rem" }}>{ev.type === "goal" ? "⚽" : "��"}</span>
                <span style={{ flex: 1, fontSize: "0.88rem", fontWeight: 600 }}>{ev.player}</span>
                <span style={{ fontSize: "0.72rem", fontFamily: "Orbitron", color: ev.team === 1 ? `rgb(${TEAM_COLORS[1]})` : `rgb(${TEAM_COLORS[2]})` }}>
                  {ev.team === 1 ? teamName1 : teamName2}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats finales */}
      {simDone && result && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
          {[1, 2].map(n => {
            const stats = result.stats[`team${n}`];
            const color = TEAM_COLORS[n];
            const name = n === 1 ? teamName1 : teamName2;
            const isWinner = result.winner === n;
            return (
              <div key={n} className="glass-card" style={{ borderColor: isWinner ? "var(--green)" : undefined, textAlign: "center" }}>
                <div style={{ fontFamily: "Orbitron", color: `rgb(${color})`, fontSize: "0.75rem", letterSpacing: "2px", marginBottom: "0.8rem" }}>{name}</div>
                <div style={{ display: "flex", justifyContent: "center", gap: "2rem" }}>
                  <div>
                    <div style={{ fontFamily: "Orbitron", fontSize: "1.4rem", color: "var(--green)", fontWeight: 700 }}>{stats.avg}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>OVERALL</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "Orbitron", fontSize: "1.4rem", color: "var(--text)", fontWeight: 700 }}>{stats.possession}%</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>POSESIÓN</div>
                  </div>
                </div>
                {isWinner && <div style={{ color: "var(--green)", fontFamily: "Orbitron", fontSize: "0.6rem", letterSpacing: "3px", marginTop: "0.6rem" }}>🏆 GANADOR</div>}
                {result.winner === 0 && n === 1 && <div style={{ color: "var(--text-muted)", fontFamily: "Orbitron", fontSize: "0.6rem", letterSpacing: "3px", marginTop: "0.6rem" }}>EMPATE</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* Paneles de equipos + botones */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {[1, 2].map(n => {
          const team = n === 1 ? team1 : team2;
          const setTeam = n === 1 ? setTeam1 : setTeam2;
          const name = n === 1 ? teamName1 : teamName2;
          const setName = n === 1 ? setTeamName1 : setTeamName2;
          const color = TEAM_COLORS[n];
          return (
            <div key={n}>
              <input
                className="form-control"
                style={{ marginBottom: "0.8rem", borderColor: `rgba(${color},0.3)` }}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={`Nombre equipo ${n}`}
              />
              <TeamPanel
                team={team}
                name={name}
                color={color}
                onRemove={p => setTeam(team.filter(t => t.id !== p.id))}
              />
            </div>
          );
        })}
      </div>

      {/* Botones accion */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <button
          className="btn-primary-custom"
          style={{ width: "auto", padding: "0.85rem 2.5rem" }}
          onClick={simulate}
          disabled={!bothReady || simulating}
        >
          {simulating ? "⏳ SIMULANDO..." : !bothReady ? `Faltan jugadores (${11 - team1.length} · ${11 - team2.length})` : "🏟 SIMULAR PARTIDO"}
        </button>
        {(team1.length > 0 || team2.length > 0) && (
          <button className="btn-secondary-custom" onClick={reset}>Reiniciar</button>
        )}
      </div>

      {/* Selector equipo activo */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.5rem" }}>
        <div style={{ fontFamily: "Orbitron", color: "var(--text-muted)", fontSize: "0.72rem", letterSpacing: "2px", marginBottom: "1rem" }}>
          SELECCIONAR JUGADORES
        </div>

        <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.2rem", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Agregar a:</span>
          {[1, 2].map(n => {
            const c = TEAM_COLORS[n];
            const nm = n === 1 ? teamName1 : teamName2;
            const team = n === 1 ? team1 : team2;
            return (
              <button key={n} onClick={() => setActiveTeam(n)} style={{
                padding: "0.45rem 1.2rem", borderRadius: 8,
                border: `2px solid rgba(${c},${activeTeam === n ? "0.8" : "0.25"})`,
                background: activeTeam === n ? `rgba(${c},0.15)` : "transparent",
                color: `rgb(${c})`, fontWeight: 700, cursor: "pointer",
                fontFamily: "Rajdhani", fontSize: "0.9rem", transition: "all 0.2s",
              }}>
                {nm} ({team.length}/11)
              </button>
            );
          })}
        </div>

        {/* Filtros */}
        <div style={{ display: "flex", gap: "0.8rem", marginBottom: "1.2rem", flexWrap: "wrap", alignItems: "center" }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 300 }}>
            <span className="search-icon">🔍</span>
            <input className="form-control" placeholder="Buscar jugador o club..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {["ALL", "GK", "DEF", "MID", "FWD"].map(pos => (
            <button key={pos} className={`filter-pill ${filterPos === pos ? "active" : ""}`} onClick={() => setFilterPos(pos)}>
              {pos === "ALL" ? "Todos" : pos}
            </button>
          ))}
        </div>

        {/* Grid de tarjetas */}
        <div className="players-grid">
          {filtered.map(p => {
            const status = getStatus(p);
            const isBlocked = (activeTeam === 1 && status === "team2") || (activeTeam === 2 && status === "team1");
            return (
              <SelectableCard
                key={p.id}
                player={p}
                status={isBlocked ? "blocked" : status}
                onAdd={handleAdd}
                activeTeam={activeTeam}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
