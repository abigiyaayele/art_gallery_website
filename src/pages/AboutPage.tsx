import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { allArtworks, exhibitions } from '../data/artworks';
import { site } from '../data/site';
import { useZoom } from '../components/layout/ZoomContext';
import { PageMain } from '../components/layout/Layout';
import { ArtworkCard } from '../components/artwork/ArtworkCard';

const reviews = [
  {
    image: 'https://picsum.photos/seed/review1/600/400',
    quote: 'A hauntingly beautiful reflection on our synthetic existence. Seifu captures the ghost in the machine.',
    source: 'Neo-Art Quarterly',
  },
  {
    image: 'https://picsum.photos/seed/review2/600/400',
    quote: "The Floral exhibition left me breathless. It's as if nature itself was paused in a digital stasis.",
    source: 'Curator, The High Orbit Museum',
  },
];

const approach = [
  ['Observation', 'Every series starts with months of sketching from life: plants, streets, light at different hours.'],
  ['Layering', 'Paintings are built in thin layers of oil and resin over several weeks, so colour glows from underneath.'],
  ['Finishing', 'Each piece is signed, varnished and documented with a certificate of authenticity.'],
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg md:text-xl text-text-strong tracking-widest font-bold">// {children}</h2>;
}

export default function AboutPage() {
  const zoom = useZoom();
  const selectedWorks = allArtworks.filter(a => !a.sold).slice(0, 4);

  return (
    <PageMain>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-16 space-y-16 md:space-y-24 text-sm md:text-base leading-relaxed">
        {/* Painter intro */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center"
        >
          <div className="aspect-[4/5] bg-border-color/20 overflow-hidden cursor-zoom-in" onClick={() => zoom('https://picsum.photos/seed/artist/800/1000')}>
            <img src="https://picsum.photos/seed/artist/800/1000" alt={site.painter} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
          </div>
          <div className="space-y-6">
            <p className="text-text-muted text-xs tracking-widest uppercase">// About the painter</p>
            <h1 className="font-cursive text-5xl md:text-7xl text-text-strong leading-none">{site.painter}</h1>
            <p className="text-lg md:text-xl text-text-strong">
              A painter working at the edge of the organic and the synthetic, turning living forms into luminous, layered canvases.
            </p>
            <p>
              Seifu began his career as a bio-engineer before discovering a way to preserve decaying organic matter in resin and paint.
              That fascination with what we lose, and what we build to replace it, runs through every series he has painted since.
            </p>
            <p className="text-text-muted italic">"I don't paint the past. I paint what the future will remember."</p>
          </div>
        </motion.section>

        {/* Approach */}
        <section className="space-y-8">
          <SectionTitle>HOW HE WORKS</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {approach.map(([title, text], i) => (
              <div key={title} className="space-y-2 border-t border-border-color pt-4">
                <p className="font-mono text-text-faint text-3xl">{String(i + 1).padStart(2, '0')}</p>
                <p className="text-text-strong text-xs font-bold tracking-widest uppercase">{title}</p>
                <p className="text-sm">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Selected works */}
        <section className="space-y-8">
          <div className="flex justify-between items-baseline gap-4">
            <SectionTitle>SELECTED WORKS</SectionTitle>
            <Link to="/archive" className="text-xs tracking-widest text-text-muted hover:text-text-strong transition-colors whitespace-nowrap">VIEW ALL &rarr;</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-8">
            {selectedWorks.map(a => <ArtworkCard key={a.id} artwork={a} from="/about" fromLabel="ABOUT" />)}
          </div>
        </section>

        {/* Exhibitions */}
        <section className="space-y-8">
          <SectionTitle>EXHIBITIONS</SectionTitle>
          <ul className="divide-y divide-border-color/50 border-y border-border-color/50">
            {exhibitions.map(e => (
              <li key={e.slug} className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4 text-xs tracking-widest uppercase">
                <span className="text-text-strong font-bold">{e.title} <span className="text-text-muted font-normal">· {e.genre}</span></span>
                <span>{e.date}</span>
                <span className="sm:text-right text-text-muted">{e.location}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Reviews */}
        <section className="space-y-8">
          <SectionTitle>REVIEWS</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviews.map(r => (
              <div key={r.source} className="space-y-4">
                <div className="w-full aspect-video bg-border-color/20 overflow-hidden cursor-zoom-in" onClick={() => zoom(r.image)}>
                  <img src={r.image} alt="" className="w-full h-full object-cover transition-all duration-500 hover:scale-105" />
                </div>
                <blockquote className="border-l-2 border-accent pl-4">
                  <p className="italic text-text-muted">"{r.quote}"</p>
                  <footer className="mt-2 text-xs text-text-strong">— {r.source}</footer>
                </blockquote>
              </div>
            ))}
          </div>
        </section>

        {/* Call to action */}
        <section className="border border-border-color p-6 md:p-12 text-center space-y-6">
          <p className="text-text-strong text-lg md:text-2xl">Want a painting made just for you?</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/commission" className="bg-action-bg text-action-text rounded-full px-8 py-3 hover:opacity-80 transition-opacity tracking-widest text-xs font-bold">
              REQUEST A PAINTING
            </Link>
            <Link to="/contact" className="border border-border-color rounded-full px-8 py-3 hover:bg-text-strong hover:text-bg transition-colors tracking-widest text-xs font-bold">
              CONTACT THE STUDIO
            </Link>
          </div>
        </section>
      </div>

      {/* Community gallery */}
      <section className="w-full space-y-8 pb-16 px-4 md:px-8">
        <h2 className="text-lg md:text-xl text-text-strong tracking-widest font-bold text-center">// COMMUNITY & CLIENTS</h2>
        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-4 space-y-4">
          {[600, 400, 800, 500, 400, 700, 500, 600].map((height, i) => {
            const src = `https://picsum.photos/seed/ig${i + 1}/400/${height}`;
            return (
              <img
                key={src}
                src={src}
                alt="Client with a painting"
                loading="lazy"
                className="w-full opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500 cursor-zoom-in hover:scale-[1.02]"
                onClick={() => zoom(src)}
              />
            );
          })}
        </div>
      </section>
    </PageMain>
  );
}
