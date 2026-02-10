import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Brain, Music, Settings, ChevronRight, Volume2, X } from "lucide-react";
import { PodFrame } from "@/components/layout/PodFrame";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const menuItems = [
  { id: "ads", title: "Marketplace", icon: ShoppingBag, color: "bg-blue-500", href: "/ads" },
  { id: "trivia", title: "Trivia Challenge", icon: Brain, color: "bg-purple-500", href: "/trivia" },
  { id: "music", title: "My Music", icon: Music, color: "bg-pink-500", href: "/music" },
];

export default function Home() {
  const [showVolume, setShowVolume] = useState(false);
  const [volume, setVolume] = useState(75);

  return (
    <PodFrame>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="h-full w-full flex flex-col p-6 space-y-6"
      >
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-neutral-400 text-sm font-medium uppercase tracking-wider">Welcome Rider</h2>
          <h1 className="text-3xl font-display font-bold text-white">Dashboard</h1>
        </div>

        {/* Featured Card */}
        <Link href="/ads">
          <div className="w-full aspect-[16/9] rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 p-5 relative overflow-hidden group cursor-pointer">
            <div className="absolute inset-0 bg-[url('/assets/ads-watch.png')] bg-cover bg-center opacity-40 group-hover:opacity-50 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-5 left-5 z-10">
              <span className="bg-white/10 backdrop-blur-md px-2 py-1 rounded-md text-xs font-medium text-white mb-2 inline-block">Sponsored</span>
              <h3 className="text-xl font-bold text-white">Exclusive Offers</h3>
              <p className="text-neutral-300 text-sm">Discover premium brands while you ride.</p>
            </div>
          </div>
        </Link>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 gap-2">
          {menuItems.map((item) => (
            <Link key={item.id} href={item.href}>
              <div className="flex items-center p-2.5 bg-neutral-900/50 border border-white/5 hover:bg-white/5 rounded-xl transition-all active:scale-[0.98] cursor-pointer group">
                <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center text-white shadow-lg`}>
                  <item.icon size={16} />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{item.title}</h3>
                </div>
                <ChevronRight size={16} className="text-neutral-600 group-hover:text-white transition-colors" />
              </div>
            </Link>
          ))}
          
          {/* Volume Control Button */}
          <div 
            onClick={() => setShowVolume(true)}
            className="flex items-center p-2.5 bg-neutral-900/50 border border-white/5 hover:bg-white/5 rounded-xl transition-all active:scale-[0.98] cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-500 flex items-center justify-center text-white shadow-lg">
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
              className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center"
              onClick={() => setShowVolume(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-full bg-neutral-900 rounded-t-[2rem] border-t border-white/10 p-8 pb-12"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-white">System Volume</h2>
                  <button 
                    onClick={() => setShowVolume(false)}
                    className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white"
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
