import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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

export function PodFrame({ children, className, onBack, showBack }: PodFrameProps) {
  const isFullscreen = useIsFullscreen();

  if (isFullscreen) {
    return (
      <div className="h-screen w-screen bg-black font-sans text-white overflow-hidden relative">
        {showBack && (
          <button
            onClick={onBack}
            className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        )}
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
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
        <div className="flex-1 overflow-hidden relative bg-black">
          <AnimatePresence mode="wait">
             {children}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
