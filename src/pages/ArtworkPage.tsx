import React from 'react';
import { motion } from 'motion/react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getArtwork, formatPrice } from '../data/artworks';
import { useZoom } from '../components/layout/ZoomContext';
import { BackBar } from '../components/layout/Layout';
import NotFoundPage from './NotFoundPage';

export interface FromState {
  from?: string;
  fromLabel?: string;
}

export default function ArtworkPage() {
  const zoom = useZoom();
  const { id } = useParams();
  const state = (useLocation().state ?? {}) as FromState;
  const artwork = getArtwork(Number(id));

  if (!artwork) return <NotFoundPage />;

  const buyButton = (className: string) => (
    <Link
      to={`/checkout/${artwork.id}`}
      state={{ from: `/art/${artwork.id}`, fromLabel: 'STORY' }}
      className={`block text-center bg-action-bg text-action-text rounded-full px-6 hover:opacity-80 transition-opacity tracking-widest text-[11px] font-bold ${className}`}
    >
      BUY NOW
    </Link>
  );

  return (
    <main className="flex-1 flex flex-col relative overflow-hidden bg-bg min-h-0">
      <BackBar to={state.from ?? '/'} label={`BACK TO ${state.fromLabel ?? 'EXHIBITION'}`} title={artwork.collection} />

      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
        {/* Summary Header */}
        <div className="shrink-0 border-b border-border-color/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 px-4 md:px-6 py-6 md:py-8 text-[11px] leading-relaxed">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-2 text-text-muted text-xs">// TITLE</div>
              <p className="text-text-strong font-bold text-sm tracking-widest font-sans">{artwork.title}</p>
            </div>
            <div>
              <div className="mb-2 text-text-muted text-xs">// DIMENSION</div>
              <p className="text-sm">{artwork.dimensions}</p>
            </div>
            <div>
              <div className="mb-2 text-text-muted text-xs">// ACQUISITION</div>
              <p className="text-accent font-bold tracking-widest text-sm">{artwork.sold ? 'SOLD' : formatPrice(artwork.price)}</p>
            </div>
            <div className="hidden md:flex flex-col justify-center items-end">
              {!artwork.sold && buyButton('w-48 py-2.5')}
            </div>
          </div>
        </div>

        {/* Main Content: Image Left, Details Right */}
        <div className="flex flex-col md:flex-row w-full flex-1">
          {/* Image Side */}
          <div className="w-full md:w-1/2 p-6 md:p-12 lg:p-16 flex items-start justify-center border-b md:border-b-0 md:border-r border-border-color/20">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full aspect-square max-w-[600px] shadow-2xl cursor-zoom-in"
              onClick={() => zoom(artwork.image)}
            >
              <img
                src={artwork.image}
                alt={artwork.title}
                className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
                draggable={false}
              />
            </motion.div>
          </div>

          {/* Details Side */}
          <div className="w-full md:w-1/2 p-6 md:p-12 lg:p-16 flex flex-col">
            <div className="max-w-xl">
              <div className="mb-8 text-text-muted text-xs tracking-widest uppercase">// THE STORY</div>
              <div className="text-sm md:text-base leading-relaxed text-text-base space-y-6 font-sans">
                <p>{artwork.story}</p>
                <p>
                  This piece represents a pivotal moment in the artist's exploration of synthetic-organic synthesis.
                  By isolating the core structural elements and exposing them to controlled environmental stressors,
                  a unique patina was achieved that cannot be replicated.
                </p>
                {artwork.sold && (
                  <p className="text-text-muted italic mt-8 pt-8 border-t border-border-color/20">
                    This piece has been acquired by a private collector.
                  </p>
                )}
              </div>

              {/* Mobile Bottom Buy Button */}
              {!artwork.sold && <div className="mt-12 md:hidden">{buyButton('w-full py-4')}</div>}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
