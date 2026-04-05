import { Signal, recordResult } from "@/lib/signalEngine";
import { ArrowUp, ArrowDown, Clock, TrendingUp, TrendingDown, Minus, Shield, Zap, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface Props {
  signal: Signal | null;
  countdown: number;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const abs = Math.abs(value);
  const pct = (abs / max) * 100;
  const isBull = value > 0;
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="w-16 text-muted-foreground truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isBull ? "bg-signal-call" : "bg-signal-put"}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <span className={`w-6 text-right font-mono ${isBull ? "text-signal-call" : "text-signal-put"}`}>
        {abs > 0 ? abs.toFixed(1) : "—"}
      </span>
    </div>
  );
}

export default function ActiveSignal({ signal, countdown }: Props) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!signal) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [signal]);

  if (!signal) {
    return (
      <div className="glass-panel rounded-lg p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <p className="text-muted-foreground text-sm font-medium">Aguardando sinal</p>
        </div>
        <div className="flex items-center justify-center gap-1">
          <span className="w-2 h-2 rounded-full bg-signal-neutral animate-pulse" />
          <span className="text-xs text-muted-foreground">Analisando 11 indicadores...</span>
        </div>
      </div>
    );
  }

  const isCall = signal.type === "CALL";
  const secsToEntry = Math.max(0, Math.ceil((signal.entryTime - now) / 1000));
  const enteredAlready = secsToEntry === 0;
  const TrendIcon = signal.trendDirection === "uptrend" ? TrendingUp : signal.trendDirection === "downtrend" ? TrendingDown : Minus;
  const trendLabel = signal.trendDirection === "uptrend" ? "Alta" : signal.trendDirection === "downtrend" ? "Baixa" : "Lateral";
  const b = signal.breakdown;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={signal.id}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className={`rounded-lg p-3 border-2 ${
          isCall ? "border-signal-call bg-signal-call/10" : "border-signal-put bg-signal-put/10"
        }`}
      >
        {/* Header: Direction + Probability */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isCall ? (
              <ArrowUp className="w-7 h-7 text-signal-call signal-glow-call" />
            ) : (
              <ArrowDown className="w-7 h-7 text-signal-put signal-glow-put" />
            )}
            <div>
              <span className={`text-lg font-bold ${isCall ? "text-signal-call" : "text-signal-put"}`}>
                {signal.type}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <TrendIcon className="w-3 h-3" />
                <span>{trendLabel}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-mono font-bold ${isCall ? "text-signal-call" : "text-signal-put"}`}>
              {signal.probability}%
            </span>
            <div className="flex items-center gap-1 text-[10px]">
              <Zap className="w-3 h-3 text-signal-neutral" />
              <span className="text-muted-foreground">
                {signal.strength === "strong" ? "Forte" : signal.strength === "medium" ? "Médio" : "Fraco"}
              </span>
            </div>
          </div>
        </div>

        {/* CALL vs PUT probability bar */}
        <div className="mb-2">
          <div className="flex justify-between text-[10px] font-mono mb-0.5">
            <span className="text-signal-call">CALL {signal.probabilityCall}%</span>
            <span className="text-signal-put">PUT {signal.probabilityPut}%</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
            <div className="bg-signal-call transition-all" style={{ width: `${signal.probabilityCall}%` }} />
            <div className="bg-signal-put transition-all" style={{ width: `${signal.probabilityPut}%` }} />
          </div>
        </div>

        {/* Entry time */}
        <div className={`flex items-center justify-center gap-2 py-2 my-2 rounded ${
          enteredAlready ? "bg-primary/15" : "bg-accent/30"
        }`}>
          <Clock className="w-4 h-4 text-primary" />
          {enteredAlready ? (
            <span className="text-sm font-bold text-primary animate-pulse">
              ⏱ ENTRADA AGORA — {formatTime(signal.entryTime)}
            </span>
          ) : (
            <span className="text-sm font-mono text-foreground">
              Entrada às <span className="font-bold text-primary">{formatTime(signal.entryTime)}</span>
              <span className="text-muted-foreground ml-2">({secsToEntry}s)</span>
            </span>
          )}
        </div>

        {/* Recommended expiry */}
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Target className="w-3 h-3" />
            <span>Expiração: <span className="text-foreground font-mono">{signal.recommendedExpiry}s</span></span>
          </div>
          <span className="font-mono text-muted-foreground">
            Score: {signal.score.toFixed(1)}/{signal.maxPossibleScore}
          </span>
        </div>

        {/* Score breakdown */}
        <div className="space-y-0.5 mb-2">
          <ScoreBar label="Tendência" value={b.trend} max={1.5} />
          <ScoreBar label="RSI" value={b.rsiScore} max={1.5} />
          <ScoreBar label="MACD" value={b.macdScore} max={1} />
          <ScoreBar label="ADX" value={b.adxScore} max={1} />
          <ScoreBar label="Bollinger" value={b.bbScore} max={1} />
          <ScoreBar label="Stochastic" value={b.stochScore} max={1} />
          <ScoreBar label="Suporte/Res" value={b.srScore} max={1} />
          <ScoreBar label="Pullback" value={b.pullbackScore} max={1} />
          <ScoreBar label="Simetria" value={b.symmetryScore} max={0.5} />
          <ScoreBar label="Padrão" value={b.pattern} max={0.85} />
          <ScoreBar label="Volume" value={b.volumeScore} max={0.5} />
        </div>

        {/* Reasons tags */}
        <div className="flex flex-wrap gap-1">
          {signal.reasons.map((r, i) => (
            <span key={i} className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">
              {r}
            </span>
          ))}
        </div>

        {/* Countdown */}
        <div className="mt-2 text-center text-xs text-muted-foreground font-mono">
          {countdown > 0 ? `Expira em ${countdown}s` : "Expirado"}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
