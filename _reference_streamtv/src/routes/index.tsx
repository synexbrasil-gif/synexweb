import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Tv, Play, ArrowRight, Radio, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "StreamTV — Player IPTV Premium" },
      {
        name: "description",
        content: "Experiência IPTV premium com streaming HLS, design moderno e player fluido.",
      },
    ],
  }),
});

function Index() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-foreground">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute -top-1/3 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-brand)" }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--brand-glow)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-2xl text-center"
      >
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-xs uppercase tracking-widest text-muted-foreground backdrop-blur-md">
          <Sparkles className="h-3 w-3 text-brand" />
          Novo Player IPTV
        </div>

        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-3xl shadow-2xl"
             style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-glow)" }}>
          <Tv className="h-8 w-8 text-primary-foreground" />
        </div>

        <h1 className="text-balance text-5xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl">
          StreamTV
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-balance text-base text-muted-foreground sm:text-lg">
          Player IPTV moderno com streaming HLS, troca de canais instantânea e
          uma interface inspirada nos melhores serviços do mundo.
        </p>

        <div className="mt-10 flex items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="group inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-primary-foreground shadow-xl transition hover:scale-[1.02]"
            style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-glow)" }}
          >
            <Play className="h-4 w-4 fill-current" />
            Abrir Player
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-12 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Radio className="h-3 w-3 text-live" /> HLS Live</span>
          <span>•</span>
          <span>Multi-canal</span>
          <span>•</span>
          <span>4K Ready</span>
        </div>
      </motion.div>
    </div>
  );
}
