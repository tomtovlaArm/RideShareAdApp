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
  isBuffering: boolean;
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

const sharedAudio = (() => {
  const a = new Audio();
  a.preload = "auto";
  return a;
})();

let webAudioCtx: AudioContext | null = null;
let gainNode: GainNode | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;

function ensureWebAudio() {
  if (webAudioCtx) return;
  try {
    webAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    sourceNode = webAudioCtx.createMediaElementSource(sharedAudio);
    gainNode = webAudioCtx.createGain();
    gainNode.gain.value = 0.8;
    sourceNode.connect(gainNode);
    gainNode.connect(webAudioCtx.destination);
  } catch (err) {
    console.warn("Web Audio API init failed:", err);
  }
}

function setGainVolume(vol: number) {
  if (gainNode) {
    gainNode.gain.value = vol;
  }
}

async function resumeWebAudio() {
  if (webAudioCtx && webAudioCtx.state === "suspended") {
    await webAudioCtx.resume().catch(console.warn);
  }
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracksState] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [selectedGenre, setSelectedGenre] = useState("electronic");
  const tracksRef = useRef<Track[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const loadedTrackIdRef = useRef<string | null>(null);

  tracksRef.current = tracks;

  const currentTrack = tracks.length > 0 && currentTrackIndex < tracks.length
    ? tracks[currentTrackIndex]
    : undefined;

  const audio = sharedAudio;

  const startProgressLoop = useCallback(() => {
    const tick = () => {
      if (audio && !audio.paused && isFinite(audio.duration) && audio.duration > 0) {
        setCurrentTime(audio.currentTime);
        setProgress((audio.currentTime / audio.duration) * 100);
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(tick);
  }, [audio]);

  const stopProgressLoop = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    const a = audio;

    const onPlaying = () => {
      setIsPlaying(true);
      setIsBuffering(false);
      startProgressLoop();
    };
    const onPause = () => {
      setIsPlaying(false);
      stopProgressLoop();
    };
    const onWaiting = () => {
      setIsBuffering(true);
    };
    const onCanPlay = () => {
      setIsBuffering(false);
    };
    const onEnded = () => {
      setIsPlaying(false);
      stopProgressLoop();
      const t = tracksRef.current;
      if (t.length > 1) {
        setCurrentTrackIndex(prev => {
          const nextIdx = (prev + 1) % t.length;
          loadedTrackIdRef.current = t[nextIdx].id;
          a.src = t[nextIdx].audioUrl;
          a.play().catch(console.warn);
          return nextIdx;
        });
      } else {
        setProgress(0);
        setCurrentTime(0);
      }
    };
    const onError = (e: Event) => {
      console.error("Audio error:", (e.target as HTMLAudioElement)?.error);
      setIsPlaying(false);
      setIsBuffering(false);
      stopProgressLoop();
    };

    a.addEventListener("playing", onPlaying);
    a.addEventListener("pause", onPause);
    a.addEventListener("waiting", onWaiting);
    a.addEventListener("canplay", onCanPlay);
    a.addEventListener("ended", onEnded);
    a.addEventListener("error", onError);

    return () => {
      a.removeEventListener("playing", onPlaying);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("waiting", onWaiting);
      a.removeEventListener("canplay", onCanPlay);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("error", onError);
      stopProgressLoop();
    };
  }, [audio, startProgressLoop, stopProgressLoop]);

  useEffect(() => {
    const vol = muted ? 0 : volume / 100;
    setGainVolume(vol);
    try { audio.volume = vol; } catch (_) {}
  }, [audio, volume, muted]);

  const playTrack = useCallback(async (track: Track) => {
    try {
      ensureWebAudio();
      await resumeWebAudio();
      loadedTrackIdRef.current = track.id;
      audio.src = track.audioUrl;
      setIsBuffering(true);
      setProgress(0);
      setCurrentTime(0);
      await audio.play();
    } catch (err: any) {
      console.warn("Play failed:", err?.message);
      setIsPlaying(false);
      setIsBuffering(false);
    }
  }, [audio]);

  const togglePlay = useCallback(async () => {
    const track = tracksRef.current[currentTrackIndex];
    if (!track) return;

    ensureWebAudio();
    await resumeWebAudio();

    if (audio.paused) {
      if (loadedTrackIdRef.current === track.id && audio.src) {
        audio.play().catch((err) => {
          console.warn("Resume failed, reloading:", err?.message);
          playTrack(track);
        });
      } else {
        playTrack(track);
      }
    } else {
      audio.pause();
    }
  }, [audio, currentTrackIndex, playTrack]);

  const selectTrack = useCallback((idx: number, autoPlay = true) => {
    const t = tracksRef.current;
    if (idx < 0 || idx >= t.length) return;
    setCurrentTrackIndex(idx);
    if (autoPlay) {
      playTrack(t[idx]);
    } else {
      loadedTrackIdRef.current = t[idx].id;
      audio.src = t[idx].audioUrl;
      audio.load();
      setProgress(0);
      setCurrentTime(0);
    }
  }, [audio, playTrack]);

  const nextTrack = useCallback(() => {
    const t = tracksRef.current;
    if (t.length === 0) return;
    const nextIdx = (currentTrackIndex + 1) % t.length;
    setCurrentTrackIndex(nextIdx);
    playTrack(t[nextIdx]);
  }, [currentTrackIndex, playTrack]);

  const prevTrack = useCallback(() => {
    const t = tracksRef.current;
    if (t.length === 0) return;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const prevIdx = (currentTrackIndex - 1 + t.length) % t.length;
    setCurrentTrackIndex(prevIdx);
    playTrack(t[prevIdx]);
  }, [audio, currentTrackIndex, playTrack]);

  const seekTo = useCallback((val: number[]) => {
    if (!audio.duration || !isFinite(audio.duration)) return;
    const pct = val[0];
    audio.currentTime = (pct / 100) * audio.duration;
    setProgress(pct);
  }, [audio]);

  const changeVolume = useCallback((val: number[]) => {
    const v = val[0];
    setVolume(v);
    setMuted(v === 0);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted(prev => !prev);
  }, []);

  const toggleLike = useCallback((id: string) => {
    setLiked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setTracks = useCallback((newTracks: Track[]) => {
    tracksRef.current = newTracks;
    setTracksState(newTracks);
  }, []);

  const changeGenre = useCallback((genre: string) => {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    loadedTrackIdRef.current = null;
    setSelectedGenre(genre);
    setCurrentTrackIndex(0);
    setIsPlaying(false);
    setIsBuffering(false);
    setProgress(0);
    setCurrentTime(0);
    stopProgressLoop();
  }, [audio, stopProgressLoop]);

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
        isBuffering,
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
