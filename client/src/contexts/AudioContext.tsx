import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from "react";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  duration: string;
  durationSec: number;
  audioUrl: string;
}

interface AudioState {
  tracks: Track[];
  currentTrackIndex: number;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  volume: number;
  muted: boolean;
  liked: Set<string>;
  selectedGenre: string;
}

interface AudioContextType extends AudioState {
  setTracks: (tracks: Track[]) => void;
  setCurrentTrackIndex: (idx: number) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (val: number[]) => void;
  selectTrack: (idx: number) => void;
  changeVolume: (val: number[]) => void;
  toggleMute: () => void;
  toggleLike: (id: string) => void;
  changeGenre: (genre: string) => void;
  currentTrack: Track | undefined;
}

const AudioCtx = createContext<AudioContextType | null>(null);

export function useAudio() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracksState] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [selectedGenre, setSelectedGenre] = useState("chillout");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<number | null>(null);
  const currentTrackIdRef = useRef<string | null>(null);

  const currentTrack = tracks.length > 0 ? tracks[currentTrackIndex] : undefined;

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
    if (!currentTrack) return;
    if (currentTrackIdRef.current === currentTrack.id) return;
    currentTrackIdRef.current = currentTrack.id;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
      stopProgressTracking();
    }

    const audio = new Audio(currentTrack.audioUrl);
    audio.volume = muted ? 0 : volume / 100;
    audioRef.current = audio;

    const handleEnded = () => {
      stopProgressTracking();
      if (tracks.length > 1) {
        setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
        currentTrackIdRef.current = null;
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener("ended", handleEnded);

    if (isPlaying) {
      audio.play().catch(() => {});
      startProgressTracking();
    }

    setProgress(0);
    setCurrentTime(0);

    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentTrack?.id]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      stopProgressTracking();
    } else {
      audioRef.current.play().catch(() => {});
      startProgressTracking();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, currentTrack, stopProgressTracking, startProgressTracking]);

  const nextTrack = useCallback(() => {
    if (tracks.length === 0) return;
    currentTrackIdRef.current = null;
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
    setIsPlaying(true);
  }, [tracks.length]);

  const prevTrack = useCallback(() => {
    if (tracks.length === 0) return;
    currentTrackIdRef.current = null;
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  }, [tracks.length]);

  const seekTo = useCallback((val: number[]) => {
    if (!audioRef.current) return;
    const pct = val[0];
    const dur = audioRef.current.duration || 0;
    audioRef.current.currentTime = (pct / 100) * dur;
    setProgress(pct);
  }, []);

  const selectTrack = useCallback((idx: number) => {
    currentTrackIdRef.current = null;
    setCurrentTrackIndex(idx);
    setIsPlaying(true);
  }, []);

  const changeVolume = useCallback((val: number[]) => {
    const v = val[0];
    setVolume(v);
    setMuted(v === 0);
    if (audioRef.current) {
      audioRef.current.volume = v / 100;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const newMuted = !prev;
      if (audioRef.current) {
        audioRef.current.volume = newMuted ? 0 : volume / 100;
      }
      return newMuted;
    });
  }, [volume]);

  const toggleLike = useCallback((id: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setTracks = useCallback((newTracks: Track[]) => {
    setTracksState(newTracks);
  }, []);

  const changeGenre = useCallback((genre: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    currentTrackIdRef.current = null;
    setSelectedGenre(genre);
    setCurrentTrackIndex(0);
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    stopProgressTracking();
  }, [stopProgressTracking]);

  return (
    <AudioCtx.Provider
      value={{
        tracks,
        currentTrackIndex,
        isPlaying,
        progress,
        currentTime,
        volume,
        muted,
        liked,
        selectedGenre,
        currentTrack,
        setTracks,
        setCurrentTrackIndex,
        togglePlay,
        nextTrack,
        prevTrack,
        seekTo,
        selectTrack,
        changeVolume,
        toggleMute,
        toggleLike,
        changeGenre,
      }}
    >
      {children}
    </AudioCtx.Provider>
  );
}
