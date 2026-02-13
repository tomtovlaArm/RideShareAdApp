import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { PodFrame } from "@/components/layout/PodFrame";
import { ArrowLeft, ArrowRight, Play, Pause, Volume2, VolumeX, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import QRCode from "react-qr-code";
import type { Ad } from "@shared/schema";

function VideoPlayer({ src, isActive }: { src: string; isActive: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [fitMode, setFitMode] = useState<"cover" | "contain">("cover");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const detectFit = () => {
      const container = containerRef.current;
      if (!container || !video.videoWidth || !video.videoHeight) return;
      const videoRatio = video.videoWidth / video.videoHeight;
      const containerRatio = container.clientWidth / container.clientHeight;
      const diff = Math.abs(videoRatio - containerRatio) / containerRatio;
      setFitMode(diff > 0.3 ? "contain" : "cover");
    };
    video.addEventListener("loadedmetadata", detectFit);
    return () => video.removeEventListener("loadedmetadata", detectFit);
  }, [src]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div ref={containerRef} className="w-full h-full relative bg-black">
      <video
        ref={videoRef}
        src={src}
        className={`w-full h-full ${fitMode === "contain" ? "object-contain" : "object-cover"}`}
        loop
        muted={isMuted}
        playsInline
        data-testid="video-ad-player"
      />
      <div className="absolute bottom-3 right-3 flex gap-2 z-20">
        <button
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition"
          data-testid="button-toggle-play"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button
          onClick={toggleMute}
          className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition"
          data-testid="button-toggle-mute"
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function Ads() {
  const [, setLocation] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: ads = [], isLoading } = useQuery<Ad[]>({
    queryKey: ["/api/ads"],
    queryFn: async () => {
      const res = await fetch("/api/ads");
      if (!res.ok) throw new Error("Failed to load ads");
      return res.json();
    },
  });

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  };

  if (isLoading) {
    return (
      <PodFrame onBack={() => setLocation("/")} showBack>
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      </PodFrame>
    );
  }

  if (ads.length === 0) {
    return (
      <PodFrame onBack={() => setLocation("/")} showBack>
        <div className="h-full flex items-center justify-center text-neutral-500 text-sm">
          No ads available
        </div>
      </PodFrame>
    );
  }

  const currentAd = ads[currentIndex];

  return (
    <PodFrame onBack={() => setLocation("/")} showBack>
      <div className="h-full flex flex-row relative">
        <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none z-10" />
        
        {/* Media Section - Left */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute inset-0"
            >
              {currentAd.type === "video" ? (
                <VideoPlayer src={currentAd.mediaUrl} isActive={true} />
              ) : (
                <img 
                  src={currentAd.mediaUrl} 
                  alt={currentAd.name}
                  className="w-full h-full object-cover"
                  data-testid={`img-ad-${currentAd.id}`}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/60 pointer-events-none" />
            </motion.div>
          </AnimatePresence>

          {ads.length > 1 && (
            <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-3 pointer-events-none z-20">
              <button onClick={prevSlide} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto hover:bg-black/60 transition" data-testid="button-prev-ad">
                <ArrowLeft size={20} />
              </button>
              <button onClick={nextSlide} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto hover:bg-black/60 transition" data-testid="button-next-ad">
                <ArrowRight size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Content Section - Right */}
        <div className="w-[280px] shrink-0 p-6 flex flex-col justify-between bg-black/70 backdrop-blur-sm relative z-10">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-blue-400 font-bold tracking-wider text-xs uppercase" data-testid="text-ad-brand">{currentAd.brand}</span>
              {currentAd.price && <span className="text-white font-mono text-sm" data-testid="text-ad-price">{currentAd.price}</span>}
            </div>
            <h1 className="text-2xl font-display font-bold text-white mb-3" data-testid="text-ad-name">{currentAd.name}</h1>
            <p className="text-neutral-400 text-sm leading-relaxed" data-testid="text-ad-description">{currentAd.description}</p>

            {currentAd.type === "video" && (
              <span className="inline-block mt-3 px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded-md text-blue-400 text-xs font-medium">Video Ad</span>
            )}

            {currentAd.qrUrl && (
              <div className="mt-4 flex items-center gap-3" data-testid="qr-code-section">
                <div className="bg-white p-2 rounded-lg shrink-0" id={`qr-wrap-${currentAd.id}`}>
                  <QRCode value={currentAd.qrUrl} size={72} data-testid={`qr-code-${currentAd.id}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-neutral-500 text-[10px] uppercase tracking-wider font-medium">Scan to visit</p>
                  <div className="flex items-center gap-2">
                    <p className="text-neutral-400 text-xs truncate flex-1">{currentAd.qrUrl}</p>
                    <button
                      onClick={() => {
                        const wrap = document.getElementById(`qr-wrap-${currentAd.id}`);
                        if (!wrap) return;
                        const svg = wrap.querySelector("svg");
                        if (!svg) return;
                        const svgData = new XMLSerializer().serializeToString(svg);
                        const canvas = document.createElement("canvas");
                        const size = 512;
                        canvas.width = size;
                        canvas.height = size;
                        const ctx = canvas.getContext("2d");
                        if (!ctx) return;
                        ctx.fillStyle = "#ffffff";
                        ctx.fillRect(0, 0, size, size);
                        const img = new Image();
                        img.onload = () => {
                          const pad = 32;
                          ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2);
                          const a = document.createElement("a");
                          a.download = `qr-${currentAd.name.replace(/\s+/g, "-").toLowerCase()}.png`;
                          a.href = canvas.toDataURL("image/png");
                          a.click();
                        };
                        img.src = "data:image/svg+xml;base64," + btoa(svgData);
                      }}
                      className="w-7 h-7 rounded-md bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors shrink-0"
                      data-testid={`button-download-qr-${currentAd.id}`}
                      title="Download QR code"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              {ads.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white w-4' : 'bg-neutral-600'}`}
                  data-testid={`dot-ad-${idx}`}
                />
              ))}
            </div>

          </div>
        </div>
      </div>
    </PodFrame>
  );
}
