import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { PodFrame } from "@/components/layout/PodFrame";
import { Play, Pause, SkipBack, SkipForward, Heart, ListMusic, Volume2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const playlist = [
  {
    id: 1,
    title: "Neon Nights",
    artist: "Cyber Dreams",
    album: "Future City",
    cover: "/assets/album-cover.png",
    duration: "3:45"
  },
  {
    id: 2,
    title: "Midnight Drive",
    artist: "Synthwave Collective",
    album: "Retro Horizon",
    cover: "/assets/album-cover.png", // Reusing for mockup
    duration: "4:12"
  },
  {
    id: 3,
    title: "Digital Love",
    artist: "Pixel Hearts",
    album: "Binary Beats",
    cover: "/assets/album-cover.png",
    duration: "3:30"
  }
];

export default function Music() {
  const [, setLocation] = useLocation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [progress, setProgress] = useState(33);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const currentTrack = playlist[currentTrackIndex];

  const togglePlay = () => setIsPlaying(!isPlaying);

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
    setIsPlaying(true);
    setProgress(0);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    setIsPlaying(true);
    setProgress(0);
  };

  return (
    <PodFrame onBack={() => setLocation("/")} showBack>
      <div className="h-full flex flex-col bg-gradient-to-b from-neutral-900 via-neutral-900 to-black relative overflow-hidden">
        
        {/* Background Blur Effect */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[60%] bg-purple-900/50 blur-[100px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[120%] h-[60%] bg-blue-900/50 blur-[100px] rounded-full" />
        </div>

        {/* Header */}
        <div className="p-6 flex items-center justify-between z-10">
          <h2 className="text-sm font-medium tracking-widest text-neutral-400 uppercase">Now Playing</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-neutral-400 hover:text-white"
            onClick={() => setShowPlaylist(!showPlaylist)}
          >
            <ListMusic size={20} />
          </Button>
        </div>

        <div className="flex-1 flex flex-col relative z-10 px-8 pb-8">
            <AnimatePresence mode="wait">
                {!showPlaylist ? (
                    <motion.div 
                        key="player"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex-1 flex flex-col"
                    >
                        {/* Album Art */}
                        <div className="flex-1 flex items-center justify-center py-4">
                            <div className={cn(
                                "relative w-64 h-64 rounded-2xl shadow-2xl overflow-hidden border border-white/10 transition-transform duration-700 ease-in-out",
                                isPlaying ? "scale-100" : "scale-95"
                            )}>
                                <img 
                                    src={currentTrack.cover} 
                                    alt={currentTrack.album}
                                    className="w-full h-full object-cover"
                                />
                                {/* Reflection/Shine */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                            </div>
                        </div>

                        {/* Track Info */}
                        <div className="mb-8 space-y-1">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-white mb-1 font-display">{currentTrack.title}</h1>
                                    <p className="text-lg text-neutral-400 font-medium">{currentTrack.artist}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-pink-500 transition-colors">
                                    <Heart size={24} />
                                </Button>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="mb-8 space-y-2">
                            <Slider 
                                value={[progress]} 
                                max={100} 
                                step={1} 
                                className="w-full cursor-pointer"
                                onValueChange={(val) => setProgress(val[0])}
                            />
                            <div className="flex justify-between text-xs font-medium text-neutral-500">
                                <span>1:15</span>
                                <span>{currentTrack.duration}</span>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between mb-4">
                            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white" onClick={prevTrack}>
                                <SkipBack size={32} />
                            </Button>
                            
                            <button 
                                onClick={togglePlay}
                                className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10"
                            >
                                {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                            </button>

                            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white" onClick={nextTrack}>
                                <SkipForward size={32} />
                            </Button>
                        </div>

                        {/* Volume Helper */}
                        <div className="flex items-center justify-center gap-3 mt-4 text-neutral-500">
                            <Volume2 size={16} />
                            <div className="w-32 h-1 bg-neutral-800 rounded-full overflow-hidden">
                                <div className="w-3/4 h-full bg-neutral-500" />
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="flex-1 flex flex-col"
                    >
                         <h3 className="text-lg font-bold text-white mb-4">Up Next</h3>
                         <div className="space-y-2">
                            {playlist.map((track, idx) => (
                                <div 
                                    key={track.id}
                                    onClick={() => {
                                        setCurrentTrackIndex(idx);
                                        setIsPlaying(true);
                                        setShowPlaylist(false);
                                    }}
                                    className={cn(
                                        "flex items-center p-3 rounded-xl cursor-pointer transition-colors",
                                        idx === currentTrackIndex ? "bg-white/10" : "hover:bg-white/5"
                                    )}
                                >
                                    <div className="w-10 h-10 rounded-md bg-neutral-800 overflow-hidden relative mr-4">
                                        <img src={track.cover} className="w-full h-full object-cover" />
                                        {idx === currentTrackIndex && isPlaying && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={cn("font-medium", idx === currentTrackIndex ? "text-white" : "text-neutral-300")}>{track.title}</h4>
                                        <p className="text-xs text-neutral-500">{track.artist}</p>
                                    </div>
                                    <span className="text-xs text-neutral-500 font-mono">{track.duration}</span>
                                </div>
                            ))}
                         </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

      </div>
    </PodFrame>
  );
}
