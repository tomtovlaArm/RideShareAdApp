import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, Music2, Volume2, Volume1, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAudio } from "@/contexts/AudioContext";
import { Slider } from "@/components/ui/slider";

interface PodFrameProps {
  children: React.ReactNode;
  className?: string;
  onBack?: () => void;
  showBack?: boolean;
}

function useIsFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const check = () => {
      const isPWA = window.matchMedia('(display-mode: standalone)').matches
        || (navigator as any).standalone === true;
      const isTablet = /iPad|Android/i.test(navigator.userAgent)
        && (window.innerWidth >= 700 || window.innerHeight >= 700);
      const isTouchWide = 'ontouchstart' in window && window.innerWidth >= 700;
      setIsFullscreen(isPWA || isTablet || isTouchWide);
    };

    check();
    window.addEventListener('resize', check);
    const mq = window.matchMedia('(display-mode: standalone)');
    mq.addEventListener('change', check);

    return () => {
      window.removeEventListener('resize', check);
      mq.removeEventListener('change', check);
    };
  }, []);

  return isFullscreen;
}

function InlineMiniPlayer() {
  const audio = useAudio();
  const [, navigate] = useLocation();
  const [location] = useLocation();

  if (location === "/music") return null;
  if (!audio.currentTrack || (!audio.isPlaying && audio.progress === 0)) return null;

  return (
    <div
      className="shrink-0 bg-neutral-900/95 backdrop-blur-xl border-t border-white/10 px-3 py-2 flex items-center gap-3 cursor-pointer"
      onClick={() => navigate("/music")}
      data-testid="mini-player"
    >
      <div className="w-9 h-9 rounded-lg overflow-hidden bg-neutral-800 shrink-0 relative">
        {audio.currentTrack.cover ? (
          <img src={audio.currentTrack.cover} alt={audio.currentTrack.album} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music2 size={16} className="text-neutral-500" />
          </div>
        )}
        {audio.isPlaying && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="flex gap-0.5 items-end h-3">
              <div className="w-0.5 bg-white rounded-full animate-pulse h-2" style={{ animationDelay: "0ms" }} />
              <div className="w-0.5 bg-white rounded-full animate-pulse h-3" style={{ animationDelay: "150ms" }} />
              <div className="w-0.5 bg-white rounded-full animate-pulse h-1.5" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">{audio.currentTrack.title}</p>
        <p className="text-[10px] text-neutral-400 truncate">{audio.currentTrack.artist}</p>
      </div>

      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={audio.togglePlay}
          className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          data-testid="mini-player-play-pause"
        >
          {audio.isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
        </button>
        <button
          onClick={audio.nextTrack}
          className="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          data-testid="mini-player-next"
        >
          <SkipForward size={14} />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-700">
        <div
          className="h-full bg-purple-500 transition-all duration-500"
          style={{ width: `${audio.progress}%` }}
        />
      </div>
    </div>
  );
}

export function PodFrame({ children, className, onBack, showBack }: PodFrameProps) {
  const isFullscreen = useIsFullscreen();

  if (isFullscreen) {
    return (
      <div className="h-screen w-screen bg-black font-sans text-white overflow-hidden relative flex flex-col">
        {showBack && (
          <button
            onClick={onBack}
            className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        )}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {children}
          </AnimatePresence>
        </div>
        <InlineMiniPlayer />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-900 p-4 font-sans text-white">
      {/* Device Body - landscape iPad tablet */}
      <div className="relative w-full max-w-[900px] h-[560px] bg-neutral-800 rounded-[2.5rem] shadow-2xl border-[6px] border-neutral-700 overflow-hidden flex flex-row">
        {/* Side Navigation Bar */}
        <div className="w-14 bg-neutral-800 shrink-0 flex flex-col items-center justify-between py-4 border-r border-neutral-700/50">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-neutral-500 font-medium">9:41</span>
            <div className="w-4 h-2.5 border border-neutral-500 rounded-sm relative">
              <div className="absolute inset-0.5 bg-white w-3/4" />
            </div>
          </div>

          {showBack && (
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-neutral-700/50 flex items-center justify-center hover:bg-neutral-600 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          )}

          <div className="w-8 h-1 bg-neutral-600 rounded-full" />
        </div>

        {/* Main Screen Content */}
        <div className="flex-1 overflow-hidden relative bg-black flex flex-col">
          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              {children}
            </AnimatePresence>
          </div>
          <InlineMiniPlayer />
        </div>
      </div>
    </div>
  );
}
