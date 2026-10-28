import { MapPin } from 'lucide-react';
import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useZoom } from '../components/layout/ZoomContext';
import { PageMain } from '../components/layout/Layout';

export default function AboutPage() {
  const setZoomedImage = useZoom();

  return (
      <PageMain>
      <div className="max-w-4xl mx-auto px-4 py-8 md:p-16 flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center w-full"
        >
          <h2 className="font-sans text-text-strong text-2xl md:text-3xl tracking-widest font-bold uppercase mb-12">ABOUT</h2>
          
          <div className="space-y-16 text-sm md:text-base leading-relaxed text-text-base w-full text-left">
            
            {/* Mission Statement */}
            <section className="flex flex-col items-center text-center space-y-6">
              <p className="text-xl md:text-2xl font-bold leading-relaxed">Seifu arts is a premier digital and physical gallery specializing in the intersection of organic life and synthetic futures.</p>
              <p>Founded in 2026, we curate exhibitions that challenge the boundaries of reality, bringing together artists who envision the next epoch of planetary evolution. Our collections span across multiple dimensions, capturing the essence of what it means to exist in a post-natural world.</p>
              <p className="text-text-muted italic pt-4">"We do not preserve the past; we archive the future."</p>
            </section>

            <div className="w-full h-px bg-border-color opacity-50"></div>

            {/* About the Artist */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="aspect-square bg-border-color/20 overflow-hidden cursor-zoom-in" onClick={() => setZoomedImage("https://picsum.photos/seed/artist/800/800")}>
                <img src="https://picsum.photos/seed/artist/800/800" alt="Aris Seifu" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
              </div>
              <div className="space-y-4">
                <h3 className="text-xl text-text-strong tracking-widest font-bold">// ABOUT THE ARTIST</h3>
                <p>Aris Seifu began his career as a bio-engineer in the lower sectors before discovering a method to crystallize decaying organic matter using synthetic resins. His work explores the fragile dichotomy between the natural world we lost and the artificial one we built to replace it. Seifu's pieces are held in private collections across three star systems.</p>
              </div>
            </section>

            <div className="w-full h-px bg-border-color opacity-50"></div>

            {/* Reviews */}
            <section className="space-y-8">
              <h3 className="text-xl text-text-strong tracking-widest font-bold">// REVIEWS</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="w-full aspect-video bg-border-color/20 overflow-hidden cursor-zoom-in" onClick={() => setZoomedImage("https://picsum.photos/seed/review1/600/400")}>
                    <img src="https://picsum.photos/seed/review1/600/400" alt="Happy Client" className="w-full h-full object-cover transition-all duration-500 hover:scale-105" />
                  </div>
                  <blockquote className="border-l-2 border-accent pl-4">
                    <p className="italic text-text-muted">"A hauntingly beautiful reflection on our synthetic existence. Seifu captures the ghost in the machine."</p>
                    <footer className="mt-2 text-xs text-text-strong">— Neo-Art Quarterly</footer>
                  </blockquote>
                </div>
                <div className="space-y-4">
                  <div className="w-full aspect-video bg-border-color/20 overflow-hidden cursor-zoom-in" onClick={() => setZoomedImage("https://picsum.photos/seed/review2/600/400")}>
                    <img src="https://picsum.photos/seed/review2/600/400" alt="Happy Client" className="w-full h-full object-cover transition-all duration-500 hover:scale-105" />
                  </div>
                  <blockquote className="border-l-2 border-accent pl-4">
                    <p className="italic text-text-muted">"The Floral exhibition left me breathless. It's as if nature itself was paused in a digital stasis."</p>
                    <footer className="mt-2 text-xs text-text-strong">— Curator, The High Orbit Museum</footer>
                  </blockquote>
                </div>
              </div>
            </section>

            <div className="w-full h-px bg-border-color opacity-50"></div>

            {/* Location & Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="space-y-4">
                <h3 className="text-xl text-text-strong tracking-widest font-bold">// LOCATION</h3>
                <p className="flex items-start gap-2">
                  <MapPin size={16} className="mt-1 shrink-0 text-accent" />
                  <span>
                    Level 134, Sector 4<br/>
                    Neo-Tokyo Commercial District<br/>
                    Earth, Sol System
                  </span>
                </p>
              </section>
              <section className="space-y-4">
                <h3 className="text-xl text-text-strong tracking-widest font-bold">// CONTACT US</h3>
                <ul className="space-y-2">
                  <li><span className="text-text-muted">COMM-LINK:</span> +1 (800) 555-0199</li>
                  <li><span className="text-text-muted">DATA-STREAM:</span> contact@seifuarts.net</li>
                  <li><span className="text-text-muted">SECURE-CHANNEL:</span> 0x8F9A...3B2C</li>
                </ul>
              </section>
            </div>

          </div>

          <Link
            to="/"
            className="mt-16 border border-border-color rounded-full px-8 py-3 hover:bg-text-strong hover:text-bg transition-colors tracking-widest text-xs font-bold"
          >
            RETURN TO EXHIBITION
          </Link>

          <div className="w-full h-px bg-border-color opacity-50 mt-24 mb-16"></div>
        </motion.div>
      </div>

      {/* Instagram Gallery */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full space-y-8 pb-16 px-4 md:px-8"
      >
        <h3 className="text-xl text-text-strong tracking-widest font-bold text-center">// COMMUNITY & CLIENTS</h3>
        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-4 space-y-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
            const seeds = [600, 400, 800, 500, 400, 700, 500, 600];
            const src = `https://picsum.photos/seed/ig${i}/400/${seeds[i-1]}`;
            return (
              <img 
                key={`ig-${i}`}
                src={src} 
                alt="Client" 
                className="w-full rounded-none opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500 cursor-zoom-in hover:scale-[1.02]" 
                onClick={() => setZoomedImage(src)}
              />
            );
          })}
        </div>
      </motion.section>
    </PageMain>
  );
}
