import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { PodFrame } from "@/components/layout/PodFrame";
import { ArrowLeft, ArrowRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

const products = [
  {
    id: 1,
    name: "Chronos Elite",
    brand: "LuxeTime",
    price: "$4,500",
    image: "/assets/ads-watch.png",
    description: "Precision engineering meets timeless elegance. The Chronos Elite is crafted for those who value every second.",
  },
  {
    id: 2,
    name: "Sonic Pro X",
    brand: "AudioTech",
    price: "$399",
    image: "/assets/ads-headphones.png",
    description: "Immerse yourself in pure sound. Active noise cancellation and 40-hour battery life for the longest journeys.",
  },
  {
    id: 3,
    name: "Midnight Rose",
    brand: "Maison Scent",
    price: "$180",
    image: "/assets/ads-perfume.png",
    description: "A captivating blend of dark rose, amber, and vanilla. Leave a lasting impression wherever you go.",
  },
];

export default function Ads() {
  const [, setLocation] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  return (
    <PodFrame onBack={() => setLocation("/")} showBack>
      <div className="h-full flex flex-col relative">
        <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />
        
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col"
            >
              {/* Image Section */}
              <div className="h-[55%] w-full relative">
                <img 
                  src={products[currentIndex].image} 
                  alt={products[currentIndex].name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              </div>

              {/* Content Section */}
              <div className="flex-1 p-6 flex flex-col justify-between bg-black/50 backdrop-blur-sm -mt-12 z-10 relative">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-400 font-bold tracking-wider text-xs uppercase">{products[currentIndex].brand}</span>
                    <span className="text-white font-mono">{products[currentIndex].price}</span>
                  </div>
                  <h1 className="text-3xl font-display font-bold text-white mb-3">{products[currentIndex].name}</h1>
                  <p className="text-neutral-400 text-sm leading-relaxed">{products[currentIndex].description}</p>
                </div>

                <div className="flex gap-3 mt-4">
                    <Button className="flex-1 bg-white text-black hover:bg-neutral-200 font-semibold h-12 rounded-full">
                        View Details
                    </Button>
                    <Button className="w-12 h-12 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 p-0 flex items-center justify-center">
                        <ShoppingCart size={20} />
                    </Button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-2 pointer-events-none">
            <button onClick={prevSlide} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto hover:bg-black/60 transition">
                <ArrowLeft size={20} />
            </button>
            <button onClick={nextSlide} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto hover:bg-black/60 transition">
                <ArrowRight size={20} />
            </button>
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="h-8 flex items-center justify-center gap-2 mb-4">
            {products.map((_, idx) => (
                <div 
                    key={idx} 
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white w-4' : 'bg-neutral-600'}`}
                />
            ))}
        </div>
      </div>
    </PodFrame>
  );
}
