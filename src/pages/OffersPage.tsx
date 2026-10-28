import React from 'react';
import { motion } from 'motion/react';
import { allArtworks, isOnSale, promotion } from '../data/artworks';
import { PageMain } from '../components/layout/Layout';
import { ArtworkCard } from '../components/artwork/ArtworkCard';

export default function OffersPage() {
  const onSale = allArtworks.filter(isOnSale);
  const recentlySold = allArtworks.filter(a => a.sold).slice(0, 8);

  return (
    <PageMain>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-16 space-y-16">
        {/* Promotion banner */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-border-color p-6 md:p-12 text-center space-y-4"
        >
          <p className="text-text-muted text-xs tracking-widest uppercase">// {promotion.title}</p>
          <h1 className="font-cursive text-5xl md:text-7xl text-text-strong leading-none">Offers</h1>
          <p className="text-text-strong text-sm md:text-base tracking-widest uppercase">{promotion.message}</p>
          <p className="text-text-muted text-xs tracking-widest">ENDS {promotion.endsOn}</p>
        </motion.section>

        <section className="space-y-6">
          <h2 className="text-lg md:text-xl text-text-strong tracking-widest font-bold">// ON PROMOTION ({onSale.length})</h2>
          {onSale.length === 0 ? (
            <p className="text-sm">No paintings are discounted right now. Check back soon.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-8">
              {onSale.map(a => <ArtworkCard key={a.id} artwork={a} from="/offers" fromLabel="OFFERS" />)}
            </div>
          )}
        </section>

        {recentlySold.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-lg md:text-xl text-text-strong tracking-widest font-bold">// RECENTLY SOLD</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-8">
              {recentlySold.map(a => <ArtworkCard key={a.id} artwork={a} from="/offers" fromLabel="OFFERS" />)}
            </div>
          </section>
        )}
      </div>
    </PageMain>
  );
}
