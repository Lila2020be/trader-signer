import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { toast } from "sonner";
import { Candle } from "@/lib/indicators";
import { Asset, allAssets, generateHistoricalCandles } from "@/lib/marketData";
import { Signal, analyzeCandles, resetContext, recordResult } from "@/lib/signalEngine";
import { isBinanceAsset, fetchBinanceCandles, fetchBinancePrice } from "@/lib/binanceApi";
import { analyzeMovican } from "@/lib/movicanStrategy";
import TradingChart, { ChartType } from "@/components/TradingChart";
import ActiveSignal from "@/components/ActiveSignal";
import ProbabilityPanel from "@/components/ProbabilityPanel";
import SignalHistory from "@/components/SignalHistory";
import SignalStats from "@/components/SignalStats";
import AssetSelector from "@/components/AssetSelector";
import BankrollManager from "@/components/BankrollManager";
import { Activity, Volume2, VolumeX, Wifi, Shield, Search, Loader2, CandlestickChart, LineChart, BarChart3, LogOut, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

export type Timeframe = { label: string; seconds: number };

const TIMEFRAMES: Timeframe[] = [
  { label: "M1", seconds: 60 },
  { label: "M5", seconds: 300 },
  { label: "M15", seconds: 900 },
  { label: "1H", seconds: 3600 },
];

export default function TradingPage() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const [asset, setAsset] = useState<Asset>(allAssets[0]);
  const [timeframe, setTimeframe] = useState<Timeframe>(TIMEFRAMES[0]);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [activeSignal, setActiveSignal] = useState<Signal | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [searchCountdown, setSearchCountdown] = useState(0);
  const [chartType, setChartType] = useState<ChartType>("candles");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [isRealData, setIsRealData] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);

  // Load candles — real from Binance for crypto, simulated for others
  useEffect(() => {
    resetContext();
    setSignals([]);
    setActiveSignal(null);
    setSearchCountdown(0);
    setLoading(true);

    const useBinance = isBinanceAsset(asset.id);

    if (useBinance) {
      fetchBinanceCandles(asset.id, timeframe.seconds, 250)
        .then((data) => {
          setCandles(data);
          setIsRealData(true);
          setCurrentPrice(data[data.length - 1]?.close ?? 0);
          setLoading(false);
        })
        .catch((err) => {
          console.warn("Binance API failed, using simulated data:", err);
          const historical = generateHistoricalCandles(asset, 250, timeframe.seconds);
          setCandles(historical);
          setIsRealData(false);
          setCurrentPrice(historical[historical.length - 1]?.close ?? 0);
          setLoading(false);
        });
    } else {
      const historical = generateHistoricalCandles(asset, 250, timeframe.seconds);
      setCandles(historical);
      setIsRealData(false);
      setCurrentPrice(historical[historical.length - 1]?.close ?? 0);
      setLoading(false);
    }
  }, [asset, timeframe]);

  const playBeep = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioRef.current) audioRef.current = new AudioContext();
      const ctx = audioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }, [soundEnabled]);

  // Real-time updates
  const tickRef = useRef(0);

  useEffect(() => {
    if (candles.length === 0 || loading) return;

    const useBinance = isBinanceAsset(asset.id) && isRealData;
    const volatility = asset.basePrice * 0.0003;
    const tfSeconds = timeframe.seconds;

    const now = Math.floor(Date.now() / 1000);
    const elapsed = now % tfSeconds;
    tickRef.current = elapsed;

    // For Binance assets, periodically refetch real candles
    let binanceInterval: ReturnType<typeof setInterval> | null = null;
    if (useBinance) {
      binanceInterval = setInterval(() => {
        fetchBinanceCandles(asset.id, timeframe.seconds, 250)
          .then((data) => {
            setCandles(data);
            const lastPrice = data[data.length - 1]?.close ?? 0;
            setCurrentPrice(lastPrice);
            setPriceChange(lastPrice - (data[data.length - 1]?.open ?? 0));
          })
          .catch(() => {}); // silently ignore refresh errors
      }, 5000); // refresh every 5s for real-time feel
    }

    // For simulated assets, keep the tick-based simulation
    let simInterval: ReturnType<typeof setInterval> | null = null;
    if (!useBinance) {
      simInterval = setInterval(() => {
        tickRef.current += 1;

        setCandles((prev) => {
          const lastCandle = prev[prev.length - 1];

          if (tickRef.current >= tfSeconds) {
            tickRef.current = 0;
            const newOpen = lastCandle.close;
            const recentSlice = prev.slice(-10);
            const momentum = recentSlice.length >= 2
              ? (recentSlice[recentSlice.length - 1].close - recentSlice[0].close) / (recentSlice.length * volatility)
              : 0;
            const tick = momentum * volatility * 0.3 + (Math.random() - 0.5) * volatility;
            const newClose = newOpen + tick;
            const newCandle: Candle = {
              time: lastCandle.time + tfSeconds,
              open: newOpen,
              high: Math.max(newOpen, newClose),
              low: Math.min(newOpen, newClose),
              close: newClose,
              volume: Math.round(1000 + Math.random() * 5000),
            };
            const updated = [...prev, newCandle];
            if (updated.length > 500) updated.splice(0, updated.length - 500);

            setCurrentPrice(newClose);
            setPriceChange(newClose - newOpen);
            return updated;
          } else {
            const recentSlice = prev.slice(-10);
            const momentum = recentSlice.length >= 2
              ? (recentSlice[recentSlice.length - 1].close - recentSlice[0].close) / (recentSlice.length * volatility)
              : 0;
            const tick = momentum * volatility * 0.1 + (Math.random() - 0.5) * volatility * 0.4;
            const newClose = lastCandle.close + tick;
            const updatedCandle: Candle = {
              ...lastCandle,
              close: newClose,
              high: Math.max(lastCandle.high, newClose),
              low: Math.min(lastCandle.low, newClose),
              volume: lastCandle.volume + Math.round(Math.random() * 100),
            };

            const updated = [...prev.slice(0, -1), updatedCandle];
            setCurrentPrice(newClose);
            setPriceChange(newClose - lastCandle.open);
            return updated;
          }
        });
      }, 1000);
    }

    return () => {
      if (binanceInterval) clearInterval(binanceInterval);
      if (simInterval) clearInterval(simInterval);
    };
  }, [candles.length, asset, timeframe, loading, isRealData]);

  const [searching, setSearching] = useState(false);

  const handleSearchSignal = useCallback(() => {
    if (activeSignal || searching) return;
    setSearching(true);
    setSearchCountdown(60);

    // Use MOVICAN strategy first, fallback to classic signal engine
    const movicanResult = analyzeMovican(candles);
    const classicSignal = analyzeCandles(candles);
    
    setTimeout(() => {
      setSearching(false);

      // Combine MOVICAN with classic analysis
      if (movicanResult && classicSignal) {
        // Both agree — high confidence
        if (movicanResult.direction === classicSignal.type) {
          classicSignal.probability = Math.min(95, classicSignal.probability + 5);
          classicSignal.reasons = [
            `MOVICAN: ${movicanResult.patterns.join(", ") || "MA Confluência"}`,
            ...classicSignal.reasons,
          ];
        }
        playBeep();
        setActiveSignal(classicSignal);
        setCountdown(60);
        setSignals((s) => [...s, classicSignal]);
      } else if (movicanResult) {
        // Only MOVICAN found a signal — create one from it
        const now = Date.now();
        const lastCandle = candles[candles.length - 1];
        const signal: Signal = {
          id: `mov_${lastCandle.time}_${now}`,
          time: lastCandle.time,
          type: movicanResult.direction,
          strength: movicanResult.strength >= 80 ? "strong" : movicanResult.strength >= 65 ? "medium" : "weak",
          probability: movicanResult.strength,
          probabilityCall: movicanResult.direction === "CALL" ? movicanResult.strength : 100 - movicanResult.strength,
          probabilityPut: movicanResult.direction === "PUT" ? movicanResult.strength : 100 - movicanResult.strength,
          score: movicanResult.maScore + movicanResult.candleScore,
          maxPossibleScore: 12,
          reasons: movicanResult.reasons,
          breakdown: {
            trend: movicanResult.maScore, pattern: movicanResult.candleScore,
            rsiScore: 0, macdScore: 0, adxScore: 0, bbScore: 0, stochScore: 0,
            srScore: 0, pullbackScore: 0, symmetryScore: 0, volumeScore: 0,
            williamsScore: 0, cciScore: 0, ichimokuScore: 0, divergenceScore: 0,
            obvScore: 0, mtfScore: 0,
          },
          expired: false,
          result: "pending",
          expiresAt: lastCandle.time + 60,
          entryTime: now + 60_000,
          recommendedExpiry: 60,
          trendDirection: "lateral",
          patternDetected: movicanResult.patterns[0] || null,
          srLevels: { supports: [], resistances: [] },
        };
        playBeep();
        setActiveSignal(signal);
        setCountdown(60);
        setSignals((s) => [...s, signal]);
      } else if (classicSignal) {
        playBeep();
        setActiveSignal(classicSignal);
        setCountdown(60);
        setSignals((s) => [...s, classicSignal]);
      } else {
        setSearchCountdown(0);
        toast.info("Nenhuma entrada encontrada. Tente novamente em alguns segundos.");
      }
    }, 1500);
  }, [candles, activeSignal, searching, playBeep]);

  // Search countdown timer (60s)
  useEffect(() => {
    if (searchCountdown <= 0) return;
    const timer = setInterval(() => {
      setSearchCountdown((c) => {
        if (c <= 1) return 0;
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [searchCountdown]);

  // Track entry price for signal validation
  const entryPriceRef = useRef<number>(0);

  useEffect(() => {
    if (activeSignal) {
      entryPriceRef.current = currentPrice;
    }
  }, [activeSignal?.id]);

  useEffect(() => {
    if (!activeSignal || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          const entryPrice = entryPriceRef.current;
          const exitPrice = currentPrice;
          const priceMoved = exitPrice - entryPrice;
          
          let win: boolean;
          if (activeSignal.type === "CALL") {
            win = priceMoved > 0;
          } else {
            win = priceMoved < 0;
          }
          
          if (priceMoved === 0) win = false;

          const result = win ? "win" as const : "loss" as const;
          recordResult(activeSignal.type, result);
          setSignals((prev) =>
            prev.map((s) =>
              s.id === activeSignal.id ? { ...s, expired: true, result } : s
            )
          );
          setActiveSignal(null);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeSignal, countdown, currentPrice]);

  const priceDecimals = asset.basePrice < 10 ? 5 : asset.basePrice < 100 ? 3 : 2;
  const completedSignals = signals.filter(s => s.result !== "pending");
  const winRate = completedSignals.length > 0
    ? Math.round((completedSignals.filter(s => s.result === "win").length / completedSignals.length) * 100)
    : 0;

  const formatCandleTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m > 0) return `${m}:${s.toString().padStart(2, "0")}`;
    return `${s}`;
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header - Mobile Responsive */}
      <header className="po-header px-2 sm:px-3 py-1.5 sm:py-2">
        {/* Top row: logo, asset, price, user */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-xs sm:text-sm font-bold text-foreground tracking-tight hidden sm:inline">TradingSignals</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <AssetSelector selected={asset} onSelect={setAsset} />
            {isRealData && (
              <span className="text-[8px] sm:text-[9px] font-mono px-1 py-0.5 rounded bg-primary/15 text-primary shrink-0">
                BINANCE
              </span>
            )}
            <button
              onClick={handleSearchSignal}
              disabled={!!activeSignal || searching}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md font-bold text-[10px] sm:text-xs flex items-center gap-1 sm:gap-1.5 transition-all shrink-0 ${
                activeSignal || searching
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
              }`}
            >
              {searching ? (
                <>
                  <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Analisando...</span>
                </>
              ) : (
                <>
                  <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Buscar Entrada</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className={`text-sm sm:text-lg font-mono font-bold ${priceChange >= 0 ? "text-primary" : "text-destructive"}`}>
                {currentPrice.toFixed(priceDecimals)}
              </span>
              <span className={`text-[9px] sm:text-[10px] font-mono px-1 py-0.5 rounded hidden sm:inline ${
                priceChange >= 0 ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
              }`}>
                {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(priceDecimals)}
              </span>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1 sm:p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="p-1 sm:p-1.5 rounded bg-primary/10 hover:bg-primary/20 transition-colors text-primary flex items-center gap-1 font-bold text-xs border border-primary/20"
                title="Acessar Painel VIP"
              >
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
            <button
              onClick={signOut}
              className="p-1 sm:p-1.5 rounded hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive"
              title="Sair"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Bottom row: timeframe, chart type, indicators */}
        <div className="flex items-center justify-between gap-2 mt-1.5">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Timeframe selector */}
            <div className="flex items-center gap-0.5 bg-secondary/50 rounded-md p-0.5">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.label}
                  onClick={() => setTimeframe(tf)}
                  className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-[11px] font-mono font-bold transition-all ${
                    timeframe.label === tf.label
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Chart type selector */}
            <div className="flex items-center gap-0.5 bg-secondary/50 rounded-md p-0.5">
              {([
                { type: "candles" as ChartType, icon: CandlestickChart, label: "Velas" },
                { type: "line" as ChartType, icon: LineChart, label: "Linha" },
                { type: "heikin-ashi" as ChartType, icon: BarChart3, label: "HA" },
              ]).map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-[11px] font-mono font-bold transition-all flex items-center gap-0.5 sm:gap-1 ${
                    chartType === type
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title={label}
                >
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden xl:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Wifi className="w-3 h-3 text-primary" />
              <span className="text-[9px] sm:text-[10px] font-mono">{isRealData ? "REAL" : "SIM"}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1">
              <Shield className="w-3 h-3 text-signal-neutral" />
              <span className="text-[10px] font-mono">MOVICAN</span>
            </div>
            {completedSignals.length > 0 && (
              <span className={`text-[9px] sm:text-[10px] font-mono px-1 py-0.5 rounded ${
                winRate >= 60 ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
              }`}>
                WR: {winRate}%
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      {/* Main */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Chart */}
        <div className="flex-1 relative min-h-[200px] sm:min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Carregando dados{isRealData ? " da Binance" : ""}...</span>
            </div>
          ) : (
            <TradingChart candles={candles} signals={signals} chartType={chartType} />
          )}

          {/* Search countdown timer */}
          {(searching || searchCountdown > 0) && (
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-2">
              <div className="bg-card/90 border border-border rounded px-2 py-1 sm:px-2.5 sm:py-1.5 flex items-center gap-2">
                <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono">Buscando</span>
                <div className="w-px h-3 bg-border" />
                <span className={`text-xs sm:text-sm font-mono font-bold tabular-nums ${
                  searchCountdown <= 5 ? "text-destructive animate-pulse" : "text-foreground"
                }`}>
                  {formatCandleTimer(searchCountdown)}
                </span>
              </div>
            </div>
          )}

          {asset.payout && (
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-card/90 border border-border rounded px-1.5 py-0.5 sm:px-2 sm:py-1">
              <span className="text-[9px] sm:text-[10px] text-muted-foreground">Payout: </span>
              <span className="text-[10px] sm:text-xs font-mono font-bold text-primary">{asset.payout}%</span>
            </div>
          )}
        </div>

        {/* Sidebar - scrollable on mobile */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border p-2 sm:p-2.5 space-y-2 sm:space-y-2.5 overflow-y-auto flex-shrink-0 max-h-[50vh] lg:max-h-none" style={{ background: "hsl(220 22% 7%)" }}>
          {isAdmin && <BankrollManager signals={signals} />}
          <ProbabilityPanel candles={candles} />
          <ActiveSignal signal={activeSignal} countdown={countdown} />
          <SignalStats signals={signals} />
          <SignalHistory signals={signals} />
        </div>
      </div>
    </div>
  );
}
