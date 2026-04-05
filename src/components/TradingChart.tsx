import { useEffect, useRef, useCallback } from "react";
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData, Time } from "lightweight-charts";
import { Candle } from "@/lib/indicators";
import { Signal } from "@/lib/signalEngine";

export type ChartType = "candles" | "line" | "heikin-ashi";

interface Props {
  candles: Candle[];
  signals: Signal[];
  chartType?: ChartType;
}

function toHeikinAshi(candles: Candle[]): Candle[] {
  if (candles.length === 0) return [];
  const ha: Candle[] = [];
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen = i === 0 ? (c.open + c.close) / 2 : (ha[i - 1].open + ha[i - 1].close) / 2;
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);
    ha.push({ time: c.time, open: haOpen, high: haHigh, low: haLow, close: haClose, volume: c.volume });
  }
  return ha;
}

export default function TradingChart({ candles, signals, chartType = "candles" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const srLinesRef = useRef<any[]>([]);
  const currentChartType = useRef<ChartType>("candles");

  const getActiveSeriesForMarkers = useCallback(() => {
    return candleSeriesRef.current || lineSeriesRef.current;
  }, []);

  const updateMarkers = useCallback(() => {
    const series = getActiveSeriesForMarkers();
    if (!series) return;
    if (!candleSeriesRef.current) return;

    const markers = signals
      .filter((s) => !s.expired || s.result !== "pending")
      .map((s) => ({
        time: s.time as Time,
        position: s.type === "CALL" ? ("belowBar" as const) : ("aboveBar" as const),
        color: s.type === "CALL" ? "#00e676" : "#ff1744",
        shape: s.type === "CALL" ? ("arrowUp" as const) : ("arrowDown" as const),
        text: `${s.type} ${s.probability}%`,
      }));

    markers.sort((a, b) => (a.time as number) - (b.time as number));
    candleSeriesRef.current.setMarkers(markers);
  }, [signals, getActiveSeriesForMarkers]);

  const updateSRLines = useCallback(() => {
    if (!chartRef.current) return;
    const activeSeries = candleSeriesRef.current || lineSeriesRef.current;

    for (const line of srLinesRef.current) {
      try { activeSeries?.removePriceLine(line); } catch {}
    }
    srLinesRef.current = [];

    const latestSignal = signals[signals.length - 1];
    if (!latestSignal?.srLevels) return;

    const { supports, resistances } = latestSignal.srLevels;

    for (const level of supports) {
      const line = activeSeries?.createPriceLine({
        price: level,
        color: "#00e67644",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "S",
      });
      if (line) srLinesRef.current.push(line);
    }

    for (const level of resistances) {
      const line = activeSeries?.createPriceLine({
        price: level,
        color: "#ff174444",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "R",
      });
      if (line) srLinesRef.current.push(line);
    }
  }, [signals]);

  // Create chart once
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { color: "transparent" },
        textColor: "#5a6a8a",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "rgba(0, 200, 255, 0.04)", style: 0 },
        horzLines: { color: "rgba(0, 200, 255, 0.04)", style: 0 },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: "rgba(0, 200, 255, 0.3)", width: 1, style: 0, labelBackgroundColor: "#0a1628" },
        horzLine: { color: "rgba(0, 200, 255, 0.3)", width: 1, style: 0, labelBackgroundColor: "#0a1628" },
      },
      localization: {
        timeFormatter: (time: number) => {
          const d = new Date(time * 1000);
          return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
        },
      },
      timeScale: {
        borderColor: "rgba(0, 200, 255, 0.08)",
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 10,
        tickMarkFormatter: (time: number) => {
          const d = new Date(time * 1000);
          return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
        },
      },
      rightPriceScale: {
        borderColor: "rgba(0, 200, 255, 0.08)",
        scaleMargins: { top: 0.05, bottom: 0.05 },
      },
    });

    chartRef.current = chart;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      lineSeriesRef.current = null;
    };
  }, []);

  // Handle chart type changes and data updates
  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return;

    const chart = chartRef.current;
    const needsRebuild = currentChartType.current !== chartType;

    if (needsRebuild) {
      if (candleSeriesRef.current) {
        chart.removeSeries(candleSeriesRef.current);
        candleSeriesRef.current = null;
      }
      if (lineSeriesRef.current) {
        chart.removeSeries(lineSeriesRef.current);
        lineSeriesRef.current = null;
      }
      srLinesRef.current = [];
      currentChartType.current = chartType;
    }

    const displayCandles = chartType === "heikin-ashi" ? toHeikinAshi(candles) : candles;

    if (chartType === "line") {
      if (!lineSeriesRef.current) {
        lineSeriesRef.current = chart.addLineSeries({
          color: "#00c8ff",
          lineWidth: 2,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 3,
          lastValueVisible: true,
          priceLineVisible: true,
          priceLineColor: "#00c8ff44",
        });
      }
      const lineData: LineData[] = displayCandles.map((c) => ({
        time: c.time as Time,
        value: c.close,
      }));
      lineSeriesRef.current.setData(lineData);
    } else {
      if (!candleSeriesRef.current) {
        const isHA = chartType === "heikin-ashi";
        candleSeriesRef.current = chart.addCandlestickSeries({
          upColor: isHA ? "#00e676" : "#00c853",
          downColor: isHA ? "#ff1744" : "#ff1744",
          borderUpColor: isHA ? "#00e676" : "#00e676",
          borderDownColor: isHA ? "#ff1744" : "#ff1744",
          wickUpColor: isHA ? "#00e67688" : "#00e67688",
          wickDownColor: isHA ? "#ff174488" : "#ff174488",
        });
      }
      const data: CandlestickData[] = displayCandles.map((c) => ({
        time: c.time as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      candleSeriesRef.current.setData(data);
    }

    chart.timeScale().scrollToPosition(2, false);
  }, [candles, chartType]);

  useEffect(() => {
    updateMarkers();
    updateSRLines();
  }, [updateMarkers, updateSRLines]);

  return (
    <div className="w-full h-full min-h-[300px] relative">
      {/* Digital grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: `
            linear-gradient(180deg, rgba(0,15,40,0.95) 0%, rgba(0,8,20,0.98) 100%),
            repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(0,200,255,0.03) 39px, rgba(0,200,255,0.03) 40px),
            repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(0,200,255,0.03) 39px, rgba(0,200,255,0.03) 40px)
          `,
        }}
      />
      {/* Glow accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[2px] pointer-events-none z-0"
        style={{ background: "linear-gradient(90deg, transparent, rgba(0,200,255,0.15), transparent)" }}
      />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[40%] h-[1px] pointer-events-none z-0"
        style={{ background: "linear-gradient(90deg, transparent, rgba(0,200,255,0.1), transparent)" }}
      />
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none z-0 border-t border-l" style={{ borderColor: "rgba(0,200,255,0.12)" }} />
      <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none z-0 border-t border-r" style={{ borderColor: "rgba(0,200,255,0.12)" }} />
      <div className="absolute bottom-0 left-0 w-8 h-8 pointer-events-none z-0 border-b border-l" style={{ borderColor: "rgba(0,200,255,0.12)" }} />
      <div className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none z-0 border-b border-r" style={{ borderColor: "rgba(0,200,255,0.12)" }} />
      {/* Chart container */}
      <div ref={containerRef} className="relative z-10 w-full h-full" />
    </div>
  );
}
