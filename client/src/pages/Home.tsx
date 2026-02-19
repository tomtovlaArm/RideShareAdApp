import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Music, Gamepad2, ChevronRight } from "lucide-react";
import { PodFrame } from "@/components/layout/PodFrame";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import QRCode from "react-qr-code";
import type { Ad } from "@shared/schema";

const menuItems = [
  { id: "trivia", title: "Trivia Challenge", icon: Brain, color: "bg-purple-500", href: "/trivia" },
  { id: "music", title: "My Music", icon: Music, color: "bg-pink-500", href: "/music" },
  { id: "games", title: "Mini Games", icon: Gamepad2, color: "bg-emerald-500", href: "/games" },
];

export default function Home() {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, navigate] = useLocation();
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTitleTap = useCallback(() => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      navigate("/admin");
      return;
    }
    tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 2000);
  }, [navigate]);

  const { data: ads = [] } = useQuery<Ad[]>({
    queryKey: ["/api/ads"],
    queryFn: async () => {
      const res = await fetch("/api/ads");
      if (!res.ok) throw new Error("Failed to load ads");
      return res.json();
    },
  });

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearTimer();

    if (ads.length <= 1) return;

    const safeIndex = currentAdIndex < ads.length ? currentAdIndex : 0;
    const currentAd = ads[safeIndex];
    const duration = (currentAd?.displayDuration || 5) * 1000;

    timerRef.current = setTimeout(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ads.length);
    }, duration);

    return clearTimer;
  }, [currentAdIndex, ads, clearTimer]);

  useEffect(() => {
    if (ads.length === 0) {
      setCurrentAdIndex(0);
    } else if (currentAdIndex >= ads.length) {
      setCurrentAdIndex(0);
    }
  }, [ads.length, currentAdIndex]);

  const goToAd = useCallback((index: number) => {
    clearTimer();
    setCurrentAdIndex(index);
  }, [clearTimer]);

  const featuredAd = ads.length > 0 ? ads[currentAdIndex < ads.length ? currentAdIndex : 0] : undefined;

  return (
    <PodFrame>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="h-full w-full flex flex-row p-5 gap-5"
      >
        <div className="flex flex-col flex-1 min-w-0 gap-3">
          <div className="space-y-0.5 shrink-0">
            <h2 className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Welcome Rider</h2>
            <h1 className="text-2xl font-display font-bold text-white cursor-default select-none" onClick={handleTitleTap}>Dashboard</h1>
          </div>

          <div className="flex flex-row flex-1 gap-3 min-h-0">
            <Link href="/ads" className="block flex-1" data-testid="link-featured-ad">
              <div className="w-full h-full rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 relative overflow-hidden group cursor-pointer">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={featuredAd?.id ?? "empty"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0"
                  >
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
                      <img
                        src={featuredAd.mediaUrl}
                        alt={featuredAd.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[url('/assets/ads-watch.png')] bg-cover bg-center opacity-40 group-hover:opacity-50 transition-opacity duration-500" />
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`text-${featuredAd?.id ?? "empty"}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="absolute bottom-5 left-5 right-5 z-10"
                  >
                    <h3 className="text-xl font-bold text-white" data-testid="text-featured-name">{featuredAd?.name || "Exclusive Offers"}</h3>
                    <p className="text-neutral-300 text-sm" data-testid="text-featured-description">{featuredAd?.description || "Discover premium brands while you ride."}</p>
                  </motion.div>
                </AnimatePresence>

                {ads.length > 1 && (
                  <div className="absolute bottom-2 right-3 z-10 flex gap-1.5" data-testid="carousel-dots">
                    {ads.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); goToAd(i); }}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full transition-all duration-300",
                          i === currentAdIndex ? "bg-white w-4" : "bg-white/40 hover:bg-white/60"
                        )}
                        data-testid={`carousel-dot-${i}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Link>
            {featuredAd?.qrUrl && (
              <div className="flex flex-col items-end justify-end shrink-0 pb-1" data-testid="qr-code-dashboard">
                <div className="bg-white p-2 rounded-xl shadow-lg">
                  <QRCode value={featuredAd.qrUrl} size={56} />
                </div>
                <p className="text-neutral-500 text-[9px] mt-1.5 text-center w-full uppercase tracking-wider">Scan Me</p>
              </div>
            )}
          </div>
        </div>

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
        </div>


      </motion.div>
    </PodFrame>
  );
}
