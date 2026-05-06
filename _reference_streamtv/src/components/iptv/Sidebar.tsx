import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Radio, Tv } from "lucide-react";
import { channels as allChannels, categories, type Channel } from "@/lib/channels";

type Props = {
  current: Channel;
  onSelect: (c: Channel) => void;
};

export function Sidebar({ current, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Todos");

  const filtered = useMemo(() => {
    return allChannels.filter((c) => {
      const matchesQuery = c.name.toLowerCase().includes(query.toLowerCase());
      const matchesCat = activeCategory === "Todos" || c.category === activeCategory;
      return matchesQuery && matchesCat;
    });
  }, [query, activeCategory]);

  return (
    <aside
      className="flex h-screen w-80 flex-shrink-0 flex-col border-r border-border/50 backdrop-blur-xl"
      style={{ background: "var(--gradient-sidebar)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg"
          style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-glow)" }}
        >
          <Tv className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">StreamTV</h1>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Premium IPTV</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar canais..."
            className="h-10 w-full rounded-xl border border-border bg-surface/60 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-brand/60 focus:bg-surface focus:ring-2 focus:ring-brand/20"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-1.5 px-4 pb-3">
        {["Todos", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              activeCategory === cat
                ? "bg-brand text-primary-foreground shadow-md"
                : "bg-surface/50 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Channels list */}
      <div className="flex-1 overflow-y-auto px-3 pb-6 [scrollbar-width:thin]">
        <p className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {filtered.length} canais disponíveis
        </p>
        <AnimatePresence mode="popLayout">
          {filtered.map((channel, idx) => {
            const isActive = channel.id === current.id;
            return (
              <motion.button
                key={channel.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, delay: idx * 0.02 }}
                onClick={() => onSelect(channel)}
                className={`group relative mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                  isActive
                    ? "bg-surface-elevated shadow-lg"
                    : "hover:bg-surface/70"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeChannelBar"
                    className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full"
                    style={{ background: "var(--gradient-brand)" }}
                  />
                )}
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-lg transition ${
                    isActive ? "bg-brand/15" : "bg-surface/80 group-hover:bg-surface-hover"
                  }`}
                >
                  {channel.logo}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={`truncate text-sm font-medium ${
                        isActive ? "text-foreground" : "text-foreground/85 group-hover:text-foreground"
                      }`}
                    >
                      {channel.name}
                    </p>
                    {isActive && (
                      <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-live">
                        <Radio className="h-2.5 w-2.5 animate-pulse" />
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{channel.category}</p>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </aside>
  );
}
