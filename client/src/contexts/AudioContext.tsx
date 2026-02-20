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
  selectTrack: (idx: number, autoPlay?: boolean) => void;
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
globalAudio.crossOrigin = "anonymous";
globalAudio.preload = "auto";

let webAudioCtx: AudioContext | null = null;
let gainNode: GainNode | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;
let webAudioInitialized = false;

function initWebAudio() {
  if (webAudioInitialized) return;
  try {
    webAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    gainNode = webAudioCtx.createGain();
    sourceNode = webAudioCtx.createMediaElementSource(globalAudio);
    sourceNode.connect(gainNode);
    gainNode.connect(webAudioCtx.destination);
    webAudioInitialized = true;
  } catch (e) {
    console.warn("Web Audio API not available, falling back to HTML5 volume");
  }
}

function setGainVolume(vol: number) {
  if (gainNode) {
    gainNode.gain.value = vol;
  } else {
    globalAudio.volume = vol;
  }
}

function resumeWebAudio() {
  if (webAudioCtx && webAudioCtx.state === "suspended") {
    webAudioCtx.resume().catch(() => {});
  }
}

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
  const userInteracted = useRef(false);

  tracksRef.current = tracks;
  const currentTrack = tracks.length > 0 && currentTrackIndex < tracks.length
    ? tracks[currentTrackIndex]
    : undefined;

  useEffect(() => {
    const handleInteraction = () => {
      if (!userInteracted.current) {
        userInteracted.current = true;
        initWebAudio();
      }
      resumeWebAudio();
    };
    const events = ["touchstart", "touchend", "click", "pointerdown"];
    events.forEach((e) => document.addEventListener(e, handleInteraction, { once: false, passive: true }));
    return () => {
      events.forEach((e) => document.removeEventListener(e, handleInteraction));
    };
  }, []);

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
    const vol = muted ? 0 : volume / 100;
    setGainVolume(vol);
  }, [volume, muted]);

  useEffect(() => {
    const handlePlay = () => {
      setIsPlaying(true);
      startProgressTracking();
    };
    const handlePause = () => {
      setIsPlaying(false);
      stopProgressTracking();
    };
    const handleError = () => {
      console.error("Audio playback error:", globalAudio.error);
      setIsPlaying(false);
      stopProgressTracking();
    };

    globalAudio.addEventListener("play", handlePlay);
    globalAudio.addEventListener("pause", handlePause);
    globalAudio.addEventListener("error", handleError);

    return () => {
      globalAudio.removeEventListener("play", handlePlay);
      globalAudio.removeEventListener("pause", handlePause);
      globalAudio.removeEventListener("error", handleError);
    };
  }, [startProgressTracking, stopProgressTracking]);

  const autoNextRef = useRef<(() => void) | null>(null);

  autoNextRef.current = () => {
    stopProgressTracking();
    const t = tracksRef.current;
    if (t.length > 1) {
      const curIdx = t.findIndex(tr => tr.id === playingTrackId.current);
      const nextIdx = (curIdx + 1) % t.length;
      playingTrackId.current = null;
      setCurrentTrackIndexState(nextIdx);
      const nextTrack = t[nextIdx];
      playingTrackId.current = nextTrack.id;
      globalAudio.src = nextTrack.audioUrl;
      setGainVolume(muted ? 0 : volume / 100);
      resumeWebAudio();
      globalAudio.play().catch(() => {
        setIsPlaying(false);
        stopProgressTracking();
      });
    } else {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    }
  };

  useEffect(() => {
    const handleEnded = () => {
      autoNextRef.current?.();
    };

    globalAudio.addEventListener("ended", handleEnded);
    return () => {
      globalAudio.removeEventListener("ended", handleEnded);
      stopProgressTracking();
    };
  }, []);

  const safePlay = useCallback(() => {
    return globalAudio.play().catch((err) => {
      console.warn("Play blocked:", err.message);
      setIsPlaying(false);
      stopProgressTracking();
    });
  }, [stopProgressTracking]);

  const loadAndPlay = useCallback((track: Track) => {
    if (playingTrackId.current === track.id) return;
    initWebAudio();
    resumeWebAudio();
    playingTrackId.current = track.id;
    globalAudio.src = track.audioUrl;
    setGainVolume(muted ? 0 : volume / 100);
    setProgress(0);
    setCurrentTime(0);
    safePlay();
  }, [muted, volume, safePlay]);

  const loadWithoutPlay = useCallback((track: Track) => {
    playingTrackId.current = track.id;
    globalAudio.src = track.audioUrl;
    globalAudio.load();
    setGainVolume(muted ? 0 : volume / 100);
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(false);
  }, [muted, volume]);

  const togglePlay = useCallback(() => {
    if (!currentTrack) return;
    initWebAudio();
    resumeWebAudio();
    if (globalAudio.paused || !globalAudio.src) {
      if (!globalAudio.src || playingTrackId.current !== currentTrack.id) {
        playingTrackId.current = currentTrack.id;
        globalAudio.src = currentTrack.audioUrl;
      }
      safePlay();
    } else {
      globalAudio.pause();
    }
  }, [currentTrack, safePlay]);

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

  const selectTrack = useCallback((idx: number, autoPlay = true) => {
    const t = tracksRef.current;
    if (idx < 0 || idx >= t.length) return;
    setCurrentTrackIndexState(idx);
    playingTrackId.current = null;
    if (autoPlay) {
      loadAndPlay(t[idx]);
    } else {
      loadWithoutPlay(t[idx]);
    }
  }, [loadAndPlay, loadWithoutPlay]);

  const changeVolume = useCallback((val: number[]) => {
    const v = val[0];
    setVolume(v);
    setMuted(v === 0);
    setGainVolume(v / 100);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const newMuted = !prev;
      setGainVolume(newMuted ? 0 : volume / 100);
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
