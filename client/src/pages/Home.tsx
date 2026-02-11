import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Music, ChevronRight, Volume2, X } from "lucide-react";
import { PodFrame } from "@/components/layout/PodFrame";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { Ad } from "@shared/schema";

const menuItems = [
  { id: "trivia", title: "Trivia Challenge", icon: Brain, color: "bg-purple-500", href: "/trivia" },
  { id: "music", title: "My Music", icon: Music, color: "bg-pink-500", href: "/music" },
];

export default function Home() {
  const [showVolume, setShowVolume] = useState(false);
  const [volume, setVolume] = useState(75);

  const { data: ads = [] } = useQuery<Ad[]>({
    queryKey: ["/api/ads"],
    queryFn: async () => {
      const res = await fetch("/api/ads");
      if (!res.ok) throw new Error("Failed to load ads");
      return res.json();
    },
  });

  const featuredAd = ads[0];

  return (
    <PodFrame>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="h-full w-full flex flex-row p-5 gap-5"
      >
        {/* Left: Header + Featured Ad Card */}
        <div className="flex flex-col flex-1 min-w-0 gap-3">
          <div className="space-y-0.5 shrink-0">
            <h2 className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Welcome Rider</h2>
            <h1 className="text-2xl font-display font-bold text-white">Dashboard</h1>
          </div>

          <Link href="/ads" className="block flex-1" data-testid="link-featured-ad">
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 relative overflow-hidden group cursor-pointer">
              {featuredAd?.type === "video" ? (
                <video
                  src={featuredAd.mediaUrl}
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : featuredAd?.mediaUrl ? (
                <div className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-50 transition-opacity duration-500" style={{ backgroundImage: `url(${featuredAd.mediaUrl})` }} />
              ) : (
                <div className="absolute inset-0 bg-[url('/assets/ads-watch.png')] bg-cover bg-center opacity-40 group-hover:opacity-50 transition-opacity duration-500" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-5 left-5 z-10">
                <span className="bg-white/10 backdrop-blur-md px-2 py-1 rounded-md text-xs font-medium text-white mb-2 inline-block" data-testid="badge-sponsored">Sponsored</span>
                <h3 className="text-xl font-bold text-white" data-testid="text-featured-name">{featuredAd?.name || "Exclusive Offers"}</h3>
                <p className="text-neutral-300 text-sm" data-testid="text-featured-description">{featuredAd?.description || "Discover premium brands while you ride."}</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Right: Menu */}
        <div className="flex flex-col gap-2 w-[220px] justify-center shrink-0">
          {menuItems.map((item) => (
            <Link key={item.id} href={item.href} data-testid={`link-menu-${item.id}`}>
              <div className="flex items-center p-2.5 bg-neutral-900/50 border border-white/5 hover:bg-white/5 rounded-lg transition-all active:scale-[0.98] cursor-pointer group">
                <div className={`w-8 h-8 rounded-md ${item.color} flex items-center justify-center text-white shadow-lg`}>
                  <item.icon size={16} />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{item.title}</h3>
                </div>
                <ChevronRight size={16} className="text-neutral-600 group-hover:text-white transition-colors" />
              </div>
            </Link>
          ))}
          
          <div 
            onClick={() => setShowVolume(true)}
            className="flex items-center p-2.5 bg-neutral-900/50 border border-white/5 hover:bg-white/5 rounded-lg transition-all active:scale-[0.98] cursor-pointer group"
            data-testid="button-volume"
          >
            <div className="w-8 h-8 rounded-md bg-neutral-500 flex items-center justify-center text-white shadow-lg">
              <Volume2 size={16} />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">Volume</h3>
            </div>
            <ChevronRight size={16} className="text-neutral-600 group-hover:text-white transition-colors" />
          </div>
        </div>

        {/* Volume Overlay */}
        <AnimatePresence>
          {showVolume && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
              onClick={() => setShowVolume(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-[400px] bg-neutral-900 rounded-2xl border border-white/10 p-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-white">System Volume</h2>
                  <button 
                    onClick={() => setShowVolume(false)}
                    className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white"
                    data-testid="button-close-volume"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div className="flex items-center gap-4 mb-4">
                  <Volume2 size={24} className="text-neutral-400" />
                  <Slider
                    value={[volume]}
                    max={100}
                    step={1}
                    onValueChange={(val) => setVolume(val[0])}
                    className="flex-1"
                  />
                  <span className="w-12 text-right font-mono text-white">{volume}%</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </PodFrame>
  );
}
