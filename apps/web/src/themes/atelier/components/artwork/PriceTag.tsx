import React from 'react';
import { Link } from 'react-router-dom';
import { type Artwork, currentPrice, discountPercent, formatPrice, isOnSale, useCatalog } from '../../data';

/** Price line: "SOLD", a struck-through original next to the sale price, or the regular price. */
export function PriceTag({ artwork, className = '' }: { artwork: Artwork; className?: string }) {
  if (artwork.sold) {
    return <p className={`text-text-muted font-bold tracking-widest ${className}`}>SOLD</p>;
  }
  if (isOnSale(artwork)) {
    return (
      <p className={`flex flex-wrap items-baseline gap-x-2 tracking-widest ${className}`}>
        <span className="text-accent font-bold">{formatPrice(currentPrice(artwork), artwork.currency)}</span>
        <s className="text-text-muted text-[0.85em]">{formatPrice(artwork.price, artwork.currency)}</s>
      </p>
    );
  }
  return <p className={`text-accent font-bold tracking-widest ${className}`}>{formatPrice(artwork.price, artwork.currency)}</p>;
}

/** Corner badge for artwork images: SOLD or the discount percentage. Renders nothing otherwise. */
export function ArtworkBadge({ artwork, className = '' }: { artwork: Artwork; className?: string }) {
  if (artwork.sold) {
    return (
      <span className={`pointer-events-none bg-bg/90 text-text-strong border border-text-strong/60 px-2 py-0.5 text-[10px] font-bold tracking-widest ${className}`}>
        SOLD
      </span>
    );
  }
  if (isOnSale(artwork)) {
    return (
      <span className={`pointer-events-none bg-action-bg text-action-text px-2 py-0.5 text-[10px] font-bold tracking-widest ${className}`}>
        -{discountPercent(artwork)}%
      </span>
    );
  }
  return null;
}

/** Buy button, or a disabled SOLD pill when the piece is no longer available. */
export function BuyButton({ artwork, state, className = '' }: { artwork: Artwork; state?: unknown; className?: string }) {
  const { paymentsEnabled } = useCatalog();
  if (artwork.sold) {
    return (
      <span aria-disabled="true" className={`block text-center border border-border-color text-text-muted rounded-full tracking-widest font-bold cursor-not-allowed ${className}`}>
        SOLD
      </span>
    );
  }
  // Without online payment the button opens a purchase inquiry instead.
  if (!paymentsEnabled) {
    return (
      <Link
        to={`/contact?artwork=${artwork.id}`}
        className={`block text-center bg-action-bg text-action-text rounded-full hover:opacity-80 transition-opacity tracking-widest font-bold ${className}`}
      >
        INQUIRE TO BUY
      </Link>
    );
  }
  return (
    <Link
      to={`/checkout/${artwork.id}`}
      state={state}
      className={`block text-center bg-action-bg text-action-text rounded-full hover:opacity-80 transition-opacity tracking-widest font-bold ${className}`}
    >
      BUY NOW
    </Link>
  );
}
