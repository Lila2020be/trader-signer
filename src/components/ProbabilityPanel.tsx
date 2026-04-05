import { Candle, ema, rsi, macd, bollingerBands, stochastic, detectTrend, findSupportResistance, williamsR, cci, ichimoku, detectRsiDivergence, obvTrend } from "@/lib/indicators";
import { ArrowUp, ArrowDown, Activity } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  candles: Candle[];
}

export interface LiveProbability {
  call: number;
  put: number;
  dominantForce: "bull" | "bear" | "neutral";
  microTrend: string;
}

export function calculateLiveProbability(candles: Candle[]): LiveProbability {
  if (candles.length < 52) return { call: 50, put: 50, dominantForce: "neutral", microTrend: "Lateral" };

  const closes = candles.map(c => c.close);
  const last = (arr: number[]) => arr[arr.length - 1];

  const ema9 = ema(closes, 9);
  const ema20 = ema(closes, 20);
  const rsiValues = rsi(closes, 14);
  const macdData = macd(closes);
  const bb = bollingerBands(closes, 20, 2);
  const stoch = stochastic(candles, 14, 3);
  const trend = detectTrend(candles, 20);
  const wrValues = williamsR(candles, 14);
  const cciValues = cci(candles, 20);
  const ichi = ichimoku(candles);
  const divergence = detectRsiDivergence(candles, rsiValues, 20);
  const obvDir = obvTrend(candles, 10);

  let bullPoints = 0;
  let bearPoints = 0;

  // 1. EMA crossover
  if (last(ema9) > last(ema20)) bullPoints += 1; else bearPoints += 1;

  // 2. RSI
  const lastRsi = last(rsiValues);
  if (lastRsi < 30) bullPoints += 1.5;
  else if (lastRsi < 45) bullPoints += 0.5;
  else if (lastRsi > 70) bearPoints += 1.5;
  else if (lastRsi > 55) bearPoints += 0.5;

  // 3. MACD histogram
  if (last(macdData.histogram) > 0) bullPoints += 1; else bearPoints += 1;

  // 4. Bollinger position
  const lastClose = closes[closes.length - 1];
  const bbRange = last(bb.upper) - last(bb.lower);
  const bbPos = bbRange > 0 ? (lastClose - last(bb.lower)) / bbRange : 0.5;
  if (bbPos < 0.2) bullPoints += 1;
  else if (bbPos > 0.8) bearPoints += 1;

  // 5. Stochastic
  if (last(stoch.k) < 20) bullPoints += 1;
  else if (last(stoch.k) > 80) bearPoints += 1;

  // 6. Trend
  if (trend.trend === "uptrend") bullPoints += 1;
  else if (trend.trend === "downtrend") bearPoints += 1;

  // 7. Last 3 candles momentum
  const last3 = candles.slice(-3);
  const bullCandles = last3.filter(c => c.close > c.open).length;
  if (bullCandles >= 2) bullPoints += 0.5;
  else if (bullCandles <= 1) bearPoints += 0.5;

  // 8. Williams %R
  const lastWR = last(wrValues);
  if (lastWR < -80) bullPoints += 1;
  else if (lastWR > -20) bearPoints += 1;

  // 9. CCI
  const lastCCI = last(cciValues);
  if (lastCCI < -100) bullPoints += 1;
  else if (lastCCI > 100) bearPoints += 1;

  // 10. Ichimoku
  if (ichi.signal === "bull") bullPoints += 1;
  else if (ichi.signal === "bear") bearPoints += 1;

  // 11. RSI Divergence
  if (divergence.type === "bullish_div") bullPoints += 1.5;
  else if (divergence.type === "bearish_div") bearPoints += 1.5;

  // 12. OBV
  if (obvDir === "rising") bullPoints += 0.5;
  else if (obvDir === "falling") bearPoints += 0.5;

  // Calculate percentages
  const totalPoints = bullPoints + bearPoints || 1;
  const callPct = Math.round((bullPoints / totalPoints) * 100);
  const putPct = 100 - callPct;

  const dominantForce: "bull" | "bear" | "neutral" = 
    callPct > 55 ? "bull" : putPct > 55 ? "bear" : "neutral";

  const microTrend = trend.trend === "uptrend" ? "Alta" : trend.trend === "downtrend" ? "Baixa" : "Lateral";

  return { call: callPct, put: putPct, dominantForce, microTrend };
}

export default function ProbabilityPanel({ candles }: Props) {
  const prob = calculateLiveProbability(candles);

  return (
    <div className="glass-panel rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Activity className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-bold text-foreground">Probabilidade em Tempo Real</span>
        <span className="ml-auto text-[10px] text-muted-foreground font-mono">
          Tendência: {prob.microTrend}
        </span>
      </div>

      {/* CALL probability */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ArrowUp className="w-4 h-4 text-signal-call" />
            <span className="text-xs font-bold text-signal-call">CALL</span>
          </div>
          <motion.span
            key={prob.call}
            initial={{ scale: 1.2, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-lg font-mono font-bold text-signal-call"
          >
            {prob.call}%
          </motion.span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-signal-call"
            initial={false}
            animate={{ width: `${prob.call}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* PUT probability */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ArrowDown className="w-4 h-4 text-signal-put" />
            <span className="text-xs font-bold text-signal-put">PUT</span>
          </div>
          <motion.span
            key={prob.put}
            initial={{ scale: 1.2, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-lg font-mono font-bold text-signal-put"
          >
            {prob.put}%
          </motion.span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-signal-put"
            initial={false}
            animate={{ width: `${prob.put}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Dominant force indicator */}
      <div className={`text-center py-1.5 rounded text-[11px] font-bold ${
        prob.dominantForce === "bull" 
          ? "bg-signal-call/15 text-signal-call" 
          : prob.dominantForce === "bear"
          ? "bg-signal-put/15 text-signal-put"
          : "bg-secondary text-muted-foreground"
      }`}>
        {prob.dominantForce === "bull" 
          ? "🟢 Força Compradora Dominante" 
          : prob.dominantForce === "bear"
          ? "🔴 Força Vendedora Dominante"
          : "⚪ Mercado Neutro"}
      </div>
    </div>
  );
}
