import { ENDPOINTS } from "../constants/api";
import api from "../services/api";

export const toggleFollowTeam = async (
  teamId: number,
): Promise<{ following: boolean }> => {
  return api.post(ENDPOINTS.followTeam(teamId));
};

export const toggleFollowPlayer = async (
  playerId: number,
): Promise<{ following: boolean }> => {
  return api.post(ENDPOINTS.followPlayer(playerId));
};

export const toggleFollowLeague = async (
  leagueId: number,
): Promise<{ following: boolean }> => {
  return api.post(ENDPOINTS.followLeague(leagueId));
};

export const getFollowing = async (): Promise<{
  teams: number[];
  players: number[];
  leagues: number[];
}> => {
  return api.get(ENDPOINTS.following);
};
