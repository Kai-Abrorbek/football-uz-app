import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import { ENDPOINTS } from "../constants/api";
import { Match } from "../types";

// 테스트용 - 2024년 데이터로 고정
export const useMatches = (date?: string, leagueId?: number) => {
  const startUTC = new Date(`${date}T00:00:00`).toISOString();
  const endUTC = new Date(`${date}T23:59:59`).toISOString();

  return useQuery<Match[]>({
    queryKey: ["matches", date, leagueId],
    queryFn: () =>
      api.get(ENDPOINTS.matches, {
        params: { startUTC, endUTC, leagueId },
      }),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 20,
  });
};

export const useLiveMatches = () => {
  return useQuery<Match[]>({
    queryKey: ["matches", "live"],
    queryFn: () => api.get(ENDPOINTS.liveMatches),
    refetchInterval: 1000 * 20,
  });
};

export const useMatchDetail = (id: string) => {
  return useQuery<Match>({
    queryKey: ["match", id],
    queryFn: () => api.get(ENDPOINTS.matchDetail(id)),
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60,
  });
};
