import { Candle } from "./indicators";

export type AssetCategory = "forex" | "otc-currency" | "otc-commodity" | "otc-stock" | "crypto" | "indices";

export interface Asset {
  id: string;
  name: string;
  basePrice: number;
  category: AssetCategory;
  payout?: number;
}

const FOREX: Asset[] = [
  { id: "EURUSD", name: "EUR/USD", basePrice: 1.0850, category: "forex" },
  { id: "GBPUSD", name: "GBP/USD", basePrice: 1.2650, category: "forex" },
  { id: "USDJPY", name: "USD/JPY", basePrice: 149.50, category: "forex" },
  { id: "AUDUSD", name: "AUD/USD", basePrice: 0.6520, category: "forex" },
  { id: "USDCAD", name: "USD/CAD", basePrice: 1.3580, category: "forex" },
  { id: "USDCHF", name: "USD/CHF", basePrice: 0.8820, category: "forex" },
  { id: "NZDUSD", name: "NZD/USD", basePrice: 0.6120, category: "forex" },
  { id: "EURGBP", name: "EUR/GBP", basePrice: 0.8570, category: "forex" },
  { id: "EURJPY", name: "EUR/JPY", basePrice: 162.20, category: "forex" },
  { id: "GBPJPY", name: "GBP/JPY", basePrice: 189.10, category: "forex" },
];

const OTC_CURRENCY: Asset[] = [
  { id: "EURUSD-OTC", name: "EUR/USD OTC", basePrice: 1.0850, category: "otc-currency", payout: 88 },
  { id: "GBPUSD-OTC", name: "GBP/USD OTC", basePrice: 1.2650, category: "otc-currency", payout: 38 },
  { id: "USDJPY-OTC", name: "USD/JPY OTC", basePrice: 149.50, category: "otc-currency", payout: 76 },
  { id: "AUDUSD-OTC", name: "AUD/USD OTC", basePrice: 0.6520, category: "otc-currency", payout: 92 },
  { id: "AUDCAD-OTC", name: "AUD/CAD OTC", basePrice: 0.8850, category: "otc-currency", payout: 90 },
  { id: "AUDCHF-OTC", name: "AUD/CHF OTC", basePrice: 0.5760, category: "otc-currency", payout: 92 },
  { id: "AUDJPY-OTC", name: "AUD/JPY OTC", basePrice: 97.50, category: "otc-currency", payout: 82 },
  { id: "AUDNZD-OTC", name: "AUD/NZD OTC", basePrice: 1.0650, category: "otc-currency", payout: 82 },
  { id: "CADCHF-OTC", name: "CAD/CHF OTC", basePrice: 0.6490, category: "otc-currency", payout: 77 },
  { id: "CADJPY-OTC", name: "CAD/JPY OTC", basePrice: 110.20, category: "otc-currency", payout: 65 },
  { id: "CHFJPY-OTC", name: "CHF/JPY OTC", basePrice: 169.50, category: "otc-currency", payout: 86 },
  { id: "EURCHF-OTC", name: "EUR/CHF OTC", basePrice: 0.9570, category: "otc-currency", payout: 92 },
  { id: "EURGBP-OTC", name: "EUR/GBP OTC", basePrice: 0.8570, category: "otc-currency", payout: 92 },
  { id: "EURJPY-OTC", name: "EUR/JPY OTC", basePrice: 162.20, category: "otc-currency", payout: 92 },
  { id: "EURNZD-OTC", name: "EUR/NZD OTC", basePrice: 1.7720, category: "otc-currency", payout: 92 },
  { id: "GBPAUD-OTC", name: "GBP/AUD OTC", basePrice: 1.9400, category: "otc-currency", payout: 92 },
  { id: "GBPJPY-OTC", name: "GBP/JPY OTC", basePrice: 189.10, category: "otc-currency", payout: 92 },
  { id: "NZDJPY-OTC", name: "NZD/JPY OTC", basePrice: 91.50, category: "otc-currency", payout: 49 },
  { id: "NZDUSD-OTC", name: "NZD/USD OTC", basePrice: 0.6120, category: "otc-currency", payout: 76 },
  { id: "USDCAD-OTC", name: "USD/CAD OTC", basePrice: 1.3580, category: "otc-currency", payout: 79 },
  { id: "USDCHF-OTC", name: "USD/CHF OTC", basePrice: 0.8820, category: "otc-currency", payout: 92 },
  { id: "USDRUB-OTC", name: "USD/RUB OTC", basePrice: 91.50, category: "otc-currency", payout: 92 },
  { id: "EURRUB-OTC", name: "EUR/RUB OTC", basePrice: 99.20, category: "otc-currency", payout: 71 },
  { id: "CHFNOK-OTC", name: "CHF/NOK OTC", basePrice: 11.80, category: "otc-currency", payout: 59 },
  { id: "EURHUF-OTC", name: "EUR/HUF OTC", basePrice: 395.50, category: "otc-currency", payout: 34 },
  { id: "USDCNH-OTC", name: "USD/CNH OTC", basePrice: 7.25, category: "otc-currency", payout: 92 },
  { id: "EURTRY-OTC", name: "EUR/TRY OTC", basePrice: 34.20, category: "otc-currency", payout: 92 },
  { id: "USDINR-OTC", name: "USD/INR OTC", basePrice: 83.40, category: "otc-currency", payout: 71 },
  { id: "USDSGD-OTC", name: "USD/SGD OTC", basePrice: 1.3420, category: "otc-currency", payout: 70 },
  { id: "USDMXN-OTC", name: "USD/MXN OTC", basePrice: 17.15, category: "otc-currency", payout: 68 },
  { id: "USDBRL-OTC", name: "USD/BRL OTC", basePrice: 4.97, category: "otc-currency", payout: 82 },
  { id: "USDARS-OTC", name: "USD/ARS OTC", basePrice: 875.0, category: "otc-currency", payout: 92 },
  { id: "USDIDR-OTC", name: "USD/IDR OTC", basePrice: 15680, category: "otc-currency", payout: 84 },
  { id: "USDTHB-OTC", name: "USD/THB OTC", basePrice: 35.50, category: "otc-currency", payout: 79 },
  { id: "USDPHP-OTC", name: "USD/PHP OTC", basePrice: 56.10, category: "otc-currency", payout: 92 },
  { id: "USDEGP-OTC", name: "USD/EGP OTC", basePrice: 30.90, category: "otc-currency", payout: 75 },
  { id: "NGNTOUSD-OTC", name: "NGN/USD OTC", basePrice: 0.00065, category: "otc-currency", payout: 92 },
  { id: "ZARUSD-OTC", name: "ZAR/USD OTC", basePrice: 0.053, category: "otc-currency", payout: 92 },
];

const OTC_COMMODITY: Asset[] = [
  { id: "GOLD-OTC", name: "Gold OTC", basePrice: 2050, category: "otc-commodity", payout: 80 },
  { id: "SILVER-OTC", name: "Silver OTC", basePrice: 23.50, category: "otc-commodity", payout: 80 },
  { id: "BRENT-OTC", name: "Brent Oil OTC", basePrice: 78.50, category: "otc-commodity", payout: 80 },
  { id: "WTI-OTC", name: "WTI Crude Oil OTC", basePrice: 73.20, category: "otc-commodity", payout: 80 },
  { id: "NATGAS-OTC", name: "Natural Gas OTC", basePrice: 2.35, category: "otc-commodity", payout: 45 },
  { id: "PLATINUM-OTC", name: "Platinum OTC", basePrice: 920, category: "otc-commodity", payout: 45 },
  { id: "PALLADIUM-OTC", name: "Palladium OTC", basePrice: 1050, category: "otc-commodity", payout: 45 },
];

const OTC_STOCK: Asset[] = [
  { id: "AAPL-OTC", name: "Apple OTC", basePrice: 192.50, category: "otc-stock", payout: 50 },
  { id: "MSFT-OTC", name: "Microsoft OTC", basePrice: 378.40, category: "otc-stock", payout: 72 },
  { id: "TSLA-OTC", name: "Tesla OTC", basePrice: 248.50, category: "otc-stock", payout: 71 },
  { id: "META-OTC", name: "Facebook OTC", basePrice: 355.80, category: "otc-stock", payout: 92 },
  { id: "INTC-OTC", name: "Intel OTC", basePrice: 44.20, category: "otc-stock", payout: 86 },
  { id: "MCD-OTC", name: "McDonald's OTC", basePrice: 295.30, category: "otc-stock", payout: 92 },
  { id: "BA-OTC", name: "Boeing OTC", basePrice: 218.70, category: "otc-stock", payout: 92 },
  { id: "PFE-OTC", name: "Pfizer OTC", basePrice: 28.90, category: "otc-stock", payout: 75 },
  { id: "JNJ-OTC", name: "J&J OTC", basePrice: 158.20, category: "otc-stock", payout: 49 },
  { id: "AXP-OTC", name: "Amex OTC", basePrice: 187.60, category: "otc-stock", payout: 83 },
];

const CRYPTO: Asset[] = [
  { id: "BTCUSD", name: "BTC/USD", basePrice: 43500, category: "crypto" },
  { id: "ETHUSD", name: "ETH/USD", basePrice: 2280, category: "crypto" },
  { id: "BNBUSD", name: "BNB/USD", basePrice: 620, category: "crypto" },
  { id: "SOLUSD", name: "SOL/USD", basePrice: 180, category: "crypto" },
  { id: "XRPUSD", name: "XRP/USD", basePrice: 0.62, category: "crypto" },
  { id: "ADAUSD", name: "ADA/USD", basePrice: 0.45, category: "crypto" },
  { id: "DOTUSD", name: "DOT/USD", basePrice: 7.50, category: "crypto" },
  { id: "DOGEUSD", name: "DOGE/USD", basePrice: 0.08, category: "crypto" },
  { id: "AVAXUSD", name: "AVAX/USD", basePrice: 35, category: "crypto" },
  { id: "LINKUSD", name: "LINK/USD", basePrice: 14, category: "crypto" },
  { id: "LTCUSD", name: "LTC/USD", basePrice: 72, category: "crypto" },
];

const INDICES: Asset[] = [
  { id: "V10", name: "Volatility 10 Index", basePrice: 9450, category: "indices" },
  { id: "V10-1S", name: "Volatility 10 (1s) Index", basePrice: 9450, category: "indices" },
  { id: "V25", name: "Volatility 25 Index", basePrice: 3200, category: "indices" },
  { id: "V25-1S", name: "Volatility 25 (1s) Index", basePrice: 3200, category: "indices" },
  { id: "V50", name: "Volatility 50 Index", basePrice: 4850, category: "indices" },
  { id: "V50-1S", name: "Volatility 50 (1s) Index", basePrice: 4850, category: "indices" },
  { id: "V75", name: "Volatility 75 Index", basePrice: 16500, category: "indices" },
  { id: "V75-1S", name: "Volatility 75 (1s) Index", basePrice: 16500, category: "indices" },
  { id: "V100", name: "Volatility 100 Index", basePrice: 1250, category: "indices" },
  { id: "V100-1S", name: "Volatility 100 (1s) Index", basePrice: 1250, category: "indices" },
];

export const allAssets: Asset[] = [...FOREX, ...OTC_CURRENCY, ...OTC_COMMODITY, ...OTC_STOCK, ...CRYPTO, ...INDICES];

export const assetCategories: { key: AssetCategory; label: string }[] = [
  { key: "forex", label: "Forex" },
  { key: "otc-currency", label: "OTC Moedas" },
  { key: "otc-commodity", label: "OTC Commodities" },
  { key: "otc-stock", label: "OTC Ações" },
  { key: "crypto", label: "Crypto" },
  { key: "indices", label: "Índices Continuous" },
];

export const assets = allAssets;

export function generateHistoricalCandles(asset: Asset, count = 250, intervalSeconds = 60): Candle[] {
  const candles: Candle[] = [];
  const now = Math.floor(Date.now() / 1000);
  const alignedNow = now - (now % intervalSeconds);
  const startTime = alignedNow - (count - 1) * intervalSeconds;
  let price = asset.basePrice;
  const volatility = asset.basePrice * 0.0003 * Math.sqrt(intervalSeconds / 60);

  // Generate realistic market phases (trending + consolidation)
  let trendBias = 0;
  let trendDuration = 0;
  let trendLength = 20 + Math.floor(Math.random() * 30);

  for (let i = 0; i < count; i++) {
    const time = startTime + i * intervalSeconds;
    
    // Switch trend phases periodically
    trendDuration++;
    if (trendDuration >= trendLength) {
      trendDuration = 0;
      trendLength = 15 + Math.floor(Math.random() * 35);
      // Clear trend direction or consolidation
      const r = Math.random();
      if (r < 0.35) trendBias = volatility * 0.4;       // uptrend
      else if (r < 0.7) trendBias = -volatility * 0.4;  // downtrend
      else trendBias = 0;                                 // consolidation
    }
    
    // Gradually weaken trend near end of phase
    const phaseProgress = trendDuration / trendLength;
    const fadedBias = trendBias * (1 - phaseProgress * 0.5);
    
    const open = price;
    const noise1 = (Math.random() - 0.5) * volatility * 2;
    const close = open + fadedBias + noise1;
    const wickUp = Math.abs((Math.random() - 0.5) * volatility);
    const wickDown = Math.abs((Math.random() - 0.5) * volatility);
    const high = Math.max(open, close) + wickUp;
    const low = Math.min(open, close) - wickDown;
    const volume = Math.round(1000 + Math.random() * 5000);

    candles.push({ time, open, high, low, close, volume });
    price = close;
  }
  return candles;
}

export function generateNextCandle(candles: Candle[], asset: Asset): Candle {
  const last = candles[candles.length - 1];
  const volatility = asset.basePrice * 0.0003;
  
  // Detect recent momentum from last 10 candles to maintain trend continuity
  const recent = candles.slice(-10);
  const momentum = recent.length >= 2
    ? (recent[recent.length - 1].close - recent[0].close) / (recent.length * volatility)
    : 0;
  
  // Apply momentum with decay + random noise
  const trendComponent = momentum * volatility * 0.3;
  const noise = (Math.random() - 0.5) * volatility;
  
  const open = last.close;
  const close = open + trendComponent + noise;
  const high = Math.max(open, close) + Math.random() * volatility * 0.3;
  const low = Math.min(open, close) - Math.random() * volatility * 0.3;
  const volume = Math.round(1000 + Math.random() * 5000);

  return {
    time: last.time + 60,
    open, high, low, close, volume,
  };
}
