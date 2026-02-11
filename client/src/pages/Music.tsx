import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { PodFrame } from "@/components/layout/PodFrame";
import { Play, Pause, SkipBack, SkipForward, Heart, ListMusic, Volume2, VolumeX, Volume1, Loader2, Music2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  duration: string;
  durationSec: number;
  audioUrl: string;
}

const genres = [
  { id: "chillout", label: "Chill" },
  { id: "lofi", label: "Lo-fi" },
  { id: "jazz", label: "Jazz" },
  { id: "ambient", label: "Ambient" },
  { id: "electronic", label: "Electronic" },
  { id: "hiphop", label: "Hip Hop" },
];

export default function Music() {
  const [, setLocation] = useLocation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState("chillout");
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<number | null>(null);

  const { data: tracks = [], isLoading } = useQuery<Track[]>({
    queryKey: ["/api/music/tracks", selectedGenre],
    queryFn: async () => {
      const res = await fetch(`/api/music/tracks?tags=${selectedGenre}&limit=10`);
      if (!res.ok) throw new Error("Failed to load music");
      return res.json();
    },
  });

  const currentTrack = tracks[currentTrackIndex];

  const stopProgressTracking = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  }, []);

  const startProgressTracking = useCallback(() => {
    stopProgressTracking();
    progressInterval.current = window.setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        const ct = audioRef.current.currentTime;
        const dur = audioRef.current.duration || 1;
        setCurrentTime(ct);
        setProgress((ct / dur) * 100);
      }
    }, 500);
  }, [stopProgressTracking]);

  useEffect(() => {
    return () => stopProgressTracking();
  }, [stopProgressTracking]);

  useEffect(() => {
    if (!currentTrack) return;

    if (audioRef.current) {
      audioRef.current.pause();
      stopProgressTracking();
    }

    const audio = new Audio(currentTrack.audioUrl);
    audio.volume = muted ? 0 : volume / 100;
    audioRef.current = audio;

    audio.addEventListener("ended", () => {
      if (tracks.length > 1) {
        setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
      } else {
        setIsPlaying(false);
      }
    });

    if (isPlaying) {
      audio.play().catch(() => {});
      startProgressTracking();
    }

    setProgress(0);
    setCurrentTime(0);

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [currentTrack?.id]);

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      stopProgressTracking();
    } else {
      audioRef.current.play().catch(() => {});
      startProgressTracking();
    }
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  };

  const seekTo = (val: number[]) => {
    if (!audioRef.current) return;
    const pct = val[0];
    const dur = audioRef.current.duration || 0;
    audioRef.current.currentTime = (pct / 100) * dur;
    setProgress(pct);
  };

  const selectTrack = (idx: number) => {
    setCurrentTrackIndex(idx);
    setIsPlaying(true);
    setShowPlaylist(false);
  };

  const changeVolume = (val: number[]) => {
    const v = val[0];
    setVolume(v);
    setMuted(v === 0);
    if (audioRef.current) {
      audioRef.current.volume = v / 100;
    }
  };

  const toggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    if (audioRef.current) {
      audioRef.current.volume = newMuted ? 0 : volume / 100;
    }
  };

  const toggleLike = (id: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const changeGenre = (genre: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setSelectedGenre(genre);
    setCurrentTrackIndex(0);
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setShowPlaylist(false);
    stopProgressTracking();
  };

  return (
    <PodFrame onBack={() => setLocation("/")} showBack>
      <div className="h-full flex flex-col bg-gradient-to-b from-neutral-900 via-neutral-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[60%] bg-purple-900/50 blur-[100px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[120%] h-[60%] bg-blue-900/50 blur-[100px] rounded-full" />
        </div>

        <div className="px-6 pt-4 pb-2 flex items-center justify-between z-10">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {genres.map((g) => (
              <button
                key={g.id}
                onClick={() => changeGenre(g.id)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                  selectedGenre === g.id
                    ? "bg-white text-black"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                )}
                data-testid={`button-genre-${g.id}`}
              >
                {g.label}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-neutral-400 hover:text-white shrink-0 ml-2"
            onClick={() => setShowPlaylist(!showPlaylist)}
            data-testid="button-toggle-playlist"
          >
            <ListMusic size={20} />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : tracks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center z-10 text-neutral-500">
            <Music2 size={32} className="mb-2" />
            <p className="text-sm">No tracks found for this genre</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col relative z-10 px-8 pb-6">
            <AnimatePresence mode="wait">
              {!showPlaylist ? (
                <motion.div
                  key="player"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex-1 flex flex-row gap-6 items-center"
                >
                  <div className={cn(
                    "relative w-44 h-44 rounded-2xl shadow-2xl overflow-hidden border border-white/10 transition-transform duration-700 ease-in-out shrink-0",
                    isPlaying ? "scale-100" : "scale-95"
                  )}>
                    <img
                      src={currentTrack?.cover}
                      alt={currentTrack?.album}
                      className="w-full h-full object-cover"
                      data-testid="img-album-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                  </div>

                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="min-w-0">
                        <h1 className="text-lg font-bold text-white truncate font-display" data-testid="text-track-title">{currentTrack?.title}</h1>
                        <p className="text-sm text-neutral-400 font-medium truncate" data-testid="text-track-artist">{currentTrack?.artist}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("transition-colors shrink-0", currentTrack && liked.has(currentTrack.id) ? "text-pink-500" : "text-neutral-400 hover:text-pink-500")}
                        onClick={() => currentTrack && toggleLike(currentTrack.id)}
                        data-testid="button-like"
                      >
                        <Heart size={18} fill={currentTrack && liked.has(currentTrack.id) ? "currentColor" : "none"} />
                      </Button>
                    </div>

                    <div className="mb-4 space-y-1">
                      <Slider
                        value={[progress]}
                        max={100}
                        step={0.1}
                        className="w-full cursor-pointer"
                        onValueChange={seekTo}
                        data-testid="slider-progress"
                      />
                      <div className="flex justify-between text-[10px] font-medium text-neutral-500">
                        <span>{formatTime(currentTime)}</span>
                        <span>{currentTrack?.duration}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-6">
                      <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white" onClick={prevTrack} data-testid="button-prev-track">
                        <SkipBack size={22} />
                      </Button>
                      <button
                        onClick={togglePlay}
                        className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10"
                        data-testid="button-play-pause"
                      >
                        {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
                      </button>
                      <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white" onClick={nextTrack} data-testid="button-next-track">
                        <SkipForward size={22} />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <button onClick={toggleMute} className="text-neutral-400 hover:text-white transition-colors" data-testid="button-mute">
                        {muted || volume === 0 ? <VolumeX size={16} /> : volume < 50 ? <Volume1 size={16} /> : <Volume2 size={16} />}
                      </button>
                      <Slider
                        value={[muted ? 0 : volume]}
                        max={100}
                        step={1}
                        className="w-full cursor-pointer"
                        onValueChange={changeVolume}
                        data-testid="slider-volume"
                      />
                      <span className="text-[10px] text-neutral-500 font-mono w-7 text-right shrink-0">{muted ? 0 : volume}%</span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  <h3 className="text-sm font-bold text-white mb-3">Tracks</h3>
                  <div className="space-y-1 overflow-y-auto flex-1">
                    {tracks.map((track, idx) => (
                      <div
                        key={track.id}
                        onClick={() => selectTrack(idx)}
                        className={cn(
                          "flex items-center p-2.5 rounded-xl cursor-pointer transition-colors",
                          idx === currentTrackIndex ? "bg-white/10" : "hover:bg-white/5"
                        )}
                        data-testid={`track-item-${idx}`}
                      >
                        <div className="w-9 h-9 rounded-md bg-neutral-800 overflow-hidden relative mr-3 shrink-0">
                          <img src={track.cover} className="w-full h-full object-cover" alt={track.album} />
                          {idx === currentTrackIndex && isPlaying && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={cn("text-sm font-medium truncate", idx === currentTrackIndex ? "text-white" : "text-neutral-300")}>{track.title}</h4>
                          <p className="text-xs text-neutral-500 truncate">{track.artist}</p>
                        </div>
                        <span className="text-xs text-neutral-500 font-mono shrink-0 ml-2">{track.duration}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PodFrame>
  );
}
