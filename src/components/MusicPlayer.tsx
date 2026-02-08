"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValue } from "motion/react";
import { Loader2, Pause } from "lucide-react";

type PlayerState = "playing" | "paused" | "loading";

const TOGGLE_DELAY_MS = 500;
const PROGRESS_DURATION_MS = 225_000; // 3:45

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function formatTime(totalSeconds: number) {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function MusicPlayer() {
  const [playerState, setPlayerState] = React.useState<PlayerState>("paused");
  const [volume, setVolume] = React.useState(0.65);
  const [isVolumeHover, setIsVolumeHover] = React.useState(false);

  const toggleTimeoutRef = React.useRef<number | null>(null);
  const isMountedRef = React.useRef(false);

  const isPlaying = playerState === "playing";
  const isLoading = playerState === "loading";

  const artworkRotation = useMotionValue(0);
  const progress = useMotionValue(0.3688889); // ~1:23 of 3:45
  const lastFrameRef = React.useRef<number | null>(null);

  const totalSeconds = PROGRESS_DURATION_MS / 1000;
  const [currentSeconds, setCurrentSeconds] = React.useState(
    progress.get() * totalSeconds,
  );

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (toggleTimeoutRef.current) {
        window.clearTimeout(toggleTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (!isPlaying) {
      lastFrameRef.current = null;
      return;
    }

    let rafId = 0;
    const tick = (now: number) => {
      if (!isMountedRef.current) return;

      const last = lastFrameRef.current ?? now;
      const deltaMs = Math.max(0, now - last);
      lastFrameRef.current = now;

      // Artwork rotation: 360 deg / 20s
      const rotationDelta = (deltaMs * 360) / 20_000;
      artworkRotation.set((artworkRotation.get() + rotationDelta) % 360);

      // Progress: loops at PROGRESS_DURATION_MS
      const nextProgress = progress.get() + deltaMs / PROGRESS_DURATION_MS;
      progress.set(nextProgress % 1);

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [artworkRotation, isPlaying, progress]);

  React.useEffect(() => {
    // Update time labels without forcing a re-render every animation frame
    const id = window.setInterval(() => {
      setCurrentSeconds(progress.get() * totalSeconds);
    }, 250);

    return () => window.clearInterval(id);
  }, [progress, totalSeconds]);

  const handleTogglePlayPause = React.useCallback(() => {
    if (isLoading) return;

    const nextState: PlayerState = isPlaying ? "paused" : "playing";
    setPlayerState("loading");

    if (toggleTimeoutRef.current) {
      window.clearTimeout(toggleTimeoutRef.current);
    }

    toggleTimeoutRef.current = window.setTimeout(() => {
      if (!isMountedRef.current) return;
      setPlayerState(nextState);
    }, TOGGLE_DELAY_MS);
  }, [isLoading, isPlaying]);

  const handleSetVolumeFromClientX = React.useCallback((clientX: number) => {
    const track = document.getElementById("volume-track");
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const next = clamp01((clientX - rect.left) / rect.width);
    setVolume(next);
  }, []);

  const containerClassName =
    "w-full max-w-[500px] h-[358px] opacity-100 radius-xl p-32 text-white shadow-player-container transition-[background-color] duration-300";
  const containerStateClassName = isPlaying
    ? "bg-(--color-surface)"
    : "bg-(--color-surface-elevated)";

  const artworkScale = isPlaying ? 1 : isLoading ? 0.9 : 0.95;

  const barBaseClass = "w-8 origin-bottom radius-xxs bg-purple-500";
  const equalizerBarVariants = {
    playing: (index: number) => ({
      opacity: 1,
      scaleY: [0.2, 1],
      transition: {
        duration: 0.5,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse" as const,
        delay: index * 0.1,
      },
    }),
    paused: {
      opacity: 1,
      scaleY: 0.2,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
    loading: {
      opacity: 0.5,
      scaleY: 0.5,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
  };

  const progressFillClassName = isPlaying
    ? "bg-purple-500"
    : "bg-(--color-track-fill)";

  const volumeFillClassName = isVolumeHover
    ? "bg-purple-500"
    : "bg-(--color-track-fill)";

  return (
    <div className={`${containerClassName} ${containerStateClassName}`}>
      {/* Header */}
      <div className="flex items-start gap-24">
        <motion.div
          className="relative shrink-0"
          animate={{ scale: artworkScale }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          style={{ willChange: "transform" }}
        >
          <motion.div
            className="grid size-120 place-items-center radius-xl opacity-100 bg-[linear-gradient(127.48deg,#7C3AED_-5.18%,var(--color-additional-pink-600)_100.8%)]"
            style={{ rotate: artworkRotation, willChange: "transform" }}
          >
            <Image
              src="/icon/Album-Art.png"
              alt="Album artwork"
              width={48}
              height={60}
              className="h-60 w-48"
              draggable={false}
              unoptimized
            />
          </motion.div>
        </motion.div>

        <div className="min-w-0 flex-1">
          <div className="text-xl font-bold leading-7">Awesome Song Title</div>
          <div className="pt-6 text-sm font-medium text-(--color-text-muted)">
            Amazing Artist
          </div>

          <div className="pt-14">
            <div className="flex items-end justify-center gap-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <motion.div
                  key={index}
                  className={barBaseClass}
                  custom={index}
                  variants={equalizerBarVariants}
                  animate={playerState}
                  initial={false}
                  style={{ height: 12, willChange: "transform,opacity" }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="pt-20">
        <div className="h-6 w-full overflow-hidden radius-full bg-(--color-track)">
          <motion.div
            className={`h-full origin-left ${progressFillClassName}`}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ scaleX: progress, willChange: "transform" }}
          />
        </div>
        <div className="flex items-center justify-between pt-10 text-xs text-(--color-text-muted) tabular-nums">
          <span>{formatTime(currentSeconds)}</span>
          <span>{formatTime(totalSeconds)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="pt-22">
        <div className="flex items-center justify-center gap-28">
          <motion.button
            type="button"
            className="grid size-40 place-items-center radius-full text-(--color-text-muted) transition-colors duration-200 hover:text-white"
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            aria-label="Shuffle"
          >
            <Image
              src="/Icon/Shuffle.svg"
              alt="Shuffle"
              width={20}
              height={20}
              className="h-20 w-20 opacity-100"
              draggable={false}
              unoptimized
            />
          </motion.button>

          <motion.button
            type="button"
            className="grid size-40 place-items-center radius-full text-(--color-text-muted) transition-colors duration-200 hover:text-white"
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            aria-label="Previous"
          >
            <Image
              src="/Icon/SkipBack.svg"
              alt="Skip Back"
              width={20}
              height={20}
              className="h-20 w-20 opacity-100"
              draggable={false}
              unoptimized
            />
          </motion.button>

          <motion.button
            type="button"
            onClick={handleTogglePlayPause}
            className="grid size-56 place-items-center radius-full opacity-100 text-white"
            style={{ background: "var(--Neutral-500, #717680)" }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
            aria-label={isLoading ? "Loading" : isPlaying ? "Pause" : "Play"}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isLoading ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="grid place-items-center"
                >
                  <Loader2 className="size-26 animate-spin" />
                </motion.span>
              ) : isPlaying ? (
                <motion.span
                  key="pause"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="grid place-items-center"
                >
                  <Pause className="size-28" />
                </motion.span>
              ) : (
                <motion.span
                  key="play"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="grid place-items-center"
                >
                  <Image
                    src="/Icon/Play1.svg"
                    alt="Play"
                    width={14}
                    height={18}
                    className="h-18 w-14 opacity-100"
                    draggable={false}
                    unoptimized
                  />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <motion.button
            type="button"
            className="grid size-40 place-items-center radius-full text-(--color-text-muted) transition-colors duration-200 hover:text-white"
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            aria-label="Next"
          >
            <Image
              src="/Icon/SkipFoward.svg"
              alt="Skip Forward"
              width={20}
              height={20}
              className="h-20 w-20 opacity-100"
              draggable={false}
              unoptimized
            />
          </motion.button>

          <motion.button
            type="button"
            className="grid size-40 place-items-center radius-full text-(--color-text-muted) transition-colors duration-200 hover:text-white"
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            aria-label="Repeat"
          >
            <Image
              src="/Icon/Repeat.svg"
              alt="Repeat"
              width={20}
              height={20}
              className="h-20 w-20 opacity-100"
              draggable={false}
              unoptimized
            />
          </motion.button>
        </div>
      </div>

      {/* Volume */}
      <div className="pt-22">
        <div className="flex items-center gap-14">
          <Image
            src="/Icon/Volume.svg"
            alt="Volume"
            width={16}
            height={16}
            className="h-16 w-16 opacity-100"
            draggable={false}
            unoptimized
          />

          <div
            id="volume-track"
            className="relative h-6 flex-1 overflow-hidden radius-full bg-(--color-track)"
            onPointerEnter={() => setIsVolumeHover(true)}
            onPointerLeave={() => setIsVolumeHover(false)}
            onPointerDown={(e) => {
              (e.currentTarget as HTMLDivElement).setPointerCapture(
                e.pointerId,
              );
              handleSetVolumeFromClientX(e.clientX);
            }}
            onPointerMove={(e) => {
              if ((e.buttons & 1) !== 1) return;
              handleSetVolumeFromClientX(e.clientX);
            }}
            role="slider"
            aria-label="Volume"
            aria-valuemin={0}
            aria-valuemax={1}
            aria-valuenow={Number(volume.toFixed(2))}
            tabIndex={0}
          >
            <motion.div
              className={`h-full origin-left ${volumeFillClassName}`}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              style={{ scaleX: volume, willChange: "transform" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
