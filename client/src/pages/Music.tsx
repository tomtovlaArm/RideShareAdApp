import { useEffect, useRef, useCallback, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { PodFrame } from "@/components/layout/PodFrame";
import { Play, Pause, SkipBack, SkipForward, Heart, ListMusic, Volume2, VolumeX, Volume1, Loader2, Music2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useAudio, type Track } from "@/contexts/AudioContext";

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
  const [showPlaylist, setShowPlaylist] = useState(false);
  const audio = useAudio();
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPlayingRef = useRef(audio.isPlaying);
  const isBufferingRef = useRef(audio.isBuffering);

  isPlayingRef.current = audio.isPlaying;
  isBufferingRef.current = audio.isBuffering;

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      if (!isPlayingRef.current && !isBufferingRef.current) {
        setLocation("/");
      }
    }, 30000);
  }, [setLocation]);

  useEffect(() => {
    resetInactivityTimer();
    const events = ["pointerdown", "pointermove", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetInactivityTimer));
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      events.forEach((e) => window.removeEventListener(e, resetInactivityTimer));
    };
  }, [resetInactivityTimer]);

  const { data: fetchedTracks = [], isLoading } = useQuery<Track[]>({
    queryKey: ["/api/music/tracks", audio.selectedGenre],
    queryFn: async () => {
      const res = await fetch(`/api/music/tracks?tags=${audio.selectedGenre}&limit=10`);
      if (!res.ok) throw new Error("Failed to load music");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (fetchedTracks.length > 0) {
      audio.setTracks(fetchedTracks);
    }
  }, [fetchedTracks]);

  useEffect(() => {
    if (audio.tracks.length > 0 && !hasInitialized.current && !audio.isPlaying) {
      hasInitialized.current = true;
      const randomIdx = Math.floor(Math.random() * audio.tracks.length);
      audio.selectTrack(randomIdx, false);
    }
  }, [audio.tracks, audio.isPlaying, audio.selectTrack]);

  const currentTrack = audio.currentTrack;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleChangeGenre = (genre: string) => {
    hasInitialized.current = false;
    audio.changeGenre(genre);
    setShowPlaylist(false);
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
                onClick={() => handleChangeGenre(g.id)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                  audio.selectedGenre === g.id
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
        ) : audio.tracks.length === 0 ? (
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
                    audio.isPlaying ? "scale-100" : "scale-95"
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
                        className={cn("transition-colors shrink-0", currentTrack && audio.liked.has(currentTrack.id) ? "text-pink-500" : "text-neutral-400 hover:text-pink-500")}
                        onClick={() => currentTrack && audio.toggleLike(currentTrack.id)}
                        data-testid="button-like"
                      >
                        <Heart size={18} fill={currentTrack && audio.liked.has(currentTrack.id) ? "currentColor" : "none"} />
                      </Button>
                    </div>

                    <div className="mb-4 space-y-1">
                      <Slider
                        value={[audio.progress]}
                        max={100}
                        step={0.1}
                        className="w-full cursor-pointer"
                        onValueChange={audio.seekTo}
                        data-testid="slider-progress"
                      />
                      <div className="flex justify-between text-[10px] font-medium text-neutral-500">
                        <span>{formatTime(audio.currentTime)}</span>
                        <span>{currentTrack?.duration}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-6">
                      <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white" onClick={audio.prevTrack} data-testid="button-prev-track">
                        <SkipBack size={22} />
                      </Button>
                      <button
                        onClick={audio.togglePlay}
                        className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10"
                        data-testid="button-play-pause"
                      >
                        {audio.isBuffering ? (
                          <Loader2 size={22} className="animate-spin" />
                        ) : audio.isPlaying ? (
                          <Pause size={22} fill="currentColor" />
                        ) : (
                          <Play size={22} fill="currentColor" className="ml-0.5" />
                        )}
                      </button>
                      <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white" onClick={audio.nextTrack} data-testid="button-next-track">
                        <SkipForward size={22} />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <button onClick={audio.toggleMute} className="text-neutral-400 hover:text-white transition-colors" data-testid="button-mute">
                        {audio.muted || audio.volume === 0 ? <VolumeX size={16} /> : audio.volume < 50 ? <Volume1 size={16} /> : <Volume2 size={16} />}
                      </button>
                      <Slider
                        value={[audio.muted ? 0 : audio.volume]}
                        max={100}
                        step={1}
                        className="w-full cursor-pointer"
                        onValueChange={audio.changeVolume}
                        data-testid="slider-volume"
                      />
                      <span className="text-[10px] text-neutral-500 font-mono w-7 text-right shrink-0">{audio.muted ? 0 : audio.volume}%</span>
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
                    {audio.tracks.map((track, idx) => (
                      <div
                        key={track.id}
                        onClick={() => { audio.selectTrack(idx); setShowPlaylist(false); }}
                        className={cn(
                          "flex items-center p-2.5 rounded-xl cursor-pointer transition-colors",
                          idx === audio.currentTrackIndex ? "bg-white/10" : "hover:bg-white/5"
                        )}
                        data-testid={`track-item-${idx}`}
                      >
                        <div className="w-9 h-9 rounded-md bg-neutral-800 overflow-hidden relative mr-3 shrink-0">
                          <img src={track.cover} className="w-full h-full object-cover" alt={track.album} />
                          {idx === audio.currentTrackIndex && audio.isPlaying && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={cn("text-sm font-medium truncate", idx === audio.currentTrackIndex ? "text-white" : "text-neutral-300")}>{track.title}</h4>
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
