// Technical indicator calculations

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function ema(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [];
  let prev = data[0];
  for (let i = 0; i < data.length; i++) {
    if (i === 0) { result.push(data[0]); continue; }
    prev = data[i] * k + prev * (1 - k);
    result.push(prev);
  }
  return result;
}

export function sma(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(data[i]); continue; }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += data[j];
    result.push(sum / period);
  }
  return result;
}

export function rsi(closes: number[], period = 14): number[] {
  const result: number[] = new Array(closes.length).fill(50);
  if (closes.length < period + 1) return result;

  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) avgGain += change; else avgLoss += Math.abs(change);
  }
  avgGain /= period; avgLoss /= period;
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return result;
}

export function macd(closes: number[]): { macdLine: number[]; signalLine: number[]; histogram: number[] } {
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = ema(macdLine, 9);
  const histogram = macdLine.map((v, i) => v - signalLine[i]);
  return { macdLine, signalLine, histogram };
}

export function adx(candles: Candle[], period = 14): number[] {
  const result: number[] = new Array(candles.length).fill(0);
  if (candles.length < period * 2) return result;

  const trueRanges: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high, low = candles[i].low;
    const prevHigh = candles[i - 1].high, prevLow = candles[i - 1].low, prevClose = candles[i - 1].close;
    trueRanges.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
    const upMove = high - prevHigh, downMove = prevLow - low;
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }

  const smoothTR = smoothed(trueRanges, period);
  const smoothPlusDM = smoothed(plusDM, period);
  const smoothMinusDM = smoothed(minusDM, period);

  const dx: number[] = [];
  for (let i = 0; i < smoothTR.length; i++) {
    if (smoothTR[i] === 0) { dx.push(0); continue; }
    const plusDI = (smoothPlusDM[i] / smoothTR[i]) * 100;
    const minusDI = (smoothMinusDM[i] / smoothTR[i]) * 100;
    const sum = plusDI + minusDI;
    dx.push(sum === 0 ? 0 : (Math.abs(plusDI - minusDI) / sum) * 100);
  }

  const adxValues = smoothed(dx, period);
  for (let i = 0; i < adxValues.length; i++) {
    const idx = i + (candles.length - adxValues.length);
    if (idx >= 0 && idx < candles.length) result[idx] = adxValues[i];
  }
  return result;
}

function smoothed(data: number[], period: number): number[] {
  if (data.length < period) return [];
  const result: number[] = [];
  let sum = 0;
  for (let i = 0; i < period; i++) sum += data[i];
  result.push(sum);
  for (let i = period; i < data.length; i++) {
    result.push(result[result.length - 1] - result[result.length - 1] / period + data[i]);
  }
  return result;
}

// Bollinger Bands
export function bollingerBands(closes: number[], period = 20, mult = 2): { upper: number[]; middle: number[]; lower: number[] } {
  const middle = sma(closes, period);
  const upper: number[] = [];
  const lower: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) { upper.push(middle[i]); lower.push(middle[i]); continue; }
    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) variance += (closes[j] - middle[i]) ** 2;
    const std = Math.sqrt(variance / period);
    upper.push(middle[i] + mult * std);
    lower.push(middle[i] - mult * std);
  }
  return { upper, middle, lower };
}

// Stochastic Oscillator
export function stochastic(candles: Candle[], kPeriod = 14, dPeriod = 3): { k: number[]; d: number[] } {
  const kValues: number[] = new Array(candles.length).fill(50);
  for (let i = kPeriod - 1; i < candles.length; i++) {
    let highestHigh = -Infinity, lowestLow = Infinity;
    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (candles[j].high > highestHigh) highestHigh = candles[j].high;
      if (candles[j].low < lowestLow) lowestLow = candles[j].low;
    }
    const range = highestHigh - lowestLow;
    kValues[i] = range === 0 ? 50 : ((candles[i].close - lowestLow) / range) * 100;
  }
  const d = sma(kValues, dPeriod);
  return { k: kValues, d };
}

// Support and Resistance levels
export function findSupportResistance(candles: Candle[], lookback = 50): { supports: number[]; resistances: number[] } {
  const recent = candles.slice(-lookback);
  const pivots: { price: number; type: "high" | "low" }[] = [];

  for (let i = 2; i < recent.length - 2; i++) {
    const c = recent[i];
    if (c.high > recent[i - 1].high && c.high > recent[i - 2].high &&
        c.high > recent[i + 1].high && c.high > recent[i + 2].high) {
      pivots.push({ price: c.high, type: "high" });
    }
    if (c.low < recent[i - 1].low && c.low < recent[i - 2].low &&
        c.low < recent[i + 1].low && c.low < recent[i + 2].low) {
      pivots.push({ price: c.low, type: "low" });
    }
  }

  // Cluster nearby levels
  const lastPrice = candles[candles.length - 1].close;
  const tolerance = lastPrice * 0.001;
  const supports: number[] = [];
  const resistances: number[] = [];

  const clustered = clusterLevels(pivots.map(p => p.price), tolerance);
  for (const level of clustered) {
    if (level < lastPrice) supports.push(level);
    else resistances.push(level);
  }

  return {
    supports: supports.sort((a, b) => b - a).slice(0, 3),
    resistances: resistances.sort((a, b) => a - b).slice(0, 3),
  };
}

function clusterLevels(prices: number[], tolerance: number): number[] {
  if (prices.length === 0) return [];
  const sorted = [...prices].sort((a, b) => a - b);
  const clusters: number[][] = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const last = clusters[clusters.length - 1];
    if (sorted[i] - last[last.length - 1] < tolerance) last.push(sorted[i]);
    else clusters.push([sorted[i]]);
  }
  return clusters
    .filter(c => c.length >= 2) // only levels touched 2+ times
    .map(c => c.reduce((a, b) => a + b, 0) / c.length);
}

// Trend detection via highs/lows structure
export type TrendType = "uptrend" | "downtrend" | "lateral";

export function detectTrend(candles: Candle[], lookback = 30): { trend: TrendType; strength: number } {
  const recent = candles.slice(-lookback);
  let higherHighs = 0, lowerLows = 0, lowerHighs = 0, higherLows = 0;

  for (let i = 5; i < recent.length; i += 5) {
    const curr = recent.slice(i - 5, i);
    const prev = recent.slice(Math.max(0, i - 10), i - 5);
    if (prev.length < 5) continue;
    const currHigh = Math.max(...curr.map(c => c.high));
    const currLow = Math.min(...curr.map(c => c.low));
    const prevHigh = Math.max(...prev.map(c => c.high));
    const prevLow = Math.min(...prev.map(c => c.low));

    if (currHigh > prevHigh) higherHighs++; else lowerHighs++;
    if (currLow > prevLow) higherLows++; else lowerLows++;
  }

  const upScore = higherHighs + higherLows;
  const downScore = lowerHighs + lowerLows;
  const total = upScore + downScore || 1;

  if (upScore > downScore * 1.5) return { trend: "uptrend", strength: upScore / total };
  if (downScore > upScore * 1.5) return { trend: "downtrend", strength: downScore / total };
  return { trend: "lateral", strength: 0.5 };
}

// Pullback detection
export function detectPullback(candles: Candle[], trend: TrendType): { isPullback: boolean; depth: number } {
  if (trend === "lateral") return { isPullback: false, depth: 0 };
  const last10 = candles.slice(-10);
  const last5 = candles.slice(-5);
  const prev5 = candles.slice(-10, -5);

  const impulseRange = Math.max(...prev5.map(c => c.high)) - Math.min(...prev5.map(c => c.low));
  const retraceHigh = Math.max(...last5.map(c => c.high));
  const retraceLow = Math.min(...last5.map(c => c.low));

  if (trend === "uptrend") {
    const impHigh = Math.max(...prev5.map(c => c.high));
    const depth = (impHigh - retraceLow) / (impulseRange || 1);
    return { isPullback: depth > 0.3 && depth < 0.7 && last5[last5.length - 1].close > retraceLow, depth };
  } else {
    const impLow = Math.min(...prev5.map(c => c.low));
    const depth = (retraceHigh - impLow) / (impulseRange || 1);
    return { isPullback: depth > 0.3 && depth < 0.7 && last5[last5.length - 1].close < retraceHigh, depth };
  }
}

// Market symmetry detection
export function detectSymmetry(candles: Candle[], lookback = 40): { score: number; direction: "bull" | "bear" | "none" } {
  if (candles.length < lookback * 2) return { score: 0, direction: "none" };

  const recent = candles.slice(-lookback);
  const prior = candles.slice(-lookback * 2, -lookback);

  // Normalize price movements to compare structure
  const recentMoves = recent.map((c, i) => i > 0 ? (c.close - recent[i - 1].close) / (recent[i - 1].close || 1) : 0).slice(1);
  const priorMoves = prior.map((c, i) => i > 0 ? (c.close - prior[i - 1].close) / (prior[i - 1].close || 1) : 0).slice(1);

  // Correlation
  const n = Math.min(recentMoves.length, priorMoves.length);
  let sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumXY += recentMoves[i] * priorMoves[i];
    sumX2 += recentMoves[i] ** 2;
    sumY2 += priorMoves[i] ** 2;
  }
  const denom = Math.sqrt(sumX2 * sumY2);
  const correlation = denom === 0 ? 0 : sumXY / denom;

  // If correlated, check what happened after the prior period
  const afterPrior = candles.slice(-lookback);
  const netMove = afterPrior[afterPrior.length - 1].close - afterPrior[0].close;

  return {
    score: Math.abs(correlation),
    direction: correlation > 0.3 ? (netMove > 0 ? "bull" : "bear") : "none",
  };
}

// Enhanced candlestick pattern detection
export interface PatternResult {
  pattern: string;
  bullish: boolean;
  strength: number; // 0-1
}

export function detectPattern(candles: Candle[]): PatternResult | null {
  if (candles.length < 3) return null;
  const curr = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const prev2 = candles[candles.length - 3];

  const currBody = Math.abs(curr.close - curr.open);
  const prevBody = Math.abs(prev.close - prev.open);
  const currRange = curr.high - curr.low;
  const avgRange = candles.slice(-20).reduce((s, c) => s + (c.high - c.low), 0) / 20;
  const lowerWick = Math.min(curr.open, curr.close) - curr.low;
  const upperWick = curr.high - Math.max(curr.open, curr.close);

  // Doji
  if (currBody < currRange * 0.1 && currRange > avgRange * 0.5) {
    const prevTrend = prev.close > prev2.close;
    return { pattern: "Doji", bullish: !prevTrend, strength: 0.6 };
  }

  // Bullish Engulfing
  if (prev.close < prev.open && curr.close > curr.open && currBody > prevBody * 1.1 && curr.close > prev.open && curr.open < prev.close) {
    return { pattern: "Engolfo Alta", bullish: true, strength: 0.8 };
  }
  // Bearish Engulfing
  if (prev.close > prev.open && curr.close < curr.open && currBody > prevBody * 1.1 && curr.open > prev.close && curr.close < prev.open) {
    return { pattern: "Engolfo Baixa", bullish: false, strength: 0.8 };
  }

  // Morning Star (3 candles)
  if (prev2.close < prev2.open && Math.abs(prev.close - prev.open) < avgRange * 0.3 && curr.close > curr.open && curr.close > (prev2.open + prev2.close) / 2) {
    return { pattern: "Estrela da Manhã", bullish: true, strength: 0.85 };
  }
  // Evening Star
  if (prev2.close > prev2.open && Math.abs(prev.close - prev.open) < avgRange * 0.3 && curr.close < curr.open && curr.close < (prev2.open + prev2.close) / 2) {
    return { pattern: "Estrela da Noite", bullish: false, strength: 0.85 };
  }

  // Pin Bar (Hammer / Shooting Star with stronger criteria)
  if (lowerWick > currBody * 2.5 && upperWick < currBody * 0.3 && currRange > avgRange * 0.8) {
    return { pattern: "Pin Bar Alta", bullish: true, strength: 0.75 };
  }
  if (upperWick > currBody * 2.5 && lowerWick < currBody * 0.3 && currRange > avgRange * 0.8) {
    return { pattern: "Pin Bar Baixa", bullish: false, strength: 0.75 };
  }

  // Hammer (less strict)
  if (lowerWick > currBody * 2 && upperWick < currBody * 0.5 && currRange > 0) {
    return { pattern: "Martelo", bullish: true, strength: 0.65 };
  }
  // Shooting Star
  if (upperWick > currBody * 2 && lowerWick < currBody * 0.5 && currRange > 0) {
    return { pattern: "Estrela Cadente", bullish: false, strength: 0.65 };
  }

  // Inside Bar
  if (curr.high < prev.high && curr.low > prev.low) {
    const prevBull = prev.close > prev.open;
    return { pattern: "Inside Bar", bullish: prevBull, strength: 0.55 };
  }

  return null;
}

// Volatility measurement
export function atr(candles: Candle[], period = 14): number[] {
  const result: number[] = new Array(candles.length).fill(0);
  if (candles.length < period + 1) return result;

  const trs: number[] = [candles[0].high - candles[0].low];
  for (let i = 1; i < candles.length; i++) {
    trs.push(Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    ));
  }

  let sum = 0;
  for (let i = 0; i < period; i++) sum += trs[i];
  result[period - 1] = sum / period;
  for (let i = period; i < candles.length; i++) {
    result[i] = (result[i - 1] * (period - 1) + trs[i]) / period;
  }
  return result;
}

// Check if price is near support or resistance
export function isNearLevel(price: number, levels: number[], tolerance: number): { near: boolean; level: number; type: "support" | "resistance" } | null {
  for (const level of levels) {
    if (Math.abs(price - level) / price < tolerance) {
      return { near: true, level, type: price > level ? "support" : "resistance" };
    }
  }
  return null;
}

// Williams %R
export function williamsR(candles: Candle[], period = 14): number[] {
  const result: number[] = new Array(candles.length).fill(-50);
  for (let i = period - 1; i < candles.length; i++) {
    let highestHigh = -Infinity, lowestLow = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (candles[j].high > highestHigh) highestHigh = candles[j].high;
      if (candles[j].low < lowestLow) lowestLow = candles[j].low;
    }
    const range = highestHigh - lowestLow;
    result[i] = range === 0 ? -50 : ((highestHigh - candles[i].close) / range) * -100;
  }
  return result;
}

// Commodity Channel Index (CCI)
export function cci(candles: Candle[], period = 20): number[] {
  const result: number[] = new Array(candles.length).fill(0);
  const typicalPrices = candles.map(c => (c.high + c.low + c.close) / 3);
  const tpSma = sma(typicalPrices, period);

  for (let i = period - 1; i < candles.length; i++) {
    let meanDev = 0;
    for (let j = i - period + 1; j <= i; j++) {
      meanDev += Math.abs(typicalPrices[j] - tpSma[i]);
    }
    meanDev /= period;
    result[i] = meanDev === 0 ? 0 : (typicalPrices[i] - tpSma[i]) / (0.015 * meanDev);
  }
  return result;
}

// On Balance Volume (OBV) trend direction
export function obv(candles: Candle[]): number[] {
  const result: number[] = [0];
  for (let i = 1; i < candles.length; i++) {
    if (candles[i].close > candles[i - 1].close) {
      result.push(result[i - 1] + candles[i].volume);
    } else if (candles[i].close < candles[i - 1].close) {
      result.push(result[i - 1] - candles[i].volume);
    } else {
      result.push(result[i - 1]);
    }
  }
  return result;
}

// OBV trend (is OBV EMA rising or falling)
export function obvTrend(candles: Candle[], emaPeriod = 10): "rising" | "falling" | "flat" {
  const obvValues = obv(candles);
  const obvEma = ema(obvValues, emaPeriod);
  const last = obvEma[obvEma.length - 1];
  const prev = obvEma[obvEma.length - 4]; // compare to 3 bars ago
  const diff = last - prev;
  const avgObv = Math.abs(last) || 1;
  if (diff / avgObv > 0.01) return "rising";
  if (diff / avgObv < -0.01) return "falling";
  return "flat";
}

// Simplified Ichimoku — Tenkan/Kijun cross + cloud position
export function ichimoku(candles: Candle[]): {
  tenkan: number; kijun: number; senkouA: number; senkouB: number;
  signal: "bull" | "bear" | "neutral";
} {
  const midPrice = (period: number, idx: number) => {
    let hh = -Infinity, ll = Infinity;
    for (let i = Math.max(0, idx - period + 1); i <= idx; i++) {
      if (candles[i].high > hh) hh = candles[i].high;
      if (candles[i].low < ll) ll = candles[i].low;
    }
    return (hh + ll) / 2;
  };

  const last = candles.length - 1;
  const tenkan = midPrice(9, last);
  const kijun = midPrice(26, last);
  const senkouA = (tenkan + kijun) / 2;
  const senkouB = midPrice(52, last);
  const price = candles[last].close;

  const aboveCloud = price > Math.max(senkouA, senkouB);
  const belowCloud = price < Math.min(senkouA, senkouB);
  const tkCross = tenkan > kijun;

  let signal: "bull" | "bear" | "neutral" = "neutral";
  if (aboveCloud && tkCross) signal = "bull";
  else if (belowCloud && !tkCross) signal = "bear";

  return { tenkan, kijun, senkouA, senkouB, signal };
}

// RSI Divergence detection
export function detectRsiDivergence(candles: Candle[], rsiValues: number[], lookback = 20): {
  type: "bullish_div" | "bearish_div" | null;
} {
  if (candles.length < lookback + 5) return { type: null };
  const start = candles.length - lookback;
  const end = candles.length - 1;

  // Find swing lows/highs in price and RSI
  let priceLow1 = Infinity, priceLow1Idx = start;
  let priceLow2 = Infinity, priceLow2Idx = start;
  let priceHigh1 = -Infinity, priceHigh1Idx = start;
  let priceHigh2 = -Infinity, priceHigh2Idx = start;

  const mid = Math.floor((start + end) / 2);

  for (let i = start; i < mid; i++) {
    if (candles[i].low < priceLow1) { priceLow1 = candles[i].low; priceLow1Idx = i; }
    if (candles[i].high > priceHigh1) { priceHigh1 = candles[i].high; priceHigh1Idx = i; }
  }
  for (let i = mid; i <= end; i++) {
    if (candles[i].low < priceLow2) { priceLow2 = candles[i].low; priceLow2Idx = i; }
    if (candles[i].high > priceHigh2) { priceHigh2 = candles[i].high; priceHigh2Idx = i; }
  }

  // Bullish divergence: price makes lower low, RSI makes higher low
  if (priceLow2 < priceLow1 && rsiValues[priceLow2Idx] > rsiValues[priceLow1Idx]) {
    return { type: "bullish_div" };
  }

  // Bearish divergence: price makes higher high, RSI makes lower high
  if (priceHigh2 > priceHigh1 && rsiValues[priceHigh2Idx] < rsiValues[priceHigh1Idx]) {
    return { type: "bearish_div" };
  }

  return { type: null };
}

// Multi-timeframe: aggregate candles into larger timeframe
export function aggregateCandles(candles: Candle[], factor: number): Candle[] {
  const result: Candle[] = [];
  for (let i = 0; i < candles.length; i += factor) {
    const chunk = candles.slice(i, i + factor);
    if (chunk.length === 0) continue;
    result.push({
      time: chunk[0].time,
      open: chunk[0].open,
      high: Math.max(...chunk.map(c => c.high)),
      low: Math.min(...chunk.map(c => c.low)),
      close: chunk[chunk.length - 1].close,
      volume: chunk.reduce((s, c) => s + c.volume, 0),
    });
  }
  return result;
}
