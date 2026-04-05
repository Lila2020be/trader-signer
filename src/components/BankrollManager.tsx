import { useState, useEffect, useMemo } from "react";
import { Wallet, TrendingUp, TrendingDown, Target, DollarSign, AlertTriangle, Trophy, RotateCcw, Check, X } from "lucide-react";

interface BankrollManagerProps {
  signals: { result?: "win" | "loss" | "pending" }[];
}

type EntryResult = "win" | "loss" | null;

interface EntryRow {
  result: EntryResult;
}

const TOTAL_ENTRIES = 10;

export default function BankrollManager({ signals }: BankrollManagerProps) {
  const [initialBankroll, setInitialBankroll] = useState(() => {
    const saved = localStorage.getItem("bm_initial");
    return saved ? Number(saved) : 100;
  });
  const [entryValue, setEntryValue] = useState(() => {
    const saved = localStorage.getItem("bm_entry");
    return saved ? Number(saved) : 2;
  });
  const [stopLoss, setStopLoss] = useState(() => {
    const saved = localStorage.getItem("bm_stoploss");
    return saved ? Number(saved) : 20;
  });
  const [payout, setPayout] = useState(() => {
    const saved = localStorage.getItem("bm_payout");
    return saved ? Number(saved) : 87;
  });
  const [dailyTarget, setDailyTarget] = useState(() => {
    const saved = localStorage.getItem("bm_target");
    return saved ? Number(saved) : 10;
  });
  const [editing, setEditing] = useState(false);

  const [entries, setEntries] = useState<EntryRow[]>(() => {
    const saved = localStorage.getItem("bm_entries");
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return Array.from({ length: TOTAL_ENTRIES }, () => ({ result: null }));
  });

  // Save settings
  useEffect(() => {
    localStorage.setItem("bm_initial", String(initialBankroll));
    localStorage.setItem("bm_entry", String(entryValue));
    localStorage.setItem("bm_stoploss", String(stopLoss));
    localStorage.setItem("bm_payout", String(payout));
    localStorage.setItem("bm_target", String(dailyTarget));
  }, [initialBankroll, entryValue, stopLoss, payout, dailyTarget]);

  useEffect(() => {
    localStorage.setItem("bm_entries", JSON.stringify(entries));
  }, [entries]);

  const toggleResult = (index: number, result: EntryResult) => {
    setEntries(prev => prev.map((e, i) => {
      if (i !== index) return e;
      return { result: e.result === result ? null : result };
    }));
  };

  // Auto-calculate from entries
  const calculations = useMemo(() => {
    let balance = initialBankroll;
    const rows = entries.map((entry, i) => {
      const balanceBefore = balance;
      let profit = 0;
      if (entry.result === "win") {
        profit = entryValue * (payout / 100);
      } else if (entry.result === "loss") {
        profit = -entryValue;
      }
      balance += profit;
      return {
        ...entry,
        index: i,
        balanceBefore,
        profit,
        balanceAfter: balance,
      };
    });

    const totalProfit = balance - initialBankroll;
    const profitPercent = initialBankroll > 0 ? (totalProfit / initialBankroll) * 100 : 0;
    const targetAmount = initialBankroll * (dailyTarget / 100);
    const targetProgress = targetAmount > 0 ? Math.min(100, (totalProfit / targetAmount) * 100) : 0;
    const wins = entries.filter(e => e.result === "win").length;
    const losses = entries.filter(e => e.result === "loss").length;
    const stopLossHit = totalProfit <= -stopLoss;
    const targetHit = totalProfit >= targetAmount;

    return { rows, balance, totalProfit, profitPercent, targetAmount, targetProgress, wins, losses, stopLossHit, targetHit };
  }, [entries, initialBankroll, entryValue, payout, stopLoss, dailyTarget]);

  const handleReset = () => {
    setEntries(Array.from({ length: TOTAL_ENTRIES }, () => ({ result: null })));
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5">
          <Wallet className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">Gerenciamento</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditing(!editing)}
            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            {editing ? "Salvar" : "Editar"}
          </button>
          <button
            onClick={handleReset}
            className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
            title="Resetar dia"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Alerts */}
      {calculations.stopLossHit && (
        <div className="mx-2 mt-2 px-2 py-1.5 rounded bg-destructive/15 border border-destructive/30 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
          <span className="text-[10px] font-bold text-destructive">STOP LOSS ATINGIDO!</span>
        </div>
      )}
      {calculations.targetHit && (
        <div className="mx-2 mt-2 px-2 py-1.5 rounded bg-primary/15 border border-primary/30 flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-bold text-primary">META BATIDA! 🎯</span>
        </div>
      )}

      <div className="p-2 space-y-2">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="bg-secondary/30 rounded p-2">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider block">Banca Atual</span>
            <span className="text-sm font-mono font-bold text-foreground">
              $ {calculations.balance.toFixed(2)}
            </span>
          </div>
          <div className="bg-secondary/30 rounded p-2">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider block">Lucro do Dia</span>
            <span className={`text-sm font-mono font-bold ${calculations.totalProfit >= 0 ? "text-primary" : "text-destructive"}`}>
              {calculations.totalProfit >= 0 ? "+" : ""}$ {calculations.totalProfit.toFixed(2)}
            </span>
            <span className={`text-[9px] font-mono ml-1 ${calculations.profitPercent >= 0 ? "text-primary" : "text-destructive"}`}>
              ({calculations.profitPercent >= 0 ? "+" : ""}{calculations.profitPercent.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Target Bar */}
        <div className="bg-secondary/30 rounded p-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3 text-primary" />
              <span className="text-[9px] text-muted-foreground uppercase">Meta {dailyTarget}%</span>
            </div>
            <span className="text-[10px] font-mono text-foreground">
              $ {calculations.totalProfit.toFixed(2)} / $ {calculations.targetAmount.toFixed(2)}
            </span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                calculations.targetHit ? "bg-primary" : calculations.totalProfit < 0 ? "bg-destructive" : "bg-primary/70"
              }`}
              style={{ width: `${Math.max(0, calculations.targetProgress)}%` }}
            />
          </div>
        </div>

        {/* Entries Table */}
        <div className="bg-secondary/20 rounded overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-0 text-[9px] font-mono uppercase text-muted-foreground border-b border-border px-2 py-1.5">
            <span className="w-16">#</span>
            <span className="text-center">Resultado</span>
            <span className="text-right">Lucro</span>
            <span className="text-right">Saldo</span>
          </div>
          {calculations.rows.map((row) => (
            <div
              key={row.index}
              className={`grid grid-cols-[auto_1fr_1fr_1fr] gap-0 items-center px-2 py-1 border-b border-border/30 last:border-0 ${
                row.result === "win" ? "bg-primary/5" : row.result === "loss" ? "bg-destructive/5" : ""
              }`}
            >
              <span className="text-[10px] font-mono text-muted-foreground w-16">
                Entrada {row.index + 1}
              </span>
              <div className="flex items-center justify-center gap-1">
                <button
                  onClick={() => toggleResult(row.index, "win")}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 transition-all ${
                    row.result === "win"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-muted-foreground hover:bg-primary/20"
                  }`}
                >
                  <Check className="w-2.5 h-2.5" />
                  W
                </button>
                <button
                  onClick={() => toggleResult(row.index, "loss")}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 transition-all ${
                    row.result === "loss"
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-secondary/50 text-muted-foreground hover:bg-destructive/20"
                  }`}
                >
                  <X className="w-2.5 h-2.5" />
                  L
                </button>
              </div>
              <span className={`text-[10px] font-mono text-right ${
                row.profit > 0 ? "text-primary" : row.profit < 0 ? "text-destructive" : "text-muted-foreground"
              }`}>
                {row.result ? (row.profit >= 0 ? "+" : "") + "$ " + row.profit.toFixed(2) : "—"}
              </span>
              <span className="text-[10px] font-mono text-right text-foreground">
                {row.result ? "$ " + row.balanceAfter.toFixed(2) : "—"}
              </span>
            </div>
          ))}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-1.5">
          <div className="bg-secondary/30 rounded p-1.5 text-center">
            <span className="text-[9px] text-muted-foreground block">Trades</span>
            <span className="text-xs font-mono font-bold text-foreground">{calculations.wins + calculations.losses}</span>
          </div>
          <div className="bg-secondary/30 rounded p-1.5 text-center">
            <div className="flex items-center justify-center gap-0.5">
              <TrendingUp className="w-2.5 h-2.5 text-primary" />
              <span className="text-[9px] text-primary">Win</span>
            </div>
            <span className="text-xs font-mono font-bold text-primary">{calculations.wins}</span>
          </div>
          <div className="bg-secondary/30 rounded p-1.5 text-center">
            <div className="flex items-center justify-center gap-0.5">
              <TrendingDown className="w-2.5 h-2.5 text-destructive" />
              <span className="text-[9px] text-destructive">Loss</span>
            </div>
            <span className="text-xs font-mono font-bold text-destructive">{calculations.losses}</span>
          </div>
        </div>

        {/* Editable Settings */}
        {editing && (
          <div className="space-y-1.5 border-t border-border pt-2">
            {[
              { label: "Banca Inicial", value: initialBankroll, setter: setInitialBankroll, icon: DollarSign },
              { label: "Valor Entrada", value: entryValue, setter: setEntryValue, icon: DollarSign },
              { label: "Stop Loss ($)", value: stopLoss, setter: setStopLoss, icon: AlertTriangle },
              { label: "Payout (%)", value: payout, setter: setPayout, icon: TrendingUp },
              { label: "Meta Diária (%)", value: dailyTarget, setter: setDailyTarget, icon: Target },
            ].map(({ label, value, setter, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between">
                <label className="text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Icon className="w-3 h-3" /> {label}
                </label>
                <input
                  type="number"
                  value={value}
                  onChange={e => setter(Number(e.target.value))}
                  className="w-24 text-right text-xs font-mono bg-secondary/50 border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            ))}
          </div>
        )}

        {/* Quick Info */}
        {!editing && (
          <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-muted-foreground">
            <span>Entrada: $ {entryValue.toFixed(2)}</span>
            <span>Payout: {payout}%</span>
            <span>Stop: $ {stopLoss.toFixed(2)}</span>
            <span>Meta: {dailyTarget}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
