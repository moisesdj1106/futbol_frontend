import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

export function useFavorites() {
  const { token } = useAuth();
  const [favorites, setFavorites] = useState([]);

  const load = () =>
    fetch(`${API_URL}/api/teams/favorites`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => Array.isArray(data) ? setFavorites(data) : setFavorites([]));

  useEffect(() => { if (token) load(); }, [token]);

  const isFav = (teamId) => favorites.some(f => f.team_id === teamId);

  const toggle = async (team) => {
    if (isFav(team.id)) {
      await fetch(`${API_URL}/api/teams/favorites/${team.id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
    } else {
      await fetch(`${API_URL}/api/teams/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ team_id: team.id, team_name: team.name, team_short: team.shortName, team_crest: team.crest })
      });
    }
    load();
  };

  return { favorites, isFav, toggle, reload: load };
}
