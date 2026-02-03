import { Link } from "wouter";
import { motion } from "framer-motion";
import { ShoppingBag, Brain, Music, Settings, ChevronRight } from "lucide-react";
import { PodFrame } from "@/components/layout/PodFrame";

const menuItems = [
  { id: "ads", title: "Marketplace", icon: ShoppingBag, color: "bg-blue-500", href: "/ads" },
  { id: "trivia", title: "Trivia Challenge", icon: Brain, color: "bg-purple-500", href: "/trivia" },
  { id: "music", title: "My Music", icon: Music, color: "bg-pink-500", href: "/music" },
  { id: "settings", title: "Settings", icon: Settings, color: "bg-neutral-500", href: "/settings" },
];

export default function Home() {
  return (
    <PodFrame>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="h-full w-full flex flex-col p-6 space-y-8"
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
        <div className="grid grid-cols-1 gap-3">
          {menuItems.map((item) => (
            <Link key={item.id} href={item.href}>
              <div className="flex items-center p-4 bg-neutral-900/50 border border-white/5 hover:bg-white/5 rounded-xl transition-all active:scale-[0.98] cursor-pointer group">
                <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center text-white shadow-lg`}>
                  <item.icon size={24} />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">{item.title}</h3>
                </div>
                <ChevronRight className="text-neutral-600 group-hover:text-white transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </motion.div>
    </PodFrame>
  );
}
