import { Signal } from "@/lib/signalEngine";
import { TrendingUp, Target, BarChart3 } from "lucide-react";

interface Props {
  signals: Signal[];
}

export default function SignalStats({ signals }: Props) {
  const completed = signals.filter((s) => s.result !== "pending");
  const wins = completed.filter((s) => s.result === "win").length;
  const losses = completed.filter((s) => s.result === "loss").length;
  const winRate = completed.length > 0 ? Math.round((wins / completed.length) * 100) : 0;

  return (
    <div className="glass-panel rounded-lg p-3">
      <h3 className="text-sm font-semibold mb-3 text-foreground">Estatísticas</h3>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-secondary/50 rounded p-2 text-center">
          <BarChart3 className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-lg font-mono font-bold text-foreground">{signals.length}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
        <div className="bg-secondary/50 rounded p-2 text-center">
          <Target className="w-4 h-4 mx-auto mb-1 text-signal-call" />
          <p className="text-lg font-mono font-bold text-signal-call">{wins}</p>
          <p className="text-[10px] text-muted-foreground">Wins</p>
        </div>
        <div className="bg-secondary/50 rounded p-2 text-center">
          <TrendingUp className="w-4 h-4 mx-auto mb-1 text-signal-neutral" />
          <p className="text-lg font-mono font-bold text-signal-neutral">{winRate}%</p>
          <p className="text-[10px] text-muted-foreground">Win Rate</p>
        </div>
      </div>
    </div>
  );
}
