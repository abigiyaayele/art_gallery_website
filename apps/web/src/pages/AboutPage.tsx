import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { allArtworks, exhibitions } from '../data/artworks';
import { site } from '../data/site';
import { useZoom } from '../components/layout/ZoomContext';
import { PageMain } from '../components/layout/Layout';
import { ArtworkCard } from '../components/artwork/ArtworkCard';

/** Commissions for companies. Add new client projects here (photos go in public/clients/). */
const clientWork = [
  {
    client: 'Solino Coffee',
    project: 'Crema Selection packaging',
    text: "Seifu's women of the coffee ceremony illustrate Solino's Crema Selection, coffee roasted by hand in Ethiopia.",
    images: ['/clients/solino-crema-1.jpg', '/clients/solino-crema-2.jpg'],
  },
];

/** Photos of collectors with their paintings (public/clients/). */
const collectorPhotos = [1, 2, 3, 4, 5, 6, 7].map(n => `/clients/collector-${n}.jpg`);

const approach = [
  ['Patterns of nature', 'Forests, leaves, flowers and birds are built up one small shape at a time until they fill the whole canvas.'],
  ['People and colour', 'Women in traditional dress, bright umbrellas and everyday moments bring warm reds and oranges into the green.'],
  ['Made to order', 'Besides original paintings, Seifu creates commissioned work for homes, gifts and brands.'],
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg md:text-xl text-text-strong tracking-widest font-bold">// {children}</h2>;
}

export default function AboutPage() {
  const zoom = useZoom();
  const selectedWorks = allArtworks.filter(a => !a.sold).slice(0, 4);
  const portrait = '/seifu/seifu-portrait.jpg';

  return (
    <PageMain>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-16 space-y-16 md:space-y-24 text-sm md:text-base leading-relaxed">
        {/* Painter intro */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center"
        >
          <div className="aspect-[4/5] bg-border-color/20 overflow-hidden cursor-zoom-in" onClick={() => zoom(portrait)}>
            <img src={portrait} alt={site.painter} className="w-full h-full object-cover object-[65%_center] transition-transform duration-500 hover:scale-105" />
          </div>
          <div className="space-y-6">
            <p className="text-text-muted text-xs tracking-widest uppercase">// About the painter</p>
            <h1 className="font-cursive text-5xl md:text-7xl text-text-strong leading-none">{site.painter}</h1>
            <p className="text-lg md:text-xl text-text-strong">
              An Ethiopian painter of glowing forests, gardens and the people who walk through them.
            </p>
            <p>
              Seifu's paintings are filled with thousands of hand-painted leaves, flowers and birds. Through them walk women in
              traditional dress, often under bright umbrellas, on their way to market, to a ceremony or simply home.
              His work celebrates everyday life, nature and the warmth of Ethiopian culture.
            </p>
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
          <figure className="space-y-3">
            <div className="aspect-[4/3] md:aspect-[16/9] overflow-hidden bg-border-color/20 cursor-zoom-in" onClick={() => zoom('/seifu/seifu-exhibition.jpg')}>
              <img src="/seifu/seifu-exhibition.jpg" alt={`${site.painter} at an exhibition of his paintings`} loading="lazy" className="w-full h-full object-cover object-[center_35%] transition-transform duration-500 hover:scale-105" />
            </div>
            <figcaption className="text-text-muted text-xs tracking-widest uppercase">{site.painter} with his paintings at an exhibition</figcaption>
          </figure>
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

        {/* Work for clients */}
        <section className="space-y-8">
          <SectionTitle>WORK FOR CLIENTS</SectionTitle>
          {clientWork.map(work => (
            <div key={work.project} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
              <div className="space-y-2">
                <p className="text-text-strong text-sm font-bold tracking-widest uppercase">{work.client}</p>
                <p className="text-text-muted text-xs tracking-widest uppercase">{work.project}</p>
                <p className="text-sm">{work.text}</p>
              </div>
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                {work.images.map(src => (
                  <div key={src} className="aspect-square bg-border-color/20 overflow-hidden cursor-zoom-in" onClick={() => zoom(src)}>
                    <img src={src} alt={`${work.client} ${work.project}`} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Collectors */}
        <section className="space-y-8">
          <SectionTitle>COLLECTORS</SectionTitle>
          <p className="max-w-2xl">Seifu's paintings now hang in homes and offices around the world. Here are some of the people who took one home.</p>
          <div className="columns-2 md:columns-3 gap-4 space-y-4">
            {collectorPhotos.map(src => (
              <img
                key={src}
                src={src}
                alt="Collector with a painting by Seifu"
                loading="lazy"
                className="w-full break-inside-avoid cursor-zoom-in transition-transform duration-500 hover:scale-[1.02]"
                onClick={() => zoom(src)}
              />
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

    </PageMain>
  );
}
