import React from 'react';
import { Link } from 'react-router-dom';
import { Artwork } from '../../data/artworks';
import { ArtworkBadge, PriceTag } from './PriceTag';

/** Grid card used on listing pages such as Offers. */
export function ArtworkCard({ artwork, from, fromLabel }: { artwork: Artwork; from: string; fromLabel: string }) {
  return (
    <Link to={`/art/${artwork.id}`} state={{ from, fromLabel }} className="group flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden bg-border-color/20">
        <img
          src={artwork.thumb}
          alt={artwork.title}
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${artwork.sold ? 'opacity-60 grayscale' : ''}`}
        />
        <ArtworkBadge artwork={artwork} className="absolute top-2 left-2" />
      </div>
      <div className="space-y-1">
        <p className="text-text-strong text-xs md:text-sm font-bold tracking-widest uppercase truncate">{artwork.title}</p>
        <p className="text-text-muted text-[10px] tracking-widest uppercase">{artwork.collection}</p>
        <PriceTag artwork={artwork} className="text-xs" />
      </div>
    </Link>
  );
}
