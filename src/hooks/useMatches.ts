import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import { ENDPOINTS } from "../constants/api";
import { Match } from "../types";

// 테스트용 - 2024년 데이터로 고정
export const useMatches = (date?: string, leagueId?: number) => {
  return useQuery<Match[]>({
    queryKey: ["matches", date, leagueId],
    queryFn: async () => {
      const params: any = {};
      if (date) params.date = "2024-11-10"; // 테스트용 날짜
      if (leagueId) params.leagueId = leagueId;
      return api.get(ENDPOINTS.matches, { params });
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useLiveMatches = () => {
  return useQuery<Match[]>({
    queryKey: ["matches", "live"],
    queryFn: () => api.get(ENDPOINTS.liveMatches),
    refetchInterval: 1000 * 30, // 30초마다 자동 갱신
    staleTime: 0,
  });
};

export const useMatchDetail = (id: string) => {
  return useQuery<Match>({
    queryKey: ["match", id],
    queryFn: () => api.get(ENDPOINTS.matchDetail(id)),
    staleTime: 1000 * 60,
  });
};
