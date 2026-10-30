import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useCatalog } from '../data';
import { useZoom } from '../components/layout/ZoomContext';
import { ArtworkBadge } from '../components/artwork/PriceTag';

export default function ArchivePage() {
  const zoom = useZoom();
  const { archive } = useCatalog();

  return (
    <main className="flex-1 relative w-full overflow-hidden z-10 bg-bg">
      {/* Fixed Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
        <div className="font-sans text-text-muted text-sm md:text-base mb-1 tracking-widest px-4 py-1 rounded-full">({archive.length})</div>
        <div className="font-sans text-text-strong text-2xl md:text-3xl tracking-widest font-bold px-6 py-2 rounded-full mt-2">ARCHIVE</div>
      </div>

      {/* Scrollable Area */}
      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden no-scrollbar z-10">
        <div className="relative w-full min-h-full pt-16 md:pt-32 pb-32 px-4 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 md:gap-x-12 gap-y-12 md:gap-y-32">
            {archive.map((item, i) => {
              const justify = ['justify-start', 'justify-center', 'justify-end'][(i * 7) % 3];
              const marginTop = [0, 60, 120, 30, 90][i % 5];

              return (
                <motion.div
                  key={`archive-${item.id}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: (i % 10) * 0.05 }}
                  className={`flex ${justify} group`}
                  style={{ marginTop: `${marginTop}px` }}
                >
                  <Link
                    to={`/art/${item.id}`}
                    state={{ from: '/archive', fromLabel: 'ARCHIVE' }}
                    className="flex flex-col items-center"
                    style={{ width: item.width, maxWidth: '100%' }}
                  >
                    <div className="relative w-full aspect-square overflow-hidden mb-3">
                      <img
                        src={item.thumb}
                        alt={item.title}
                        className="w-full h-full object-cover transition-all duration-500 hover:scale-110 cursor-zoom-in"
                        onClick={(e) => {
                          e.preventDefault();
                          zoom(item.image);
                        }}
                      />
                      <ArtworkBadge artwork={item} className="absolute top-1.5 left-1.5" />
                    </div>
                    <div className="opacity-100 [@media(hover:hover)]:opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center bg-bg/80 px-3 py-1 rounded-full backdrop-blur-sm mt-2">
                      <span className="font-sans text-text-strong text-xs md:text-sm tracking-widest uppercase">{item.title}</span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
