import { Asset, allAssets, assetCategories, AssetCategory } from "@/lib/marketData";
import { ChevronDown, Search, X } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";

interface Props {
  selected: Asset;
  onSelect: (asset: Asset) => void;
}

export default function AssetSelector({ selected, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<AssetCategory | "all">("all");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  const filtered = useMemo(() => {
    let list = activeCategory === "all" ? allAssets : allAssets.filter((a) => a.category === activeCategory);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q));
    }
    return list;
  }, [activeCategory, search]);

  const categoryLabel = selected.category.startsWith("otc") ? "OTC" : selected.category === "crypto" ? "Crypto" : "Forex";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-secondary hover:bg-muted px-3 py-1.5 rounded text-sm font-mono font-semibold text-foreground transition-colors"
      >
        <span className="text-[10px] text-muted-foreground uppercase">{categoryLabel}</span>
        <span>{selected.name}</span>
        {selected.payout && (
          <span className="text-[10px] text-primary font-normal">{selected.payout}%</span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-card border border-border rounded shadow-2xl w-[320px] max-h-[420px] flex flex-col">
          {/* Search */}
          <div className="p-2 border-b border-border relative">
            <Search className="w-3.5 h-3.5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ativo..."
              className="w-full bg-secondary rounded px-3 py-1.5 pl-8 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2">
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Category tabs */}
          <div className="flex gap-0.5 p-1.5 border-b border-border overflow-x-auto">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-2 py-1 text-[10px] rounded font-medium whitespace-nowrap transition-colors ${
                activeCategory === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              Todos
            </button>
            {assetCategories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-2 py-1 text-[10px] rounded font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Asset list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum ativo encontrado</p>
            ) : (
              filtered.map((a) => (
                <button
                  key={a.id}
                  onClick={() => { onSelect(a); setOpen(false); setSearch(""); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-secondary/80 transition-colors ${
                    a.id === selected.id ? "bg-secondary text-primary" : "text-foreground"
                  }`}
                >
                  <span className="font-mono font-medium">{a.name}</span>
                  <div className="flex items-center gap-2">
                    {a.payout && (
                      <span className="text-[10px] text-primary">{a.payout}%</span>
                    )}
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {a.category === "otc-currency" ? "OTC" : a.category === "otc-commodity" ? "Comm" : a.category === "otc-stock" ? "Stock" : a.category}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
