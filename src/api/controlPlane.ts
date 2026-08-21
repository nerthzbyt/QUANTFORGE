// Control Plane API Client
// Base URL configurable via environment or default

const CONTROL_PLANE_URL = import.meta.env.VITE_CONTROL_PLANE_URL || "http://127.0.0.1:8787";

export interface HealthResponse {
  ok: boolean;
  plane: string;
}

export interface ConfigResponse {
  version: number;
  strategy: {
    name: string;
    model_uri: string;
    aggressiveness: number;
    min_spread_bps: number;
    max_position: number;
    order_qty: number;
    inventory_skew: number;
  };
  risk: {
    kill_switch: boolean;
    max_notional: number;
    max_order_qty: number;
    symbol_whitelist: string[];
    price_bands: {
      lower_bps: number;
      upper_bps: number;
    };
  };
  rollout: {
    created_by: string;
    approved_by: string;
    canary_pct: number;
  };
}

export interface LiquidityLevel {
  price: number;
  qty: number;
  notional: number;
}

export interface LiquidityResponse {
  venue: string;
  kind: string;
  symbol: string;
  nativeSymbol: string;
  bestBid: number;
  bestAsk: number;
  mid: number;
  spreadBps: number;
  bidDepthNotional: number;
  askDepthNotional: number;
  topBidNotional: number;
  topAskNotional: number;
  depthBandBps: number;
  levels: LiquidityLevel[];
  exchangeTimestamp: number;
  receivedAt: number;
  score: number;
  failures: number;
}

export interface TradingEvent {
  timestamp: number;
  type: string;
  symbol: string;
  config_version: number;
  side?: string;
  qty?: number;
  mid?: number;
  spread?: number;
  position?: number;
  reason?: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchJson<T>(endpoint: string): Promise<T> {
  const url = `${CONTROL_PLANE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new ApiError(res.status, `HTTP ${res.status}: ${res.statusText}`);
    }

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return res.json() as T;
    }

    // Handle JSONL or plain text
    const text = await res.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      // Return as-is for JSONL parsing
      return text as unknown as T;
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(408, "Request timeout");
    }
    throw new ApiError(0, (err as Error).message || "Network error");
  }
}

export const controlPlaneApi = {
  async health(): Promise<HealthResponse> {
    return fetchJson<HealthResponse>("/health");
  },

  async config(): Promise<ConfigResponse> {
    return fetchJson<ConfigResponse>("/config");
  },

  async liquidity(symbol: string): Promise<LiquidityResponse[]> {
    return fetchJson<LiquidityResponse[]>(`/liquidity?symbol=${encodeURIComponent(symbol)}`);
  },

  async events(): Promise<TradingEvent[]> {
    const data = await fetchJson<string | TradingEvent[]>("/events");
    if (typeof data === "string") {
      // JSONL format - parse each line
      return data
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line));
    }
    return data;
  },
};

export { CONTROL_PLANE_URL };
