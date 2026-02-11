import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { PodFrame } from "@/components/layout/PodFrame";
import { ArrowLeft, ArrowRight, ShoppingCart, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductAd {
  id: number;
  name: string;
  brand: string;
  price: string;
  type: "image" | "video";
  image?: string;
  video?: string;
  description: string;
}

const products: ProductAd[] = [
  {
    id: 1,
    name: "Featured Video",
    brand: "Sponsored",
    price: "",
    type: "video",
    video: "/assets/ad-video-1.mp4",
    description: "Watch this exclusive ad brought to you by our sponsors.",
  },
  {
    id: 2,
    name: "Chronos Elite",
    brand: "LuxeTime",
    price: "$4,500",
    type: "image",
    image: "/assets/ads-watch.png",
    description: "Precision engineering meets timeless elegance. The Chronos Elite is crafted for those who value every second.",
  },
  {
    id: 3,
    name: "Sonic Pro X",
    brand: "AudioTech",
    price: "$399",
    type: "image",
    image: "/assets/ads-headphones.png",
    description: "Immerse yourself in pure sound. Active noise cancellation and 40-hour battery life for the longest journeys.",
  },
  {
    id: 4,
    name: "Midnight Rose",
    brand: "Maison Scent",
    price: "$180",
    type: "image",
    image: "/assets/ads-perfume.png",
    description: "A captivating blend of dark rose, amber, and vanilla. Leave a lasting impression wherever you go.",
  },
];

function VideoPlayer({ src, isActive }: { src: string; isActive: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

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
    <div className="w-full h-full relative">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
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

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const currentProduct = products[currentIndex];

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
              {currentProduct.type === "video" && currentProduct.video ? (
                <VideoPlayer src={currentProduct.video} isActive={true} />
              ) : (
                <img 
                  src={currentProduct.image} 
                  alt={currentProduct.name}
                  className="w-full h-full object-cover"
                  data-testid={`img-ad-${currentProduct.id}`}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/60 pointer-events-none" />
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-3 pointer-events-none z-20">
            <button onClick={prevSlide} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto hover:bg-black/60 transition" data-testid="button-prev-ad">
              <ArrowLeft size={20} />
            </button>
            <button onClick={nextSlide} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto hover:bg-black/60 transition" data-testid="button-next-ad">
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        {/* Content Section - Right */}
        <div className="w-[280px] shrink-0 p-6 flex flex-col justify-between bg-black/70 backdrop-blur-sm relative z-10">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-blue-400 font-bold tracking-wider text-xs uppercase" data-testid="text-ad-brand">{currentProduct.brand}</span>
              <span className="text-white font-mono text-sm" data-testid="text-ad-price">{currentProduct.price}</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-white mb-3" data-testid="text-ad-name">{currentProduct.name}</h1>
            <p className="text-neutral-400 text-sm leading-relaxed" data-testid="text-ad-description">{currentProduct.description}</p>

            {currentProduct.type === "video" && (
              <span className="inline-block mt-3 px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded-md text-blue-400 text-xs font-medium">Video Ad</span>
            )}
          </div>

          <div className="space-y-3">
            {/* Pagination Dots */}
            <div className="flex items-center justify-center gap-2">
              {products.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white w-4' : 'bg-neutral-600'}`}
                  data-testid={`dot-ad-${idx}`}
                />
              ))}
            </div>

            <Button className="w-full bg-white text-black hover:bg-neutral-200 font-semibold h-11 rounded-full" data-testid="button-view-details">
              View Details
            </Button>
            <Button className="w-full h-11 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 flex items-center justify-center gap-2" data-testid="button-add-cart">
              <ShoppingCart size={18} />
              <span className="text-sm">Add to Cart</span>
            </Button>
          </div>
        </div>
      </div>
    </PodFrame>
  );
}
