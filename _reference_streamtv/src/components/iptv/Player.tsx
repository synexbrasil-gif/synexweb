import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Loader2,
  AlertCircle,
  Radio,
} from "lucide-react";
import type { Channel } from "@/lib/channels";

type Props = { channel: Channel };

export function Player({ channel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<number | null>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [buffering, setBuffering] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // HLS attach + channel switch
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setBuffering(true);
    setError(null);
    setPlaying(false);

    let hls: Hls | null = null;

    const onPlaying = () => {
      setPlaying(true);
      setBuffering(false);
    };
    const onPause = () => setPlaying(false);
    const onWaiting = () => setBuffering(true);
    const onCanPlay = () => setBuffering(false);

    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);

    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(channel.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          setError("Não foi possível carregar este stream.");
          setBuffering(false);
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = channel.url;
    } else {
      setError("Navegador não suporta HLS.");
      setBuffering(false);
    }

    video.play().catch(() => {
      // autoplay blocked → keep paused, user can press play
      setBuffering(false);
    });

    return () => {
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      if (hls) hls.destroy();
    };
  }, [channel.url]);

  // Fullscreen tracking
  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  }, []);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const changeVolume = (val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    v.muted = val === 0;
    setVolume(val);
    setMuted(val === 0);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen();
    else document.exitFullscreen();
  };

  const revealControls = () => {
    setShowControls(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={revealControls}
      onMouseLeave={() => playing && setShowControls(false)}
      className="relative flex-1 overflow-hidden bg-black"
    >
      <AnimatePresence mode="wait">
        <motion.video
          key={channel.id}
          ref={videoRef}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 h-full w-full object-contain"
          autoPlay
          playsInline
          onClick={togglePlay}
        />
      </AnimatePresence>

      {/* Top gradient + channel info */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.05 0 0 / 0.85) 0%, transparent 100%)",
        }}
      />

      <AnimatePresence>
        {(showControls || !playing) && (
          <motion.div
            key="topbar"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="absolute left-0 right-0 top-0 z-20 flex items-start justify-between p-6"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface/70 text-2xl backdrop-blur-md">
                {channel.logo}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-live/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-foreground shadow-md">
                    <Radio className="h-2.5 w-2.5 animate-pulse" /> Ao Vivo
                  </span>
                  <span className="text-xs text-foreground/70">{channel.category}</span>
                </div>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground drop-shadow-lg">
                  {channel.name}
                </h2>
                {channel.description && (
                  <p className="text-sm text-foreground/70">{channel.description}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buffering loader */}
      <AnimatePresence>
        {buffering && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-12 w-12 animate-spin text-brand" />
              <p className="text-xs uppercase tracking-widest text-foreground/70">
                Carregando stream...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error overlay */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-md"
          >
            <div className="flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-border bg-surface/80 p-8 text-center shadow-xl">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <h3 className="text-lg font-semibold text-foreground">Stream indisponível</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom gradient */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
        style={{ background: "var(--gradient-overlay)" }}
      />

      {/* Controls */}
      <AnimatePresence>
        {(showControls || !playing) && (
          <motion.div
            key="controls"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-x-0 bottom-0 z-20 px-6 pb-6"
          >
            {/* Live progress bar */}
            <div className="mb-4 h-1 overflow-hidden rounded-full bg-foreground/15">
              <motion.div
                className="h-full"
                style={{ background: "var(--gradient-brand)" }}
                initial={{ width: "0%" }}
                animate={{ width: ["0%", "100%"] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-surface/40 px-4 py-3 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <ControlButton onClick={togglePlay} label={playing ? "Pause" : "Play"}>
                  {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
                </ControlButton>

                <div
                  className="group flex items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-surface-hover"
                >
                  <ControlButton onClick={toggleMute} label="Mute" subtle>
                    {muted || volume === 0 ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </ControlButton>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={muted ? 0 : volume}
                    onChange={(e) => changeVolume(parseFloat(e.target.value))}
                    className="h-1 w-0 cursor-pointer appearance-none rounded-full bg-foreground/20 opacity-0 transition-all duration-300 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand group-hover:w-24 group-hover:opacity-100"
                  />
                </div>

                <span className="ml-2 flex items-center gap-1.5 rounded-full bg-live/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-live">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live" /> Live
                </span>
              </div>

              <div className="flex items-center gap-1">
                <ControlButton label="Configurações">
                  <Settings className="h-5 w-5" />
                </ControlButton>
                <ControlButton onClick={toggleFullscreen} label="Tela cheia">
                  {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                </ControlButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ControlButton({
  children,
  onClick,
  label,
  subtle,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  label: string;
  subtle?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      aria-label={label}
      className={`flex h-10 w-10 items-center justify-center rounded-xl text-foreground/90 transition ${
        subtle ? "" : "hover:bg-surface-hover hover:text-foreground"
      }`}
    >
      {children}
    </motion.button>
  );
}
