import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface PodFrameProps {
  children: React.ReactNode;
  className?: string;
  onBack?: () => void;
  showBack?: boolean;
}

export function PodFrame({ children, className, onBack, showBack }: PodFrameProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-900 p-4 font-sans text-white">
      {/* Device Body */}
      <div className="relative w-full max-w-[400px] h-[800px] bg-neutral-800 rounded-[3rem] shadow-2xl border-[6px] border-neutral-700 overflow-hidden flex flex-col">
        {/* Status Bar */}
        <div className="h-8 w-full bg-black/40 flex items-center justify-between px-6 text-xs font-medium text-neutral-400 z-10 shrink-0">
          <span>9:41</span>
          <div className="flex items-center gap-2">
            <span>UBER 5G</span>
            <div className="w-5 h-3 border border-neutral-500 rounded-sm relative">
              <div className="absolute inset-0.5 bg-white w-3/4" />
            </div>
          </div>
        </div>

        {/* Main Screen Content */}
        <div className="flex-1 overflow-hidden relative bg-black">
          <AnimatePresence mode="wait">
             {children}
          </AnimatePresence>
        </div>

        {/* Home Indicator / Navigation Area */}
        <div className="h-16 bg-neutral-800 shrink-0 flex items-center justify-center relative border-t border-neutral-700/50">
          {showBack && (
            <button 
                onClick={onBack}
                className="absolute left-8 w-10 h-10 rounded-full bg-neutral-700/50 flex items-center justify-center hover:bg-neutral-600 transition-colors"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
