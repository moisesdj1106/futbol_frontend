import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../hooks/useFavorites";
import { useMatchNotifier, requestNotificationPermission } from "../hooks/useMatchNotifier";
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

function MatchCard({ match, onSelect, notified, onToggleNotify }) {
  const isLive = match.status === "IN_PLAY" || match.status === "PAUSED";
  const isDone = match.status === "FINISHED";
  const status = STATUS_LABEL[match.status] || { label: match.status, color: "var(--text-muted)" };
  const home = match.score?.fullTime?.home ?? match.score?.halfTime?.home;
  const away = match.score?.fullTime?.away ?? match.score?.halfTime?.away;

  const handleNotify = async (e) => {
    e.stopPropagation();
    const perm = await requestNotificationPermission();
    if (perm === 'denied') {
      alert('Las notificaciones están bloqueadas en tu navegador. Actívalas en la configuración del sitio.');
      return;
    }
    if (perm === 'unsupported') {
      alert('Tu navegador no soporta notificaciones.');
      return;
    }
    onToggleNotify(match.id);
  };

  return (
    <div onClick={() => onSelect(match)} style={{
      background: "rgba(255,255,255,0.02)",
      border: `1px solid ${isLive ? "rgba(255,77,109,0.3)" : "rgba(255,255,255,0.07)"}`,
      borderRadius: 14, padding: "1rem 1.2rem",
      cursor: "pointer", transition: "all 0.2s", position: "relative", overflow: "hidden",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = isLive ? "rgba(255,77,109,0.3)" : "rgba(255,255,255,0.07)"}
    >
      {isLive && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--red), transparent)" }} />}

      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.6rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{match.competition?.name}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {/* Botón notificación solo en partidos en vivo */}
          {isLive && (
            <button
              onClick={handleNotify}
              title={notified ? "Desactivar notificaciones" : "Notificarme cambios de marcador"}
              style={{
                background: notified ? "rgba(0,255,135,0.15)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${notified ? "var(--green)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 6, padding: "0.15rem 0.5rem",
                cursor: "pointer", fontSize: "0.75rem",
                color: notified ? "var(--green)" : "var(--text-muted)",
                transition: "all 0.2s", display: "flex", alignItems: "center", gap: "0.3rem",
              }}
            >
              {notified ? "🔔" : "🔕"} {notified ? "ON" : "OFF"}
            </button>
          )}
          <span style={{ color: status.color, fontFamily: "Orbitron", fontSize: "0.62rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem" }}>
            {isLive && <span style={{ animation: "pulse 1.5s infinite" }}>●</span>}
            {status.label}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "0.8rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {match.homeTeam?.crest && <img src={match.homeTeam.crest} alt="" style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }} />}
          <span style={{ fontWeight: isDone && home > away ? 800 : 600, fontSize: "0.88rem" }}>{match.homeTeam?.shortName || match.homeTeam?.name}</span>
        </div>

        <div style={{ textAlign: "center", minWidth: 80 }}>
          {match.status === "SCHEDULED" ? (
            <div style={{ fontFamily: "Orbitron", fontSize: "0.9rem", color: "var(--text-muted)" }}>{formatTime(match.utcDate)}</div>
          ) : (
            <div style={{ fontFamily: "Orbitron", fontWeight: 900, fontSize: "1.5rem", color: isLive ? "var(--green)" : "var(--text)", lineHeight: 1 }}>
              {home ?? "—"}<span style={{ color: "var(--text-muted)", margin: "0 0.25rem", fontSize: "1rem" }}>:</span>{away ?? "—"}
            </div>
          )}
          <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>{formatDate(match.utcDate)}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", justifyContent: "flex-end" }}>
          <span style={{ fontWeight: isDone && away > home ? 800 : 600, fontSize: "0.88rem", textAlign: "right" }}>{match.awayTeam?.shortName || match.awayTeam?.name}</span>
          {match.awayTeam?.crest && <img src={match.awayTeam.crest} alt="" style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }} />}
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "0.5rem", fontSize: "0.68rem", color: "var(--green)", opacity: 0.7 }}>
        Toca para ver detalle →
      </div>
    </div>
  );
}

// Componente invisible que monitorea partidos activos y notifica cambios
function MatchMonitor({ matchId, homeTeam, awayTeam, token }) {
  useMatchNotifier(matchId, homeTeam, awayTeam, true, token);
  return null;
}

function MatchModal({ match, onClose }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("info");
  const intervalRef = useRef(null);
  const isLive = match.status === "IN_PLAY" || match.status === "PAUSED";
  const isDone = match.status === "FINISHED";

  useEffect(() => {
    fetch(`${API_URL}/api/teams/match/${match.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setData).catch(() => {});
    if (isLive) intervalRef.current = setInterval(() => {
      fetch(`${API_URL}/api/teams/match/${match.id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(setData).catch(() => {});
    }, 30000);
    return () => clearInterval(intervalRef.current);
  }, [match.id]);

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const d = data || match;
  const home = d.score?.fullTime?.home ?? d.score?.halfTime?.home ?? "—";
  const away = d.score?.fullTime?.away ?? d.score?.halfTime?.away ?? "—";
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

  const hasEvents = allEvents.length > 0;
  const hasLineups = homeLineup?.startXI?.length > 0 || awayLineup?.startXI?.length > 0;

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.8)",
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: "1rem",
    }}>
      <div style={{
        background: "var(--dark3)", border: "1px solid var(--border)",
        borderRadius: 24, width: "100%", maxWidth: 720,
        maxHeight: "88vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "0 50px 120px rgba(0,0,0,0.8), 0 0 60px rgba(0,255,135,0.05)",
        animation: "modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        position: "relative",
      }}>
        {/* Barra superior de color */}
        {isLive && <div style={{ height: 3, background: "linear-gradient(90deg, var(--red), rgba(255,77,109,0.3), transparent)", flexShrink: 0 }} />}

        {/* Botón cerrar */}
        <button onClick={onClose} style={{
          position: "absolute", top: 14, right: 14, zIndex: 10,
          background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.12)",
          color: "var(--text-muted)", width: 34, height: 34, borderRadius: "50%",
          cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,77,109,0.3)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.5)"; e.currentTarget.style.color = "var(--text-muted)"; }}
        >✕</button>

        {/* HEADER */}
        <div style={{
          background: "linear-gradient(160deg, var(--dark4) 0%, var(--dark2) 100%)",
          padding: "1.8rem 1.5rem 1.5rem",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}>
          {/* Liga + estado */}
          <div style={{ textAlign: "center", marginBottom: "1.2rem" }}>
            <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginBottom: "0.4rem" }}>
              {match.competition?.name}
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              background: isLive ? "rgba(255,77,109,0.1)" : isDone ? "rgba(255,255,255,0.04)" : "rgba(0,255,135,0.06)",
              border: `1px solid ${isLive ? "rgba(255,77,109,0.3)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 20, padding: "0.3rem 0.9rem",
              color: isLive ? "var(--red)" : "var(--text-muted)",
              fontFamily: "Orbitron", fontSize: "0.65rem", letterSpacing: "2px",
            }}>
              {isLive && <span style={{ animation: "pulse 1.5s infinite" }}>●</span>}
              {STATUS_LABEL[match.status]?.label || match.status}
              {isLive && " · Actualiza cada 30s"}
            </div>
          </div>

          {/* Equipos + marcador */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "1.5rem" }}>
            <div style={{ textAlign: "center" }}>
              {match.homeTeam?.crest && (
                <img src={match.homeTeam.crest} alt="" style={{ width: 64, height: 64, objectFit: "contain", marginBottom: "0.6rem", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))" }} />
              )}
              <div style={{ fontFamily: "Orbitron", fontSize: "0.82rem", fontWeight: 700, lineHeight: 1.3 }}>{match.homeTeam?.name}</div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: "Orbitron", fontWeight: 900,
                fontSize: "4rem", lineHeight: 1,
                color: isLive ? "var(--green)" : "var(--text)",
                textShadow: isLive ? "0 0 40px rgba(0,255,135,0.4)" : "none",
                letterSpacing: "-2px",
              }}>
                {home}<span style={{ color: "var(--text-muted)", margin: "0 0.4rem", fontSize: "2.5rem" }}>:</span>{away}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginTop: "0.5rem" }}>
                {formatDate(match.utcDate)} · {formatTime(match.utcDate)}
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              {match.awayTeam?.crest && (
                <img src={match.awayTeam.crest} alt="" style={{ width: 64, height: 64, objectFit: "contain", marginBottom: "0.6rem", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))" }} />
              )}
              <div style={{ fontFamily: "Orbitron", fontSize: "0.82rem", fontWeight: 700, lineHeight: 1.3 }}>{match.awayTeam?.name}</div>
            </div>
          </div>

          {/* Árbitro / estadio */}
          {(data?.referees?.length > 0 || data?.venue) && (
            <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
              {data?.venue && <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>🏟 {data.venue}</span>}
              {data?.referees?.[0] && <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>👨‍⚖️ {data.referees[0].name}</span>}
            </div>
          )}
        </div>

        {/* TABS */}
        <div style={{ display: "flex", padding: "0 1.2rem", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
          {[
            { key: "info", label: "ℹ Info" },
            { key: "events", label: `📋 Eventos${hasEvents ? ` (${allEvents.length})` : ""}` },
            { key: "lineups", label: "👥 Alineaciones" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "0.7rem 1rem", cursor: "pointer",
              border: "none", borderBottom: `2px solid ${tab === t.key ? "var(--green)" : "transparent"}`,
              background: "transparent",
              color: tab === t.key ? "var(--green)" : "var(--text-muted)",
              fontFamily: "Rajdhani", fontWeight: 700, fontSize: "0.85rem",
              transition: "all 0.15s", whiteSpace: "nowrap",
            }}>{t.label}</button>
          ))}
        </div>

        {/* CONTENIDO */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.2rem" }}>

          {/* Tab Info */}
          {tab === "info" && (
            <div>
              {/* Aviso plan gratuito */}
              <div style={{
                background: "rgba(255,200,0,0.05)", border: "1px solid rgba(255,200,0,0.15)",
                borderRadius: 10, padding: "0.8rem 1rem", marginBottom: "1.2rem",
                display: "flex", gap: "0.7rem", alignItems: "flex-start",
              }}>
                <span style={{ fontSize: "1rem", flexShrink: 0 }}>ℹ️</span>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                  <strong style={{ color: "#ffd700" }}>Plan gratuito:</strong> El minuto exacto, goles detallados y alineaciones están disponibles solo en el plan de pago de la API. Se muestra el marcador oficial actualizado.
                </div>
              </div>

              {/* Info del partido */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                {[
                  { label: "Competición", value: match.competition?.name },
                  { label: "Fecha", value: `${formatDate(match.utcDate)} ${formatTime(match.utcDate)}` },
                  { label: "Estado", value: STATUS_LABEL[match.status]?.label || match.status },
                  { label: "Jornada", value: match.matchday ? `Jornada ${match.matchday}` : "—" },
                  { label: "Local", value: match.homeTeam?.name },
                  { label: "Visitante", value: match.awayTeam?.name },
                ].map(item => (
                  <div key={item.label} style={{
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 10, padding: "0.8rem",
                  }}>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.65rem", fontFamily: "Orbitron", letterSpacing: "1px", marginBottom: "0.3rem" }}>{item.label}</div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 600 }}>{item.value || "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Eventos */}
          {tab === "events" && (
            <div>
              {!data && <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>⏳ Cargando...</div>}
              {data && !hasEvents && (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.8rem" }}>📋</div>
                  <div style={{ fontFamily: "Orbitron", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                    Sin eventos disponibles
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", maxWidth: 300, margin: "0 auto", lineHeight: 1.5 }}>
                    Los eventos detallados (goles, tarjetas, cambios) requieren el plan de pago de la API
                  </div>
                </div>
              )}
              {allEvents.map((ev, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "0.8rem",
                  padding: "0.6rem 0.9rem", borderRadius: 10, marginBottom: "0.4rem",
                  background: ev._type === "goal" ? "rgba(0,255,135,0.05)" : ev._type === "card" ? "rgba(255,200,0,0.04)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${ev._type === "goal" ? "rgba(0,255,135,0.12)" : ev._type === "card" ? "rgba(255,200,0,0.1)" : "rgba(255,255,255,0.04)"}`,
                  animation: "fadeInUp 0.2s ease",
                }}>
                  <span style={{ fontFamily: "Orbitron", fontSize: "0.65rem", color: "var(--text-muted)", minWidth: 32, textAlign: "center" }}>{ev.minute}&apos;</span>
                  <span style={{ fontSize: "1.2rem" }}>
                    {ev._type === "goal" ? "⚽" : ev._type === "sub" ? "🔄" : ev.card === "RED" ? "🟥" : "🟨"}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>{ev.scorer?.name || ev.player?.name || ev.playerOut?.name || "—"}</div>
                    {ev._type === "goal" && ev.assist?.name && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Asistencia: {ev.assist.name}</div>}
                    {ev._type === "sub" && ev.playerIn?.name && <div style={{ fontSize: "0.72rem", color: "var(--green)" }}>↑ {ev.playerIn.name}</div>}
                  </div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", flexShrink: 0 }}>{ev.team?.shortName || ev.team?.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tab Alineaciones */}
          {tab === "lineups" && (
            <div>
              {!hasLineups && (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.8rem" }}>👥</div>
                  <div style={{ fontFamily: "Orbitron", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                    Alineaciones no disponibles
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", maxWidth: 300, margin: "0 auto", lineHeight: 1.5 }}>
                    Las alineaciones se publican ~1h antes del partido y requieren el plan de pago de la API
                  </div>
                </div>
              )}
              {hasLineups && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  {[{ lineup: homeLineup, team: match.homeTeam }, { lineup: awayLineup, team: match.awayTeam }].map(({ lineup, team }) => (
                    <div key={team?.id}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.8rem", paddingBottom: "0.6rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        {team?.crest && <img src={team.crest} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />}
                        <div>
                          <div style={{ fontFamily: "Orbitron", fontSize: "0.72rem" }}>{team?.shortName || team?.name}</div>
                          {lineup?.formation && <div style={{ color: "var(--green)", fontSize: "0.62rem", fontFamily: "Orbitron" }}>{lineup.formation}</div>}
                        </div>
                      </div>
                      {lineup?.startXI?.map((p, i) => (
                        <div key={i} style={{ display: "flex", gap: "0.5rem", padding: "0.3rem 0.5rem", borderRadius: 6, marginBottom: "0.2rem", background: "rgba(0,255,135,0.03)" }}>
                          <span style={{ fontFamily: "Orbitron", fontSize: "0.6rem", color: "var(--green)", minWidth: 18 }}>{p.player?.shirtNumber}</span>
                          <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{p.player?.name}</span>
                          <span style={{ marginLeft: "auto", fontSize: "0.62rem", color: "var(--text-muted)" }}>{p.player?.position}</span>
                        </div>
                      ))}
                      {lineup?.bench?.length > 0 && (
                        <>
                          <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontFamily: "Orbitron", letterSpacing: "1px", margin: "0.6rem 0 0.3rem" }}>SUPLENTES</div>
                          {lineup.bench.map((p, i) => (
                            <div key={i} style={{ display: "flex", gap: "0.5rem", padding: "0.25rem 0.5rem", borderRadius: 6, marginBottom: "0.15rem" }}>
                              <span style={{ fontFamily: "Orbitron", fontSize: "0.58rem", color: "var(--text-muted)", minWidth: 18 }}>{p.player?.shirtNumber}</span>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.player?.name}</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LiveMatches() {
  const { token } = useAuth();
  const { favorites } = useFavorites();
  const [tab, setTab] = useState("favorites");
  const [matches, setMatches] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notifiedMatches, setNotifiedMatches] = useState(new Set());
  const refreshRef = useRef(null);

  const loadFavorites = () => {
    fetch(`${API_URL}/api/teams/favorites/matches`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setMatches(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  const loadLive = () => {
    fetch(`${API_URL}/api/teams/live`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setLiveMatches(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  // Carga inicial con loading
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

  // Auto-refresh cada 60s sin mostrar loading
  useEffect(() => {
    clearInterval(refreshRef.current);
    refreshRef.current = setInterval(() => {
      if (tab === "favorites") loadFavorites();
      else loadLive();
    }, 60000);
    return () => clearInterval(refreshRef.current);
  }, [tab, token]);

  const toggleNotify = async (matchId) => {
    const perm = await requestNotificationPermission();
    if (perm === 'denied') {
      alert('Notificaciones bloqueadas. Actívalas en la configuración del navegador para este sitio.');
      return;
    }
    if (perm === 'unsupported') {
      alert('Tu navegador no soporta notificaciones.');
      return;
    }
    setNotifiedMatches(prev => {
      const next = new Set(prev);
      if (next.has(matchId)) next.delete(matchId);
      else next.add(matchId);
      return next;
    });
  };

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

  // Separar por sección
  const liveNow = displayMatches.filter(m => m.status === "IN_PLAY" || m.status === "PAUSED");
  const upcoming = displayMatches.filter(m => m.status === "SCHEDULED" || m.status === "TIMED");
  const finished = displayMatches.filter(m => m.status === "FINISHED")
    .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
    .slice(0, 5);

  const Section = ({ title, items, color }) => items.length === 0 ? null : (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ fontFamily: "Orbitron", fontSize: "0.68rem", color, letterSpacing: "2px", marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {title}
        <span style={{ background: `${color}22`, border: `1px solid ${color}44`, borderRadius: 10, padding: "0.1rem 0.5rem", fontSize: "0.6rem" }}>{items.length}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {items.map(m => (
          <MatchCard
            key={m.id}
            match={m}
            onSelect={setSelectedMatch}
            notified={notifiedMatches.has(m.id)}
            onToggleNotify={toggleNotify}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <h1 className="page-title">PARTIDOS <span>EN VIVO</span></h1>
      <p className="page-subtitle">Sigue los partidos de tus equipos favoritos</p>

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
        <div style={{ textAlign: "center", padding: "3rem", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 16, color: "var(--text-muted)" }}>
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
        <>
          <Section title="🔴 EN VIVO" items={liveNow} color="var(--red)" />
          <Section title="📅 PRÓXIMOS" items={upcoming} color="var(--green)" />
          <Section title="✅ ÚLTIMOS RESULTADOS" items={finished} color="var(--text-muted)" />
          {displayMatches.length === 0 && !loading && (tab === "live" || favorites.length > 0) && (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
              {tab === "live" ? "No hay partidos en vivo ahora mismo" : "No hay partidos disponibles para tus equipos"}
            </div>
          )}
        </>
      )}

      {selectedMatch && <MatchModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />}

      {/* Monitores invisibles para partidos con notificación activa */}
      {[...notifiedMatches].map(matchId => {
        const m = [...displayMatches].find(x => x.id === matchId);
        if (!m) return null;
        return (
          <MatchMonitor
            key={matchId}
            matchId={matchId}
            homeTeam={m.homeTeam?.shortName || m.homeTeam?.name}
            awayTeam={m.awayTeam?.shortName || m.awayTeam?.name}
            token={token}
          />
        );
      })}
    </div>
  );
}
