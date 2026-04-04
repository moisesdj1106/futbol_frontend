import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../hooks/useFavorites";
import API_URL from "../config";

function formatDate(utcDate) {
  return new Date(utcDate).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
}
function formatTime(utcDate) {
  return new Date(utcDate).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_LABEL = {
  SCHEDULED: { label: "Programado", color: "var(--text-muted)" },
  IN_PLAY:   { label: "EN VIVO",    color: "var(--red)" },
  PAUSED:    { label: "Descanso",   color: "#ffd700" },
  FINISHED:  { label: "Finalizado", color: "var(--text-muted)" },
  POSTPONED: { label: "Aplazado",   color: "var(--text-muted)" },
};

// ── Tarjeta de partido en la lista ──
function MatchCard({ match, onSelect, selected }) {
  const isLive = match.status === "IN_PLAY" || match.status === "PAUSED";
  const status = STATUS_LABEL[match.status] || { label: match.status, color: "var(--text-muted)" };
  const home = match.score?.fullTime?.home ?? match.score?.halfTime?.home;
  const away = match.score?.fullTime?.away ?? match.score?.halfTime?.away;

  return (
    <div onClick={() => onSelect(match)} style={{
      background: selected ? "rgba(0,255,135,0.06)" : "rgba(255,255,255,0.02)",
      border: `1px solid ${selected ? "var(--green)" : isLive ? "rgba(255,77,109,0.3)" : "rgba(255,255,255,0.07)"}`,
      borderRadius: 14, padding: "1rem 1.2rem",
      cursor: "pointer", transition: "all 0.2s", position: "relative", overflow: "hidden",
    }}>
      {isLive && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--red), transparent)" }} />}
      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.6rem", display: "flex", justifyContent: "space-between" }}>
        <span>{match.competition?.name}</span>
        <span style={{ color: status.color, fontFamily: "Orbitron", fontSize: "0.65rem", fontWeight: 700 }}>
          {isLive && "● "}{isLive && match.minute ? `${match.minute}' ` : ""}{status.label}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "0.8rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {match.homeTeam?.crest && <img src={match.homeTeam.crest} alt="" style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }} />}
          <span style={{ fontWeight: 700, fontSize: "0.88rem" }}>{match.homeTeam?.shortName || match.homeTeam?.name}</span>
        </div>
        <div style={{ textAlign: "center", minWidth: 70 }}>
          {match.status === "SCHEDULED" ? (
            <div style={{ fontFamily: "Orbitron", fontSize: "0.85rem", color: "var(--text-muted)" }}>{formatTime(match.utcDate)}</div>
          ) : (
            <div style={{ fontFamily: "Orbitron", fontWeight: 900, fontSize: "1.4rem", color: isLive ? "var(--green)" : "var(--text)" }}>
              {home ?? "—"}<span style={{ color: "var(--text-muted)", margin: "0 0.2rem" }}>:</span>{away ?? "—"}
            </div>
          )}
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{formatDate(match.utcDate)}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", justifyContent: "flex-end" }}>
          <span style={{ fontWeight: 700, fontSize: "0.88rem", textAlign: "right" }}>{match.awayTeam?.shortName || match.awayTeam?.name}</span>
          {match.awayTeam?.crest && <img src={match.awayTeam.crest} alt="" style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }} />}
        </div>
      </div>
      <div style={{ textAlign: "center", marginTop: "0.5rem", fontSize: "0.7rem", color: "var(--text-muted)" }}>
        {selected ? "▲ Ver menos" : "▼ Ver detalle"}
      </div>
    </div>
  );
}

// ── Modal expandido del partido ──
function MatchModal({ match, onClose }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("events");
  const [error, setError] = useState(false);
  const intervalRef = useRef(null);
  const isLive = match.status === "IN_PLAY" || match.status === "PAUSED";

  const load = () => {
    fetch(`${API_URL}/api/teams/match/${match.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setData(d); setError(false); })
      .catch(() => setError(true));
  };

  useEffect(() => {
    load();
    if (isLive) intervalRef.current = setInterval(load, 30000);
    return () => clearInterval(intervalRef.current);
  }, [match.id]);

  // Cerrar con Escape
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const home = data?.score?.fullTime?.home ?? data?.score?.halfTime?.home ?? match.score?.fullTime?.home ?? "—";
  const away = data?.score?.fullTime?.away ?? data?.score?.halfTime?.away ?? match.score?.fullTime?.away ?? "—";
  const goals = data?.goals || [];
  const bookings = data?.bookings || [];
  const subs = data?.substitutions || [];
  const homeLineup = data?.lineups?.find(l => l.team?.id === match.homeTeam?.id);
  const awayLineup = data?.lineups?.find(l => l.team?.id === match.awayTeam?.id);

  const allEvents = [
    ...goals.map(e => ({ ...e, _type: "goal" })),
    ...bookings.map(e => ({ ...e, _type: "card" })),
    ...subs.map(e => ({ ...e, _type: "sub" })),
  ].sort((a, b) => (a.minute || 0) - (b.minute || 0));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "var(--dark3)", border: "1px solid var(--border)",
        borderRadius: 20, width: "100%", maxWidth: 700,
        maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 40px 100px rgba(0,0,0,0.7)",
        animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        {/* Header marcador */}
        <div style={{
          background: "linear-gradient(135deg, var(--dark4), var(--dark2))",
          padding: "1.5rem", position: "relative",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          {isLive && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, var(--red), transparent)" }} />}

          <button onClick={onClose} style={{
            position: "absolute", top: 12, right: 12,
            background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)",
            color: "var(--text-muted)", width: 32, height: 32, borderRadius: "50%",
            cursor: "pointer", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>

          {/* Liga y estado */}
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>{match.competition?.name}</div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              color: isLive ? "var(--red)" : STATUS_LABEL[match.status]?.color || "var(--text-muted)",
              fontFamily: "Orbitron", fontSize: "0.68rem", letterSpacing: "2px",
            }}>
              {isLive && <span style={{ animation: "pulse 1s infinite" }}>●</span>}
              {isLive && data?.minute ? `${data.minute}'` : ""} {STATUS_LABEL[match.status]?.label || match.status}
            </div>
          </div>

          {/* Equipos y marcador */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "1rem" }}>
            <div style={{ textAlign: "center" }}>
              {match.homeTeam?.crest && <img src={match.homeTeam.crest} alt="" style={{ width: 56, height: 56, objectFit: "contain", marginBottom: "0.5rem" }} />}
              <div style={{ fontFamily: "Orbitron", fontSize: "0.85rem", fontWeight: 700 }}>{match.homeTeam?.name}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: "Orbitron", fontWeight: 900, fontSize: "3.5rem", lineHeight: 1,
                color: isLive ? "var(--green)" : "var(--text)",
                textShadow: isLive ? "0 0 30px rgba(0,255,135,0.4)" : "none",
              }}>
                {home}<span style={{ color: "var(--text-muted)", margin: "0 0.5rem", fontSize: "2rem" }}>:</span>{away}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginTop: "0.4rem" }}>{formatDate(match.utcDate)}</div>
              {isLive && <div style={{ color: "var(--text-muted)", fontSize: "0.65rem", marginTop: "0.2rem" }}>Actualiza cada 30s</div>}
            </div>
            <div style={{ textAlign: "center" }}>
              {match.awayTeam?.crest && <img src={match.awayTeam.crest} alt="" style={{ width: 56, height: 56, objectFit: "contain", marginBottom: "0.5rem" }} />}
              <div style={{ fontFamily: "Orbitron", fontSize: "0.85rem", fontWeight: 700 }}>{match.awayTeam?.name}</div>
            </div>
          </div>

          {/* Árbitro y estadio si están disponibles */}
          {(data?.referees?.length > 0 || data?.venue) && (
            <div style={{ textAlign: "center", marginTop: "0.8rem", color: "var(--text-muted)", fontSize: "0.72rem", display: "flex", justifyContent: "center", gap: "1.5rem" }}>
              {data?.venue && <span>🏟 {data.venue}</span>}
              {data?.referees?.[0] && <span>👨‍⚖️ {data.referees[0].name}</span>}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.3rem", padding: "0.8rem 1.2rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          {[
            { key: "events", label: "📋 Eventos" },
            { key: "lineups", label: "👥 Alineaciones" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "0.45rem 1.1rem", borderRadius: "8px 8px 0 0", cursor: "pointer",
              border: `1px solid ${tab === t.key ? "var(--border)" : "transparent"}`,
              borderBottom: tab === t.key ? "1px solid var(--dark3)" : "1px solid transparent",
              background: tab === t.key ? "var(--dark3)" : "transparent",
              color: tab === t.key ? "var(--green)" : "var(--text-muted)",
              fontFamily: "Rajdhani", fontWeight: 700, fontSize: "0.88rem",
              marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.2rem" }}>
          {error && (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔒</div>
              <div style={{ fontFamily: "Orbitron", fontSize: "0.8rem", marginBottom: "0.4rem" }}>Detalle no disponible</div>
              <div style={{ fontSize: "0.78rem" }}>Este partido no tiene información detallada en el plan actual</div>
            </div>
          )}

          {!error && tab === "events" && (
            <div>
              {!data && <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>⏳ Cargando...</div>}
              {data && allEvents.length === 0 && (
                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem", fontSize: "0.88rem" }}>
                  <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>{isLive ? "⏳" : "📋"}</div>
                  {isLive ? "Sin eventos aún" : data.status === "SCHEDULED" ? "El partido no ha comenzado" : "Sin eventos disponibles"}
                </div>
              )}
              {allEvents.map((ev, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "0.8rem",
                  padding: "0.55rem 0.8rem", borderRadius: 8, marginBottom: "0.35rem",
                  background: ev._type === "goal" ? "rgba(0,255,135,0.05)" : ev._type === "card" ? "rgba(255,200,0,0.04)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${ev._type === "goal" ? "rgba(0,255,135,0.12)" : ev._type === "card" ? "rgba(255,200,0,0.1)" : "rgba(255,255,255,0.04)"}`,
                  animation: "fadeInUp 0.2s ease",
                }}>
                  <span style={{ fontFamily: "Orbitron", fontSize: "0.65rem", color: "var(--text-muted)", minWidth: 30 }}>{ev.minute}&apos;</span>
                  <span style={{ fontSize: "1.1rem" }}>
                    {ev._type === "goal" ? "⚽" : ev._type === "sub" ? "🔄" : ev.card === "RED" ? "🟥" : "🟨"}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.88rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {ev.scorer?.name || ev.player?.name || ev.playerOut?.name || "—"}
                    </div>
                    {ev._type === "sub" && ev.playerIn?.name && (
                      <div style={{ fontSize: "0.72rem", color: "var(--green)" }}>↑ {ev.playerIn.name}</div>
                    )}
                    {ev._type === "goal" && ev.assist?.name && (
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Asistencia: {ev.assist.name}</div>
                    )}
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", flexShrink: 0 }}>{ev.team?.shortName || ev.team?.name}</span>
                </div>
              ))}
            </div>
          )}

          {!error && tab === "lineups" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {[
                { lineup: homeLineup, team: match.homeTeam },
                { lineup: awayLineup, team: match.awayTeam },
              ].map(({ lineup, team }) => (
                <div key={team?.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.8rem" }}>
                    {team?.crest && <img src={team.crest} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />}
                    <div>
                      <div style={{ fontFamily: "Orbitron", fontSize: "0.75rem" }}>{team?.shortName || team?.name}</div>
                      {lineup?.formation && <div style={{ color: "var(--green)", fontSize: "0.65rem", fontFamily: "Orbitron" }}>{lineup.formation}</div>}
                    </div>
                  </div>
                  {!lineup || !lineup.startXI?.length ? (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", padding: "0.8rem", background: "rgba(255,255,255,0.02)", borderRadius: 8, textAlign: "center" }}>
                      No disponible aún
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontFamily: "Orbitron", letterSpacing: "1px", marginBottom: "0.3rem" }}>TITULARES</div>
                      {lineup.startXI.map((p, i) => (
                        <div key={i} style={{ display: "flex", gap: "0.5rem", padding: "0.3rem 0.5rem", borderRadius: 6, marginBottom: "0.2rem", background: "rgba(0,255,135,0.03)" }}>
                          <span style={{ fontFamily: "Orbitron", fontSize: "0.62rem", color: "var(--green)", minWidth: 18 }}>{p.player?.shirtNumber}</span>
                          <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{p.player?.name}</span>
                          <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: "var(--text-muted)" }}>{p.player?.position}</span>
                        </div>
                      ))}
                      {lineup.bench?.length > 0 && (
                        <>
                          <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontFamily: "Orbitron", letterSpacing: "1px", margin: "0.6rem 0 0.3rem" }}>SUPLENTES</div>
                          {lineup.bench.map((p, i) => (
                            <div key={i} style={{ display: "flex", gap: "0.5rem", padding: "0.25rem 0.5rem", borderRadius: 6, marginBottom: "0.15rem" }}>
                              <span style={{ fontFamily: "Orbitron", fontSize: "0.6rem", color: "var(--text-muted)", minWidth: 18 }}>{p.player?.shirtNumber}</span>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.player?.name}</span>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──
export default function LiveMatches() {
  const { token } = useAuth();
  const { favorites } = useFavorites();
  const [tab, setTab] = useState("favorites");
  const [matches, setMatches] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab !== "favorites") return;
    setLoading(true);
    fetch(`${API_URL}/api/teams/favorites/matches`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setMatches(Array.isArray(data) ? data : []))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, [tab, favorites.length, token]);

  useEffect(() => {
    if (tab !== "live") return;
    setLoading(true);
    fetch(`${API_URL}/api/teams/live`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setLiveMatches(Array.isArray(data) ? data : []))
      .catch(() => setLiveMatches([]))
      .finally(() => setLoading(false));
  }, [tab, token]);

  const displayMatches = tab === "live" ? liveMatches : matches;

  const handleSelect = (match) => {
    setSelectedMatch(prev => prev?.id === match.id ? null : match);
  };

  return (
    <div className="page-wrapper">
      <h1 className="page-title">PARTIDOS <span>EN VIVO</span></h1>
      <p className="page-subtitle">Sigue los partidos de tus equipos favoritos en tiempo real</p>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {[
          { key: "favorites", label: "⭐ Mis Equipos" },
          { key: "live", label: "🔴 En Vivo Ahora" },
        ].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSelectedMatch(null); }} style={{
            padding: "0.6rem 1.4rem", borderRadius: 10,
            border: `1px solid ${tab === t.key ? "var(--green)" : "rgba(255,255,255,0.08)"}`,
            background: tab === t.key ? "rgba(0,255,135,0.1)" : "transparent",
            color: tab === t.key ? "var(--green)" : "var(--text-muted)",
            cursor: "pointer", fontWeight: 700, fontFamily: "Rajdhani", fontSize: "0.95rem",
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "favorites" && favorites.length === 0 && (
        <div style={{
          textAlign: "center", padding: "3rem",
          background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)",
          borderRadius: 16, color: "var(--text-muted)",
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.8rem" }}>⭐</div>
          <div style={{ fontFamily: "Orbitron", fontSize: "0.9rem", marginBottom: "0.5rem" }}>Sin equipos favoritos</div>
          <div>Ve a la sección Equipos y sigue los que te gusten</div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "3rem" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>Cargando partidos...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
          {displayMatches.length === 0 && !loading && (tab === "live" || favorites.length > 0) && (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
              {tab === "live" ? "No hay partidos en vivo ahora mismo" : "No hay partidos próximos para tus equipos"}
            </div>
          )}
          {displayMatches.map(m => (
            <MatchCard
              key={m.id}
              match={m}
              selected={selectedMatch?.id === m.id}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      {/* Modal del partido */}
      {selectedMatch && (
        <MatchModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
      )}
    </div>
  );
}
