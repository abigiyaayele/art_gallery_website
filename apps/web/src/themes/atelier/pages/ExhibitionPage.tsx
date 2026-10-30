import { MapPin } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useCatalog } from '../data';
import { ArtworkBadge, BuyButton, PriceTag } from '../components/artwork/PriceTag';
import { useZoom } from '../components/layout/ZoomContext';

const fromExhibition = { from: '/', fromLabel: 'EXHIBITION' };

export default function ExhibitionPage() {
  const zoom = useZoom();
  const { exhibitions, promotion } = useCatalog();
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<'prev' | 'next' | null>(null);
  const wheelTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeGallery = exhibitions[Math.min(galleryIndex, exhibitions.length - 1)];
  if (!activeGallery) {
    return (
      <main className="flex-1 flex items-center justify-center text-xs tracking-widest text-text-muted">NEW WORK COMING SOON</main>
    );
  }
  const galleryData = activeGallery.items;

  const paginate = (direction: number) => {
    setCurrentIndex(prev => prev + direction);
  };

  const paginateGallery = (direction: number) => {
    const nextIndex = galleryIndex + direction;
    if (nextIndex >= 0 && nextIndex < exhibitions.length) {
      setCurrentIndex(0);
      setGalleryIndex(nextIndex);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (wheelTimeout.current) return;

    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      if (e.deltaX > 20) paginate(1);
      else if (e.deltaX < -20) paginate(-1);
    } else {
      if (e.deltaY > 20) paginate(1);
      else if (e.deltaY < -20) paginate(-1);
    }

    wheelTimeout.current = setTimeout(() => {
      wheelTimeout.current = null;
    }, 500);
  };

  const handleDragEnd = (_e: unknown, { offset }: { offset: { x: number } }) => {
    if (offset.x < -50) paginate(1);
    else if (offset.x > 50) paginate(-1);
  };

  const numVisible = 4; // 9 items total (4 left, 1 center, 4 right)
  const visibleItems = [];
  for (let i = -numVisible; i <= numVisible; i++) {
    const absoluteIndex = currentIndex + i;
    const dataIndex = ((absoluteIndex % galleryData.length) + galleryData.length) % galleryData.length;
    visibleItems.push({
      offset: i,
      absoluteIndex,
      data: galleryData[dataIndex]
    });
  }

  const activeDataIndex = ((currentIndex % galleryData.length) + galleryData.length) % galleryData.length;
  const activeItem = galleryData[activeDataIndex];
  const marqueeText = Array(20).fill(
    `${activeGallery.isPast ? 'PAST EXHIBITION' : 'NOW EXHIBITING'} ✶ ${activeGallery.title} ✶ ${promotion ? `${promotion.title}: ${promotion.message} ✶ ` : ''}`
  ).join('');

  return (
    <>
      {/* Custom Cursor (pointer devices only) */}
      <div
        className={`hidden [@media(hover:hover)]:block fixed pointer-events-none z-50 transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-0'}`}
        style={{ left: mousePos.x, top: mousePos.y, transform: 'translate(-50%, -50%)' }}
      >
        <div className="bg-action-bg text-action-text rounded-full px-4 py-2 text-[10px] font-bold flex items-center gap-2 tracking-widest shadow-lg whitespace-nowrap">
          <span>&larr;</span> DRAG <span>&rarr;</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden min-h-0">
        {/* Top Labels */}
        <div className="flex justify-between px-4 md:px-6 py-2 text-xs tracking-widest shrink-0 text-text-strong uppercase">
          <span>EXHIBITION</span>
          <span>[{String(activeDataIndex + 1).padStart(2, '0')}/{String(galleryData.length).padStart(2, '0')}]</span>
          <span>{activeGallery.title}</span>
        </div>

        {/* Gallery */}
        <div className="flex-1 relative w-full flex items-center justify-center overflow-hidden">
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            onWheel={handleWheel}
            onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className="absolute inset-0 flex items-start justify-center gap-1 md:gap-2 [@media(hover:hover)]:cursor-none pt-4 md:pt-8"
          >
            <AnimatePresence mode="popLayout">
              {visibleItems.map((item) => {
                const isCenter = item.offset === 0;
                return (
                  <motion.div
                    layout
                    key={`${galleryIndex}-${item.absoluteIndex}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: isCenter ? 1 : 0.4, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={`shrink-0 origin-top aspect-square ${
                      isCenter
                        ? 'h-[min(35vh,80vw)] md:h-[40vh] max-h-[400px] z-10 shadow-2xl'
                        : 'h-[min(17.5vh,40vw)] md:h-[20vh] max-h-[200px] z-0'
                    }`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="relative w-full h-full cursor-zoom-in"
                      onClick={() => zoom(item.data.image)}
                    >
                      <img
                        src={isCenter ? item.data.image : item.data.thumb}
                        alt={item.data.alt}
                        className="w-full h-full object-contain transition-all duration-500"
                        draggable={false}
                      />
                      {isCenter && <ArtworkBadge artwork={item.data} className="absolute top-2 left-2" />}
                    </motion.div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>

      {/* Footer Area */}
      <footer className="shrink-0 flex flex-col">
        {/* Mobile Footer */}
        <div className="flex flex-col md:hidden px-4 pb-4 gap-4">
          <div className="flex justify-between items-baseline gap-4">
            <p className="text-text-strong font-bold text-sm tracking-widest truncate">{activeItem.title}</p>
            <PriceTag artwork={activeItem} className="text-xs whitespace-nowrap justify-end" />
          </div>
          <div className="flex justify-center gap-3">
            <Link
              to={`/art/${activeItem.id}`}
              state={fromExhibition}
              className="flex-1 border border-border-color rounded-full px-4 py-2.5 hover:bg-text-strong hover:text-bg transition-colors tracking-widest text-[10px] font-bold text-text-strong text-center"
            >
              FULL STORY
            </Link>
            <BuyButton artwork={activeItem} state={fromExhibition} className="flex-1 py-2.5 px-4 text-[10px]" />
          </div>
        </div>

        {/* Text Columns */}
        <div className="hidden md:grid grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8 px-6 py-6 lg:py-8 text-[11px] leading-relaxed">
          <div className="col-span-1">
            <div className="mb-2 text-text-muted text-xs">// TITLE</div>
            <p className="text-text-strong font-bold text-sm tracking-widest font-sans">{activeItem.title}</p>
          </div>
          <div className="col-span-1 hidden lg:block">
            <div className="mb-2 text-text-muted text-xs">// DIMENSION</div>
            <p className="text-sm">{activeItem.dimensions}</p>
          </div>
          <div className="col-span-1 hidden lg:block">
            <div className="mb-2 text-text-muted text-xs">// DETAILS</div>
            <p className="text-sm line-clamp-2" title={activeItem.details.slice(1).join(' ')}>{activeItem.details.slice(1).join(' ')}</p>
          </div>
          <div className="col-span-1">
            <div className="mb-2 text-text-muted text-xs">// ACQUISITION</div>
            <PriceTag artwork={activeItem} className="text-sm" />
          </div>
          <div className="col-span-1 flex flex-col justify-start items-end gap-2">
            <Link
              to={`/art/${activeItem.id}`}
              state={fromExhibition}
              className="w-full max-w-[196px] text-center whitespace-nowrap border border-border-color rounded-full px-4 py-2.5 hover:bg-text-strong hover:text-bg transition-colors tracking-widest text-[11px]"
            >
              DISCOVER FULL STORY
            </Link>
            <BuyButton artwork={activeItem} state={fromExhibition} className="w-full max-w-[196px] px-6 py-2.5 text-[11px]" />
          </div>
        </div>

        {/* Big Text */}
        <div className="flex justify-between items-end px-4 md:px-6 pb-4">
          <div className="flex flex-col min-w-0">
            <div className="flex items-stretch gap-4 md:gap-6">
              <h1 className="font-cursive text-6xl sm:text-7xl md:text-9xl text-text-strong leading-none tracking-normal">{activeGallery.title}</h1>
              <div className="flex flex-col items-start justify-between py-1 md:py-2">
                {!activeGallery.isPast ? (
                  <span className="flex items-center gap-1 text-text-strong tracking-widest text-[10px] md:text-xs whitespace-nowrap">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                    </svg>
                    NOW SHOWING
                  </span>
                ) : (
                  <div className="h-[12px]"></div>
                )}
                <div className="flex flex-col text-[10px] md:text-xs tracking-widest text-text-muted uppercase gap-1">
                  <span>{activeGallery.date}</span>
                  <span className="flex items-center gap-1">
                    <MapPin size={10} />
                    {activeGallery.location}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3 md:mt-4 text-text-muted flex items-center gap-4 h-8">
              {galleryIndex < exhibitions.length - 1 ? (
                <button
                  aria-label="Past exhibition"
                  className="hover:text-text-strong transition-colors cursor-pointer group flex items-center"
                  onClick={() => paginateGallery(1)}
                  onMouseEnter={() => setHoveredNav('next')}
                  onMouseLeave={() => setHoveredNav(null)}
                >
                  <svg width="48" height="16" viewBox="0 0 64 24" fill="currentColor" className="group-hover:-translate-x-2 transition-transform rotate-180">
                    <path d="M0 10h40v4H0z M40 6h4v12h-4z M44 2h4v20h-4z M48 6h4v12h-4z M52 10h4v4h-4z" />
                  </svg>
                </button>
              ) : (
                <div className="w-[48px]"></div>
              )}

              <div className="text-[10px] tracking-widest font-mono text-center w-32 md:w-40">
                {hoveredNav === 'prev' && galleryIndex > 0 ? 'NEWER EXHIBITION' : hoveredNav === 'next' && galleryIndex < exhibitions.length - 1 ? 'PAST EXHIBITION' : ''}
              </div>

              {galleryIndex > 0 ? (
                <button
                  aria-label="Newer exhibition"
                  className="hover:text-text-strong transition-colors cursor-pointer group flex items-center"
                  onClick={() => paginateGallery(-1)}
                  onMouseEnter={() => setHoveredNav('prev')}
                  onMouseLeave={() => setHoveredNav(null)}
                >
                  <svg width="48" height="16" viewBox="0 0 64 24" fill="currentColor" className="group-hover:translate-x-2 transition-transform">
                    <path d="M0 10h40v4H0z M40 6h4v12h-4z M44 2h4v20h-4z M48 6h4v12h-4z M52 10h4v4h-4z" />
                  </svg>
                </button>
              ) : (
                <div className="w-[48px]"></div>
              )}
            </div>
          </div>
          <div className="hidden md:block font-mono text-5xl lg:text-7xl text-text-faint tracking-tighter">
            ({String(activeDataIndex + 1).padStart(2, '0')})
          </div>
        </div>

        {/* Marquee */}
        <Link to="/offers" className="marquee-container block border-t border-border-color py-1.5 text-[10px] tracking-[0.2em] text-text-muted bg-marquee-bg hover:text-text-strong transition-colors uppercase">
          <div className="marquee-content">{marqueeText}</div>
          <div className="marquee-content" aria-hidden="true">{marqueeText}</div>
        </Link>
      </footer>
    </>
  );
}
