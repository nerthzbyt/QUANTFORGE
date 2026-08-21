import { useQuery } from "@tanstack/react-query";
import { controlPlaneApi, type HealthResponse, type ConfigResponse, type LiquidityResponse, type TradingEvent, type LiquidityCandidate } from "../api/controlPlane";

const QUERY_KEYS = {
  health: ["health"],
  config: ["config"],
  liquidity: (symbol: string) => ["liquidity", symbol],
  events: ["events"],
} as const;

export function useHealth(refreshInterval?: number) {
  return useQuery<HealthResponse, Error>({
    queryKey: QUERY_KEYS.health,
    queryFn: () => controlPlaneApi.health(),
    refetchInterval: refreshInterval || 3000,
    retry: 3,
    staleTime: 2000,
  });
}

export function useConfig(refreshInterval?: number) {
  return useQuery<ConfigResponse, Error>({
    queryKey: QUERY_KEYS.config,
    queryFn: () => controlPlaneApi.config(),
    refetchInterval: refreshInterval || 10000,
    retry: 2,
    staleTime: 5000,
  });
}

export function useLiquidity(symbol: string, refreshInterval?: number) {
  return useQuery<LiquidityResponse, Error>({
    queryKey: QUERY_KEYS.liquidity(symbol),
    queryFn: () => controlPlaneApi.liquidity(symbol),
    refetchInterval: refreshInterval || 2000,
    retry: 2,
    staleTime: 1500,
    enabled: !!symbol,
  });
}

export function useEvents(refreshInterval?: number) {
  return useQuery<TradingEvent[], Error>({
    queryKey: QUERY_KEYS.events,
    queryFn: () => controlPlaneApi.events(),
    refetchInterval: refreshInterval || 5000,
    retry: 1,
    staleTime: 3000,
  });
}

export { QUERY_KEYS };
