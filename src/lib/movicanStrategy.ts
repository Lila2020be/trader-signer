/**
 * MOVICAN Strategy — Moving Average + Candle Patterns
 * 
 * Combines EMA crossovers with Japanese candlestick pattern recognition
 * for high-probability binary options signals.
 */

import { Candle, ema, sma, rsi, detectPattern, PatternResult } from "./indicators";

export interface MovicanSignal {
  direction: "CALL" | "PUT";
  strength: number; // 0-100
  maScore: number;
  candleScore: number;
  patterns: string[];
  reasons: string[];
}

// Detect additional candlestick patterns beyond the existing ones
function detectAdvancedPatterns(candles: Candle[]): PatternResult[] {
  const results: PatternResult[] = [];
  if (candles.length < 5) return results;

  const c = candles[candles.length - 1];
  const p1 = candles[candles.length - 2];
  const p2 = candles[candles.length - 3];
  const p3 = candles[candles.length - 4];

  const body = (k: Candle) => Math.abs(k.close - k.open);
  const range = (k: Candle) => k.high - k.low;
  const isBull = (k: Candle) => k.close > k.open;
  const isBear = (k: Candle) => k.close < k.open;

  const avgBody = candles.slice(-20).reduce((s, k) => s + body(k), 0) / 20;

  // Three White Soldiers
  if (isBull(p2) && isBull(p1) && isBull(c) &&
      body(p2) > avgBody * 0.7 && body(p1) > avgBody * 0.7 && body(c) > avgBody * 0.7 &&
      p1.close > p2.close && c.close > p1.close) {
    results.push({ pattern: "Três Soldados Brancos", bullish: true, strength: 0.9 });
  }

  // Three Black Crows
  if (isBear(p2) && isBear(p1) && isBear(c) &&
      body(p2) > avgBody * 0.7 && body(p1) > avgBody * 0.7 && body(c) > avgBody * 0.7 &&
      p1.close < p2.close && c.close < p1.close) {
    results.push({ pattern: "Três Corvos Negros", bullish: false, strength: 0.9 });
  }

  // Tweezer Bottom
  if (isBear(p1) && isBull(c) && Math.abs(p1.low - c.low) / range(c) < 0.05) {
    results.push({ pattern: "Pinça de Fundo", bullish: true, strength: 0.7 });
  }

  // Tweezer Top
  if (isBull(p1) && isBear(c) && Math.abs(p1.high - c.high) / range(c) < 0.05) {
    results.push({ pattern: "Pinça de Topo", bullish: false, strength: 0.7 });
  }

  // Piercing Line
  if (isBear(p1) && isBull(c) && c.open < p1.low && c.close > (p1.open + p1.close) / 2) {
    results.push({ pattern: "Linha Perfurante", bullish: true, strength: 0.75 });
  }

  // Dark Cloud Cover
  if (isBull(p1) && isBear(c) && c.open > p1.high && c.close < (p1.open + p1.close) / 2) {
    results.push({ pattern: "Nuvem Negra", bullish: false, strength: 0.75 });
  }

  // Bullish Harami
  if (isBear(p1) && isBull(c) && body(c) < body(p1) * 0.6 &&
      c.open > p1.close && c.close < p1.open) {
    results.push({ pattern: "Harami Alta", bullish: true, strength: 0.65 });
  }

  // Bearish Harami
  if (isBull(p1) && isBear(c) && body(c) < body(p1) * 0.6 &&
      c.open < p1.close && c.close > p1.open) {
    results.push({ pattern: "Harami Baixa", bullish: false, strength: 0.65 });
  }

  // Dragonfly Doji (long lower shadow, no upper shadow)
  if (body(c) < range(c) * 0.05 && (c.high - Math.max(c.open, c.close)) < range(c) * 0.1 && 
      (Math.min(c.open, c.close) - c.low) > range(c) * 0.6) {
    results.push({ pattern: "Doji Libélula", bullish: true, strength: 0.7 });
  }

  // Gravestone Doji (long upper shadow, no lower shadow)
  if (body(c) < range(c) * 0.05 && (Math.min(c.open, c.close) - c.low) < range(c) * 0.1 &&
      (c.high - Math.max(c.open, c.close)) > range(c) * 0.6) {
    results.push({ pattern: "Doji Lápide", bullish: false, strength: 0.7 });
  }

  return results;
}

/**
 * MOVICAN Analysis
 * Combines Moving Averages with Candlestick Patterns
 */
export function analyzeMovican(candles: Candle[]): MovicanSignal | null {
  if (candles.length < 50) return null;

  const closes = candles.map(c => c.close);
  const last = (arr: number[]) => arr[arr.length - 1];
  const prev = (arr: number[]) => arr[arr.length - 2];

  // === Moving Average Analysis ===
  const ema9 = ema(closes, 9);
  const ema21 = ema(closes, 21);
  const ema50 = ema(closes, 50);
  const sma200 = sma(closes, 200);
  const rsiValues = rsi(closes, 14);

  let maBullScore = 0;
  let maBearScore = 0;
  const reasons: string[] = [];

  // EMA 9/21 crossover (primary signal)
  const ema9Above21 = last(ema9) > last(ema21);
  const ema9CrossedAbove = last(ema9) > last(ema21) && prev(ema9) <= prev(ema21);
  const ema9CrossedBelow = last(ema9) < last(ema21) && prev(ema9) >= prev(ema21);

  if (ema9CrossedAbove) {
    maBullScore += 3;
    reasons.push("EMA 9 cruzou acima da EMA 21 ↑");
  } else if (ema9CrossedBelow) {
    maBearScore += 3;
    reasons.push("EMA 9 cruzou abaixo da EMA 21 ↓");
  } else if (ema9Above21) {
    maBullScore += 1.5;
    reasons.push("EMA 9 acima da EMA 21");
  } else {
    maBearScore += 1.5;
    reasons.push("EMA 9 abaixo da EMA 21");
  }

  // EMA alignment (9 > 21 > 50)
  if (last(ema9) > last(ema21) && last(ema21) > last(ema50)) {
    maBullScore += 2;
    reasons.push("EMAs alinhadas em alta (9>21>50)");
  } else if (last(ema9) < last(ema21) && last(ema21) < last(ema50)) {
    maBearScore += 2;
    reasons.push("EMAs alinhadas em baixa (9<21<50)");
  }

  // Price position relative to EMAs
  const lastClose = closes[closes.length - 1];
  if (lastClose > last(ema9) && lastClose > last(ema21)) {
    maBullScore += 1;
  } else if (lastClose < last(ema9) && lastClose < last(ema21)) {
    maBearScore += 1;
  }

  // SMA 200 trend filter
  if (closes.length >= 200) {
    if (lastClose > last(sma200)) {
      maBullScore += 1;
      reasons.push("Preço acima da SMA 200");
    } else {
      maBearScore += 1;
      reasons.push("Preço abaixo da SMA 200");
    }
  }

  // RSI confirmation
  const lastRsi = last(rsiValues);
  if (lastRsi < 35) { maBullScore += 1; reasons.push(`RSI sobrevendido (${lastRsi.toFixed(0)})`); }
  else if (lastRsi > 65) { maBearScore += 1; reasons.push(`RSI sobrecomprado (${lastRsi.toFixed(0)})`); }
  else if (lastRsi < 45) { maBullScore += 0.5; }
  else if (lastRsi > 55) { maBearScore += 0.5; }

  const maScore = Math.max(maBullScore, maBearScore);
  const maDirection = maBullScore > maBearScore ? "CALL" : "PUT";

  // === Candlestick Pattern Analysis ===
  const basicPattern = detectPattern(candles);
  const advancedPatterns = detectAdvancedPatterns(candles);
  
  const allPatterns = [...advancedPatterns];
  if (basicPattern) allPatterns.push(basicPattern);

  let candleBullScore = 0;
  let candleBearScore = 0;
  const patternNames: string[] = [];

  for (const p of allPatterns) {
    const weight = p.strength * 3; // scale to match MA scoring
    if (p.bullish) candleBullScore += weight;
    else candleBearScore += weight;
    patternNames.push(p.pattern);
    reasons.push(`Padrão: ${p.pattern}`);
  }

  const candleScore = Math.max(candleBullScore, candleBearScore);
  const candleDirection = candleBullScore > candleBearScore ? "CALL" : "PUT";

  // === MOVICAN Combination ===
  // Both MA and Candle must agree for a signal
  const totalBull = maBullScore + candleBullScore;
  const totalBear = maBearScore + candleBearScore;
  const totalMax = Math.max(totalBull, totalBear);
  const totalMin = Math.min(totalBull, totalBear);

  // Need minimum combined score
  if (totalMax < 2) return null;
  if (totalMax - totalMin < 1) return null;

  // Both must lean in the same direction for highest confidence
  const direction = totalBull > totalBear ? "CALL" as const : "PUT" as const;
  const agreement = maDirection === candleDirection;
  
  // Calculate strength (0-100)
  const maxPossible = 12;
  let strength = Math.round((totalMax / maxPossible) * 100);
  
  if (agreement) strength = Math.min(100, strength + 15);
  if (!agreement && allPatterns.length > 0) strength = Math.max(0, strength - 10);
  
  strength = Math.min(95, Math.max(50, strength));

  // Lower minimum threshold
  if (strength < 50) return null;

  return {
    direction,
    strength,
    maScore,
    candleScore,
    patterns: patternNames,
    reasons,
  };
}
