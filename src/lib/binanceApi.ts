import { Candle } from "./indicators";

const BINANCE_BASE = "https://api.binance.com/api/v3";

// Map internal asset IDs to Binance symbols
const BINANCE_SYMBOL_MAP: Record<string, string> = {
  "BTCUSD": "BTCUSDT",
  "ETHUSD": "ETHUSDT",
  "BNBUSD": "BNBUSDT",
  "SOLUSD": "SOLUSDT",
  "XRPUSD": "XRPUSDT",
  "ADAUSD": "ADAUSDT",
  "DOTUSD": "DOTUSDT",
  "DOGEUSD": "DOGEUSDT",
  "AVAXUSD": "AVAXUSDT",
  "LINKUSD": "LINKUSDT",
  "MATICUSD": "MATICUSDT",
  "LTCUSD": "LTCUSDT",
};

const INTERVAL_MAP: Record<number, string> = {
  60: "1m",
  300: "5m",
  900: "15m",
  3600: "1h",
};

export function getBinanceSymbol(assetId: string): string | null {
  return BINANCE_SYMBOL_MAP[assetId] || null;
}

export function isBinanceAsset(assetId: string): boolean {
  return !!BINANCE_SYMBOL_MAP[assetId];
}

export async function fetchBinanceCandles(
  assetId: string,
  intervalSeconds: number,
  limit = 250
): Promise<Candle[]> {
  const symbol = BINANCE_SYMBOL_MAP[assetId];
  if (!symbol) throw new Error(`No Binance mapping for ${assetId}`);

  const interval = INTERVAL_MAP[intervalSeconds] || "1m";

  const url = `${BINANCE_BASE}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }

  const data: any[][] = await response.json();

  return data.map((k) => ({
    time: Math.floor(k[0] / 1000), // convert ms to seconds
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: Math.round(parseFloat(k[5])),
  }));
}

// Fetch current price via ticker
export async function fetchBinancePrice(assetId: string): Promise<number | null> {
  const symbol = BINANCE_SYMBOL_MAP[assetId];
  if (!symbol) return null;

  try {
    const res = await fetch(`${BINANCE_BASE}/ticker/price?symbol=${symbol}`);
    if (!res.ok) return null;
    const data = await res.json();
    return parseFloat(data.price);
  } catch {
    return null;
  }
}
