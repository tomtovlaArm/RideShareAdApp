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

interface AudioContextType {
  tracks: Track[];
  currentTrackIndex: number;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  volume: number;
  muted: boolean;
  liked: Set<string>;
  selectedGenre: string;
  currentTrack: Track | undefined;
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
}

const AudioCtx = createContext<AudioContextType | null>(null);

export function useAudio() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
}

const globalAudio = new Audio();

export function AudioProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracksState] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndexState] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [selectedGenre, setSelectedGenre] = useState("electronic");
  const progressInterval = useRef<number | null>(null);
  const tracksRef = useRef<Track[]>([]);
  const playingTrackId = useRef<string | null>(null);

  tracksRef.current = tracks;
  const currentTrack = tracks.length > 0 && currentTrackIndex < tracks.length
    ? tracks[currentTrackIndex]
    : undefined;

  const stopProgressTracking = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  }, []);

  const startProgressTracking = useCallback(() => {
    stopProgressTracking();
    progressInterval.current = window.setInterval(() => {
      if (globalAudio && !globalAudio.paused && globalAudio.duration) {
        setCurrentTime(globalAudio.currentTime);
        setProgress((globalAudio.currentTime / globalAudio.duration) * 100);
      }
    }, 500);
  }, [stopProgressTracking]);

  useEffect(() => {
    globalAudio.volume = muted ? 0 : volume / 100;

    const handleEnded = () => {
      stopProgressTracking();
      const t = tracksRef.current;
      if (t.length > 1) {
        const nextIdx = (tracksRef.current.findIndex(tr => tr.id === playingTrackId.current) + 1) % t.length;
        playingTrackId.current = null;
        setCurrentTrackIndexState(nextIdx);
      } else {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
      }
    };

    globalAudio.addEventListener("ended", handleEnded);
    return () => {
      globalAudio.removeEventListener("ended", handleEnded);
      stopProgressTracking();
    };
  }, []);

  const loadAndPlay = useCallback((track: Track) => {
    if (playingTrackId.current === track.id) return;
    playingTrackId.current = track.id;
    globalAudio.src = track.audioUrl;
    globalAudio.volume = muted ? 0 : volume / 100;
    globalAudio.play().catch(() => {});
    setIsPlaying(true);
    setProgress(0);
    setCurrentTime(0);
    startProgressTracking();
  }, [muted, volume, startProgressTracking]);

  const togglePlay = useCallback(() => {
    if (!currentTrack) return;
    if (globalAudio.paused || !globalAudio.src) {
      if (!globalAudio.src || playingTrackId.current !== currentTrack.id) {
        playingTrackId.current = currentTrack.id;
        globalAudio.src = currentTrack.audioUrl;
      }
      globalAudio.play().catch(() => {});
      startProgressTracking();
      setIsPlaying(true);
    } else {
      globalAudio.pause();
      stopProgressTracking();
      setIsPlaying(false);
    }
  }, [currentTrack, startProgressTracking, stopProgressTracking]);

  const nextTrack = useCallback(() => {
    const t = tracksRef.current;
    if (t.length === 0) return;
    const nextIdx = (tracksRef.current.findIndex(tr => tr.id === playingTrackId.current) + 1) % t.length;
    playingTrackId.current = null;
    setCurrentTrackIndexState(nextIdx);
    loadAndPlay(t[nextIdx]);
  }, [loadAndPlay]);

  const prevTrack = useCallback(() => {
    const t = tracksRef.current;
    if (t.length === 0) return;
    const curIdx = tracksRef.current.findIndex(tr => tr.id === playingTrackId.current);
    const prevIdx = (curIdx - 1 + t.length) % t.length;
    playingTrackId.current = null;
    setCurrentTrackIndexState(prevIdx);
    loadAndPlay(t[prevIdx]);
  }, [loadAndPlay]);

  const seekTo = useCallback((val: number[]) => {
    if (!globalAudio.duration) return;
    const pct = val[0];
    globalAudio.currentTime = (pct / 100) * globalAudio.duration;
    setProgress(pct);
  }, []);

  const selectTrack = useCallback((idx: number) => {
    const t = tracksRef.current;
    if (idx < 0 || idx >= t.length) return;
    setCurrentTrackIndexState(idx);
    playingTrackId.current = null;
    loadAndPlay(t[idx]);
  }, [loadAndPlay]);

  const changeVolume = useCallback((val: number[]) => {
    const v = val[0];
    setVolume(v);
    setMuted(v === 0);
    globalAudio.volume = v / 100;
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const newMuted = !prev;
      globalAudio.volume = newMuted ? 0 : volume / 100;
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
    setTracksState((prev) => {
      if (prev.length > 0 && prev[0]?.id === newTracks[0]?.id) return prev;
      return newTracks;
    });
  }, []);

  const changeGenre = useCallback((genre: string) => {
    globalAudio.pause();
    globalAudio.removeAttribute("src");
    playingTrackId.current = null;
    setSelectedGenre(genre);
    setCurrentTrackIndexState(0);
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
        setCurrentTrackIndex: setCurrentTrackIndexState,
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
