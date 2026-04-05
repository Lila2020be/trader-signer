import {
  Candle, ema, rsi, macd, adx, detectPattern, bollingerBands,
  stochastic, findSupportResistance, detectTrend, detectPullback,
  detectSymmetry, atr, isNearLevel, TrendType, PatternResult,
  williamsR, cci, ichimoku, detectRsiDivergence, obvTrend, aggregateCandles,
} from "./indicators";

export type SignalType = "CALL" | "PUT";
export type SignalStrength = "strong" | "medium" | "weak";

export interface ScoreBreakdown {
  trend: number;
  pattern: number;
  rsiScore: number;
  macdScore: number;
  adxScore: number;
  bbScore: number;
  stochScore: number;
  srScore: number;
  pullbackScore: number;
  symmetryScore: number;
  volumeScore: number;
  williamsScore: number;
  cciScore: number;
  ichimokuScore: number;
  divergenceScore: number;
  obvScore: number;
  mtfScore: number;
}

export interface Signal {
  id: string;
  time: number;
  type: SignalType;
  strength: SignalStrength;
  probability: number;
  probabilityCall: number;
  probabilityPut: number;
  score: number;
  maxPossibleScore: number;
  reasons: string[];
  breakdown: ScoreBreakdown;
  expired: boolean;
  result?: "win" | "loss" | "pending";
  expiresAt: number;
  entryTime: number;
  recommendedExpiry: number; // seconds
  trendDirection: TrendType;
  patternDetected: string | null;
  srLevels: { supports: number[]; resistances: number[] };
}

interface SignalContext {
  lastSignalTime: number;
  lastSignalType: SignalType | null;
  history: { type: SignalType; result: "win" | "loss" }[];
  adaptiveBonus: number; // adjusts based on past performance
}

const ctx: SignalContext = { lastSignalTime: 0, lastSignalType: null, history: [], adaptiveBonus: 0 };

const MAX_SCORE = 17; // maximum possible points

export function recordResult(type: SignalType, result: "win" | "loss") {
  ctx.history.push({ type, result });
  if (ctx.history.length > 50) ctx.history.shift();

  // Adaptive: adjust bonus based on recent win rate
  const recent = ctx.history.slice(-20);
  const wins = recent.filter(h => h.result === "win").length;
  const winRate = recent.length > 0 ? wins / recent.length : 0.5;
  ctx.adaptiveBonus = (winRate - 0.5) * 10; // -5 to +5
}

export function analyzeCandles(candles: Candle[]): Signal | null {
  if (candles.length < 50) return null;

  const closes = candles.map(c => c.close);
  const lastCandle = candles[candles.length - 1];
  const candleRange = lastCandle.high - lastCandle.low;
  const avgRange = candles.slice(-20).reduce((s, c) => s + (c.high - c.low), 0) / 20;

  // Filter: skip tiny candles (low volatility)
  if (candleRange < avgRange * 0.05) return null;

  // Avoid signals too close together (at least 15s apart)
  if (lastCandle.time - ctx.lastSignalTime < 15) return null;

  // === Compute all indicators ===
  const ema9 = ema(closes, 9);
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const ema200 = ema(closes, 200);
  const rsiValues = rsi(closes, 14);
  const macdData = macd(closes);
  const adxValues = adx(candles, 14);
  const bb = bollingerBands(closes, 20, 2);
  const stoch = stochastic(candles, 14, 3);
  const sr = findSupportResistance(candles, 60);
  const trendInfo = detectTrend(candles, 30);
  const pullback = detectPullback(candles, trendInfo.trend);
  const symmetry = detectSymmetry(candles, 30);
  const atrValues = atr(candles, 14);
  const pattern = detectPattern(candles);

  const last = (arr: number[]) => arr[arr.length - 1];
  const prev = (arr: number[]) => arr[arr.length - 2];

  const lastClose = lastCandle.close;
  const lastRsi = last(rsiValues);
  const lastMacdHist = last(macdData.histogram);
  const prevMacdHist = prev(macdData.histogram);
  const lastAdx = last(adxValues);
  const lastBBUpper = last(bb.upper);
  const lastBBLower = last(bb.lower);
  const lastBBMiddle = last(bb.middle);
  const lastStochK = last(stoch.k);
  const lastStochD = last(stoch.d);
  const lastAtr = last(atrValues);

  // === Scoring system ===
  let bullScore = 0;
  let bearScore = 0;
  const reasons: string[] = [];
  const breakdown: ScoreBreakdown = {
    trend: 0, pattern: 0, rsiScore: 0, macdScore: 0, adxScore: 0,
    bbScore: 0, stochScore: 0, srScore: 0, pullbackScore: 0,
    symmetryScore: 0, volumeScore: 0, williamsScore: 0, cciScore: 0,
    ichimokuScore: 0, divergenceScore: 0, obvScore: 0, mtfScore: 0,
  };

  // 1. Trend (EMA alignment: 9 > 20 > 50 > 200)
  const emaAligned = last(ema9) > last(ema20) && last(ema20) > last(ema50);
  const emaAlignedBear = last(ema9) < last(ema20) && last(ema20) < last(ema50);
  if (trendInfo.trend === "uptrend" && emaAligned) {
    bullScore += 1.5; breakdown.trend = 1.5;
    reasons.push(`Tendência Alta (${(trendInfo.strength * 100).toFixed(0)}%)`);
  } else if (trendInfo.trend === "downtrend" && emaAlignedBear) {
    bearScore += 1.5; breakdown.trend = -1.5;
    reasons.push(`Tendência Baixa (${(trendInfo.strength * 100).toFixed(0)}%)`);
  } else if (last(ema20) > last(ema200)) {
    bullScore += 0.5; breakdown.trend = 0.5;
    reasons.push("EMA20 > EMA200");
  } else {
    bearScore += 0.5; breakdown.trend = -0.5;
    reasons.push("EMA20 < EMA200");
  }

  // 2. RSI
  if (lastRsi < 30) {
    bullScore += 1.5; breakdown.rsiScore = 1.5;
    reasons.push(`RSI muito sobrevendido (${lastRsi.toFixed(0)})`);
  } else if (lastRsi < 40) {
    bullScore += 0.8; breakdown.rsiScore = 0.8;
    reasons.push(`RSI sobrevendido (${lastRsi.toFixed(0)})`);
  } else if (lastRsi > 70) {
    bearScore += 1.5; breakdown.rsiScore = -1.5;
    reasons.push(`RSI muito sobrecomprado (${lastRsi.toFixed(0)})`);
  } else if (lastRsi > 60) {
    bearScore += 0.8; breakdown.rsiScore = -0.8;
    reasons.push(`RSI sobrecomprado (${lastRsi.toFixed(0)})`);
  }

  // 3. MACD
  if (lastMacdHist > 0 && prevMacdHist <= 0) {
    bullScore += 1.5; breakdown.macdScore = 1.5;
    reasons.push("MACD cruzou ↑");
  } else if (lastMacdHist < 0 && prevMacdHist >= 0) {
    bearScore += 1.5; breakdown.macdScore = -1.5;
    reasons.push("MACD cruzou ↓");
  } else if (lastMacdHist > 0) {
    bullScore += 0.5; breakdown.macdScore = 0.5;
    reasons.push("MACD positivo");
  } else {
    bearScore += 0.5; breakdown.macdScore = -0.5;
    reasons.push("MACD negativo");
  }

  // 4. ADX (trend strength)
  if (lastAdx > 25) {
    const isBull = trendInfo.trend === "uptrend";
    if (isBull) { bullScore += 1; breakdown.adxScore = 1; }
    else { bearScore += 1; breakdown.adxScore = -1; }
    reasons.push(`ADX forte (${lastAdx.toFixed(0)})`);
  } else if (lastAdx > 20) {
    const isBull = trendInfo.trend === "uptrend";
    if (isBull) { bullScore += 0.5; breakdown.adxScore = 0.5; }
    else { bearScore += 0.5; breakdown.adxScore = -0.5; }
  }

  // 5. Bollinger Bands
  if (lastClose <= lastBBLower) {
    bullScore += 1; breakdown.bbScore = 1;
    reasons.push("Preço na BB inferior");
  } else if (lastClose >= lastBBUpper) {
    bearScore += 1; breakdown.bbScore = -1;
    reasons.push("Preço na BB superior");
  }

  // 6. Stochastic
  if (lastStochK < 25) {
    bullScore += 1; breakdown.stochScore = 1;
    reasons.push(`Stoch sobrevendido (${lastStochK.toFixed(0)})`);
  } else if (lastStochK > 75) {
    bearScore += 1; breakdown.stochScore = -1;
    reasons.push(`Stoch sobrecomprado (${lastStochK.toFixed(0)})`);
  }

  // 7. Support/Resistance
  const allLevels = [...sr.supports, ...sr.resistances];
  const nearLevel = isNearLevel(lastClose, allLevels, 0.002);
  if (nearLevel) {
    if (nearLevel.type === "support") {
      bullScore += 1; breakdown.srScore = 1;
      reasons.push("Preço em suporte");
    } else {
      bearScore += 1; breakdown.srScore = -1;
      reasons.push("Preço em resistência");
    }
  }

  // 8. Pullback
  if (pullback.isPullback) {
    if (trendInfo.trend === "uptrend") {
      bullScore += 1; breakdown.pullbackScore = 1;
      reasons.push(`Pullback em alta (${(pullback.depth * 100).toFixed(0)}%)`);
    } else {
      bearScore += 1; breakdown.pullbackScore = -1;
      reasons.push(`Pullback em baixa (${(pullback.depth * 100).toFixed(0)}%)`);
    }
  }

  // 9. Symmetry
  if (symmetry.score > 0.5) {
    if (symmetry.direction === "bull") {
      bullScore += 0.5; breakdown.symmetryScore = 0.5;
      reasons.push(`Simetria alta (${(symmetry.score * 100).toFixed(0)}%)`);
    } else if (symmetry.direction === "bear") {
      bearScore += 0.5; breakdown.symmetryScore = -0.5;
      reasons.push(`Simetria baixa (${(symmetry.score * 100).toFixed(0)}%)`);
    }
  }

  // 10. Candlestick pattern
  if (pattern) {
    const pts = pattern.strength;
    if (pattern.bullish) { bullScore += pts; breakdown.pattern = pts; }
    else { bearScore += pts; breakdown.pattern = -pts; }
    reasons.push(pattern.pattern);
  }

  // 11. Volume confirmation (proxy via candle size)
  const volRatio = candleRange / avgRange;
  if (volRatio > 1.5) {
    const isBullCandle = lastCandle.close > lastCandle.open;
    if (isBullCandle) { bullScore += 0.5; breakdown.volumeScore = 0.5; }
    else { bearScore += 0.5; breakdown.volumeScore = -0.5; }
    reasons.push(`Volume alto (${volRatio.toFixed(1)}x)`);
  }

  // 12. Williams %R
  const wrValues = williamsR(candles, 14);
  const lastWR = last(wrValues);
  if (lastWR < -80) {
    bullScore += 1; breakdown.williamsScore = 1;
    reasons.push(`Williams %R sobrevendido (${lastWR.toFixed(0)})`);
  } else if (lastWR > -20) {
    bearScore += 1; breakdown.williamsScore = -1;
    reasons.push(`Williams %R sobrecomprado (${lastWR.toFixed(0)})`);
  }

  // 13. CCI
  const cciValues = cci(candles, 20);
  const lastCCI = last(cciValues);
  if (lastCCI < -100) {
    bullScore += 1; breakdown.cciScore = 1;
    reasons.push(`CCI sobrevendido (${lastCCI.toFixed(0)})`);
  } else if (lastCCI > 100) {
    bearScore += 1; breakdown.cciScore = -1;
    reasons.push(`CCI sobrecomprado (${lastCCI.toFixed(0)})`);
  }

  // 14. Ichimoku Cloud
  if (candles.length >= 52) {
    const ichi = ichimoku(candles);
    if (ichi.signal === "bull") {
      bullScore += 1; breakdown.ichimokuScore = 1;
      reasons.push("Ichimoku bullish (acima da nuvem)");
    } else if (ichi.signal === "bear") {
      bearScore += 1; breakdown.ichimokuScore = -1;
      reasons.push("Ichimoku bearish (abaixo da nuvem)");
    }
  }

  // 15. RSI Divergence
  const divergence = detectRsiDivergence(candles, rsiValues, 20);
  if (divergence.type === "bullish_div") {
    bullScore += 1.5; breakdown.divergenceScore = 1.5;
    reasons.push("Divergência RSI altista");
  } else if (divergence.type === "bearish_div") {
    bearScore += 1.5; breakdown.divergenceScore = -1.5;
    reasons.push("Divergência RSI baixista");
  }

  // 16. OBV trend
  const obvDir = obvTrend(candles, 10);
  if (obvDir === "rising") {
    bullScore += 0.5; breakdown.obvScore = 0.5;
    reasons.push("OBV em alta");
  } else if (obvDir === "falling") {
    bearScore += 0.5; breakdown.obvScore = -0.5;
    reasons.push("OBV em queda");
  }

  // 17. Multi-timeframe confirmation (5x aggregation)
  if (candles.length >= 100) {
    const htfCandles = aggregateCandles(candles, 5);
    const htfTrend = detectTrend(htfCandles, 20);
    if (htfTrend.trend === "uptrend" && bullScore > bearScore) {
      bullScore += 1; breakdown.mtfScore = 1;
      reasons.push("Timeframe superior confirma alta");
    } else if (htfTrend.trend === "downtrend" && bearScore > bullScore) {
      bearScore += 1; breakdown.mtfScore = -1;
      reasons.push("Timeframe superior confirma baixa");
    }
  }

  // === Filters ===

  // Lateral market: if ADX < 8 AND no strong S/R bounce, skip
  if (lastAdx < 8 && !nearLevel) return null;

  // Consolidation filter: if BB is very tight, skip
  const bbWidth = (lastBBUpper - lastBBLower) / lastBBMiddle;
  if (bbWidth < 0.0005) return null;

  // Minimum score threshold
  const maxScore = Math.max(bullScore, bearScore);
  const minScore = Math.min(bullScore, bearScore);
  const scoreDiff = maxScore - minScore;
  
  // Need clear directional bias (relaxed thresholds)
  if (maxScore < 2) return null;
  if (scoreDiff < 1.5) return null;

  const type: SignalType = bullScore > bearScore ? "CALL" : "PUT";

  // Avoid 5+ consecutive same-direction signals
  const recentSame = ctx.history.slice(-4).filter(h => h.type === type).length;
  if (recentSame >= 4) return null;

  // === Confirmation filters ===
  // Require trend alignment with signal direction (only block strong counter-trend)
  if (type === "CALL" && trendInfo.trend === "downtrend" && trendInfo.strength > 0.75) return null;
  if (type === "PUT" && trendInfo.trend === "uptrend" && trendInfo.strength > 0.75) return null;

  // Require at least 2 confirming indicators
  const confirmations = [
    breakdown.trend, breakdown.rsiScore, breakdown.macdScore, breakdown.adxScore,
    breakdown.bbScore, breakdown.stochScore, breakdown.srScore, breakdown.pullbackScore,
    breakdown.pattern, breakdown.volumeScore, breakdown.williamsScore, breakdown.cciScore,
    breakdown.ichimokuScore, breakdown.divergenceScore, breakdown.obvScore, breakdown.mtfScore,
  ].filter(v => (type === "CALL" ? v > 0 : v < 0)).length;
  
  if (confirmations < 2) return null;

  // === Calculate probability ===
  const rawProb = 68 + (scoreDiff / MAX_SCORE) * 22 + (confirmations / 16) * 10 + ctx.adaptiveBonus;
  const probability = Math.min(95, Math.max(65, Math.round(rawProb)));

  // Only show signals with >= 70% probability
  if (probability < 70) return null;

  const totalScore = bullScore + bearScore;
  const probabilityCall = Math.round((bullScore / (totalScore || 1)) * 100);
  const probabilityPut = 100 - probabilityCall;

  const strength: SignalStrength = maxScore >= 6 ? "strong" : maxScore >= 4 ? "medium" : "weak";

  // Recommended expiry based on volatility and timeframe
  const recommendedExpiry = lastAtr > avgRange * 1.5 ? 60 : lastAtr > avgRange ? 120 : 180;

  const now = Date.now();
  const entryTime = now + 60_000;

  const signal: Signal = {
    id: `sig_${lastCandle.time}_${now}`,
    time: lastCandle.time,
    type,
    strength,
    probability,
    probabilityCall,
    probabilityPut,
    score: maxScore,
    maxPossibleScore: MAX_SCORE,
    reasons,
    breakdown,
    expired: false,
    result: "pending",
    expiresAt: lastCandle.time + 120,
    entryTime,
    recommendedExpiry,
    trendDirection: trendInfo.trend,
    patternDetected: pattern?.pattern ?? null,
    srLevels: sr,
  };

  ctx.lastSignalTime = lastCandle.time;
  ctx.lastSignalType = type;

  return signal;
}

export function resetContext() {
  ctx.lastSignalTime = 0;
  ctx.lastSignalType = null;
  ctx.history = [];
  ctx.adaptiveBonus = 0;
}
