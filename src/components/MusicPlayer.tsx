"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValue } from "motion/react";
import { Loader2 } from "lucide-react";

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
    "relative w-full max-w-[500px] h-[358px] opacity-100 radius-xl p-32 text-white shadow-player-container transition-[background-color] duration-300";
  const containerStateClassName = isPlaying
    ? "bg-(--color-surface)"
    : "bg-(--color-surface-elevated)";

  const artworkScale = isPlaying ? 1 : isLoading ? 0.9 : 0.95;

  const barBaseClass = "w-8 origin-bottom radius-xxs bg-(--Primary-200)";
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
    ? "bg-(--Primary-200)"
    : "bg-(--Neutral-500)";

  const volumeFillClassName = isVolumeHover
    ? "bg-(--Primary-200)"
    : "bg-(--Neutral-500)";

  return (
    <div className={`${containerClassName} ${containerStateClassName}`}>
      {/* Header */}
      <div className="flex items-start gap-24">
        <motion.div
          className="relative shrink-0 -mt-6"
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
          <div className="absolute left-184 top-42 h-32 w-324 opacity-100 font-sans text-lg font-semibold leading-8">
            Awesome Song Title
          </div>
          <div
            className="absolute left-184 top-82 h-28 w-324 opacity-100 font-sans text-sm font-normal text-(--Neutral-400)"
            style={{ letterSpacing: "-0.03em" }}
          >
            Amazing Artist
          </div>

          <div className="absolute bottom-200 left-184">
            <div className="flex h-32 w-56 items-end justify-center gap-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <motion.div
                  key={index}
                  className={barBaseClass}
                  custom={index}
                  variants={equalizerBarVariants}
                  animate={playerState}
                  initial={false}
                  style={{ height: 32, willChange: "transform,opacity" }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="pt-40">
        <div className="h-8 w-468 -ml-16 overflow-hidden radius-full bg-(--Neutral-800) opacity-100">
          <motion.div
            className={`h-full origin-left ${progressFillClassName}`}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ scaleX: progress, willChange: "transform" }}
          />
        </div>
        <div
          className="flex w-468 -ml-16 items-center justify-between pt-20 font-sans text-xs font-normal text-(--Neutral-500) tabular-nums"
          style={{ letterSpacing: "-0.03em" }}
        >
          <span className="inline-flex h-24 min-w-20 items-center justify-start opacity-100">
            {formatTime(currentSeconds)}
          </span>
          <span className="inline-flex h-24 min-w-20 items-center justify-end text-right opacity-100">
            {formatTime(totalSeconds)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="pt-22">
        <div className="flex items-center justify-center gap-8">
          <motion.button
            type="button"
            className="group grid size-36 place-items-center radius-md p-8 opacity-100 text-(--color-text-muted) transition-colors duration-200 hover:bg-(--Neutral-800) hover:text-white active:opacity-90"
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            aria-label="Shuffle"
          >
            <Image
              src="/Icon/Shuffle.svg"
              alt="Shuffle"
              width={20}
              height={20}
              className="h-20 w-20 opacity-80 transition-[filter,opacity] duration-200 group-hover:opacity-100 group-hover:brightness-0 group-hover:invert"
              draggable={false}
              unoptimized
            />
          </motion.button>

          <motion.button
            type="button"
            className="group grid size-36 place-items-center radius-md p-8 opacity-100 text-(--color-text-muted) transition-colors duration-200 hover:bg-(--Neutral-800) hover:text-white active:opacity-90"
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            aria-label="Previous"
          >
            <Image
              src="/Icon/SkipBack.svg"
              alt="Skip Back"
              width={20}
              height={20}
              className="h-20 w-20 opacity-80 transition-[filter,opacity] duration-200 group-hover:opacity-100 group-hover:brightness-0 group-hover:invert"
              draggable={false}
              unoptimized
            />
          </motion.button>

          <motion.button
            type="button"
            onClick={handleTogglePlayPause}
            className="grid size-56 place-items-center radius-full opacity-100 text-white"
            style={{
              background: isLoading
                ? "var(--Neutral-500, #717680)"
                : isPlaying
                  ? "var(--Primary-200, #8B5CF6)"
                  : "var(--Primary-300, #7C3AED)",
            }}
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
                  <Image
                    src="/Icon/Pause.svg"
                    alt="Pause"
                    width={16}
                    height={16}
                    className="h-24 w-24 opacity-100"
                    draggable={false}
                    unoptimized
                  />
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
                    className="h-24 w-24 opacity-100"
                    draggable={false}
                    unoptimized
                  />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <motion.button
            type="button"
            className="group grid size-36 place-items-center radius-md p-8 opacity-100 text-(--color-text-muted) transition-colors duration-200 hover:bg-(--Neutral-800) hover:text-white active:opacity-90"
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            aria-label="Next"
          >
            <Image
              src="/Icon/SkipFoward.svg"
              alt="Skip Forward"
              width={20}
              height={20}
              className="h-20 w-20 opacity-80 transition-[filter,opacity] duration-200 group-hover:opacity-100 group-hover:brightness-0 group-hover:invert"
              draggable={false}
              unoptimized
            />
          </motion.button>

          <motion.button
            type="button"
            className="group grid size-36 place-items-center radius-md p-8 opacity-100 text-(--color-text-muted) transition-colors duration-200 hover:bg-(--Neutral-800) hover:text-white active:opacity-90"
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            aria-label="Repeat"
          >
            <Image
              src="/Icon/Repeat.svg"
              alt="Repeat"
              width={20}
              height={20}
              className="h-20 w-20 opacity-80 transition-[filter,opacity] duration-200 group-hover:opacity-100 group-hover:brightness-0 group-hover:invert"
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
            className="relative h-4 w-444 overflow-hidden radius-full bg-(--Neutral-800) opacity-100"
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
              className={`h-full origin-left transition-colors duration-200 ${volumeFillClassName}`}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              style={{ scaleX: volume, willChange: "transform" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
