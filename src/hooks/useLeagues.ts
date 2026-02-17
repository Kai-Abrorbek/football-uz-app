import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import { ENDPOINTS } from "../constants/api";
import { League } from "../types";

export const useFeaturedLeagues = () => {
  return useQuery<League[]>({
    queryKey: ["leagues", "featured"],
    queryFn: () => api.get(ENDPOINTS.featuredLeagues),
    staleTime: 1000 * 60 * 60, // 1시간
  });
};

export const useAllLeagues = () => {
  return useQuery<League[]>({
    queryKey: ["leagues"],
    queryFn: () => api.get(ENDPOINTS.leagues),
    staleTime: 1000 * 60 * 60,
  });
};
