import { Signal } from "@/lib/signalEngine";
import { ArrowUp, ArrowDown, CheckCircle, XCircle, Clock } from "lucide-react";

interface Props {
  signals: Signal[];
}

export default function SignalHistory({ signals }: Props) {
  const sorted = [...signals].reverse();

  return (
    <div className="glass-panel rounded-lg p-3">
      <h3 className="text-sm font-semibold mb-3 text-foreground">Histórico de Sinais</h3>
      {sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">Nenhum sinal ainda</p>
      ) : (
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
          {sorted.map((s) => (
            <div key={s.id} className="flex items-center justify-between bg-secondary/50 rounded px-2.5 py-1.5 text-xs">
              <div className="flex items-center gap-2">
                {s.type === "CALL" ? (
                  <ArrowUp className="w-3.5 h-3.5 text-signal-call" />
                ) : (
                  <ArrowDown className="w-3.5 h-3.5 text-signal-put" />
                )}
                <span className={s.type === "CALL" ? "text-signal-call" : "text-signal-put"}>
                  {s.type}
                </span>
                <span className="text-muted-foreground">{s.probability}%</span>
              </div>
              <div className="flex items-center gap-1">
                {s.result === "win" && <CheckCircle className="w-3.5 h-3.5 text-signal-call" />}
                {s.result === "loss" && <XCircle className="w-3.5 h-3.5 text-signal-put" />}
                {s.result === "pending" && <Clock className="w-3.5 h-3.5 text-signal-neutral" />}
                <span className="text-muted-foreground font-mono">
                  {new Date(s.time * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
