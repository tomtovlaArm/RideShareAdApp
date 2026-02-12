import { useLocation } from "wouter";
import { Play, Pause, SkipForward, Music2 } from "lucide-react";
import { useAudio } from "@/contexts/AudioContext";
import { motion, AnimatePresence } from "framer-motion";

export default function MiniPlayer() {
  const audio = useAudio();
  const [, navigate] = useLocation();

  if (!audio.currentTrack || (!audio.isPlaying && audio.progress === 0)) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[860px]"
        data-testid="mini-player"
      >
        <div
          className="bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-2xl shadow-black/50 cursor-pointer"
          onClick={() => navigate("/music")}
        >
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-800 shrink-0 relative">
            {audio.currentTrack.cover ? (
              <img src={audio.currentTrack.cover} alt={audio.currentTrack.album} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music2 size={18} className="text-neutral-500" />
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
            <p className="text-sm font-medium text-white truncate">{audio.currentTrack.title}</p>
            <p className="text-xs text-neutral-400 truncate">{audio.currentTrack.artist}</p>
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={audio.togglePlay}
              className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
              data-testid="mini-player-play-pause"
            >
              {audio.isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
            </button>
            <button
              onClick={audio.nextTrack}
              className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
              data-testid="mini-player-next"
            >
              <SkipForward size={16} />
            </button>
          </div>

          <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${audio.progress}%` }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
