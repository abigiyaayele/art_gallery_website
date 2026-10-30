import type { ContentBlock } from '@platform/contracts';
import React from 'react';
import { Link } from 'react-router-dom';
import { selectArtworks, useSite } from '../../../../platform/SiteProvider';
import { useCatalog } from '../../data';
import { useZoom } from '../layout/ZoomContext';
import { ArtworkCard } from '../artwork/ArtworkCard';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg md:text-xl text-text-strong tracking-widest font-bold uppercase">// {children}</h2>;
}

function ZoomImage({ id, className, imgClassName = 'object-cover' }: { id: string; className: string; imgClassName?: string }) {
  const zoom = useZoom();
  const image = useSite().site.images[id];
  if (!image) return null;
  return (
    <div className={`bg-border-color/20 overflow-hidden cursor-zoom-in ${className}`} onClick={() => zoom(image.url)}>
      <img src={image.url} alt={image.alt} loading="lazy" className={`w-full h-full transition-transform duration-500 hover:scale-105 ${imgClassName}`} />
    </div>
  );
}

function Block({ block, from, fromLabel }: { block: ContentBlock; from: string; fromLabel: string }) {
  const { artworks } = useSite();
  const { allArtworks, exhibitions } = useCatalog();
  const zoom = useZoom();
  const images = useSite().site.images;

  switch (block.type) {
    case 'hero':
      return (
        <section className="space-y-6 text-center">
          <h1 className="font-cursive text-5xl md:text-7xl text-text-strong leading-none">{block.heading}</h1>
          {block.subheading && <p className="max-w-2xl mx-auto text-lg">{block.subheading}</p>}
          {block.imageIds[0] && <ZoomImage id={block.imageIds[0]} className="aspect-[16/9]" />}
        </section>
      );
    case 'text':
      return (
        <section className="space-y-4 max-w-3xl">
          {block.heading && <SectionTitle>{block.heading}</SectionTitle>}
          {block.body.split(/\n{2,}/).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
        </section>
      );
    case 'features':
      return (
        <section className="space-y-8">
          {block.heading && <SectionTitle>{block.heading}</SectionTitle>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {block.items.map((item, i) => (
              <div key={item.title} className="space-y-2 border-t border-border-color pt-4">
                <p className="font-mono text-text-faint text-3xl">{String(i + 1).padStart(2, '0')}</p>
                <p className="text-text-strong text-xs font-bold tracking-widest uppercase">{item.title}</p>
                <p className="text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      );
    case 'artworks': {
      const slugs = new Set(selectArtworks(artworks, block).map(a => a.slug));
      const list = allArtworks.filter(a => slugs.has(a.id));
      if (list.length === 0) return null;
      return (
        <section className="space-y-8">
          <div className="flex justify-between items-baseline gap-4">
            {block.heading && <SectionTitle>{block.heading}</SectionTitle>}
            <Link to="/archive" className="text-xs tracking-widest text-text-muted hover:text-text-strong transition-colors whitespace-nowrap">VIEW ALL &rarr;</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-8">
            {list.map(a => <ArtworkCard key={a.id} artwork={a} from={from} fromLabel={fromLabel} />)}
          </div>
        </section>
      );
    }
    case 'gallery':
      if (block.imageIds.length === 0) return null;
      return (
        <section className="space-y-8">
          {block.heading && <SectionTitle>{block.heading}</SectionTitle>}
          {block.imageIds.length === 1 ? (
            <figure className="space-y-3">
              <ZoomImage id={block.imageIds[0]!} className="aspect-[4/3] md:aspect-[16/9]" imgClassName="object-cover object-[center_35%]" />
              {block.caption && <figcaption className="text-text-muted text-xs tracking-widest uppercase">{block.caption}</figcaption>}
            </figure>
          ) : (
            <>
              {block.caption && <p className="max-w-2xl">{block.caption}</p>}
              <div className="columns-2 md:columns-3 gap-4 space-y-4">
                {block.imageIds.map(id => images[id] && (
                  <img
                    key={id}
                    src={images[id].url}
                    alt={images[id].alt}
                    loading="lazy"
                    className="w-full break-inside-avoid cursor-zoom-in transition-transform duration-500 hover:scale-[1.02]"
                    onClick={() => zoom(images[id]!.url)}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      );
    case 'exhibitions': {
      const rows = block.items.length > 0
        ? block.items.map(e => ({ key: e.title, title: e.title, genre: e.subtitle, date: e.date, location: e.location }))
        : exhibitions.map(e => ({ key: e.slug, title: e.title, genre: e.genre, date: e.date, location: e.location }));
      return (
        <section className="space-y-8">
          {block.heading && <SectionTitle>{block.heading}</SectionTitle>}
          <ul className="divide-y divide-border-color/50 border-y border-border-color/50">
            {rows.map(e => (
              <li key={e.key} className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-4 text-xs tracking-widest uppercase">
                <span className="text-text-strong font-bold">{e.title} {e.genre && <span className="text-text-muted font-normal">· {e.genre}</span>}</span>
                <span>{e.date}</span>
                <span className="sm:text-right text-text-muted">{e.location}</span>
              </li>
            ))}
          </ul>
        </section>
      );
    }
    case 'clients':
      return (
        <section className="space-y-8">
          {block.heading && <SectionTitle>{block.heading}</SectionTitle>}
          {block.items.map(work => (
            <div key={work.name + work.project} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
              <div className="space-y-2">
                <p className="text-text-strong text-sm font-bold tracking-widest uppercase">{work.name}</p>
                {work.project && <p className="text-text-muted text-xs tracking-widest uppercase">{work.project}</p>}
                {work.text && <p className="text-sm">{work.text}</p>}
              </div>
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                {work.imageIds.map(id => <ZoomImage key={id} id={id} className="aspect-square" />)}
              </div>
            </div>
          ))}
        </section>
      );
    case 'cta':
      return (
        <section className="border border-border-color p-6 md:p-12 text-center space-y-6">
          <p className="text-text-strong text-lg md:text-2xl">{block.heading}</p>
          {block.body && <p className="max-w-xl mx-auto">{block.body}</p>}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {block.href && (
              <Link to={block.href} className="bg-action-bg text-action-text rounded-full px-8 py-3 hover:opacity-80 transition-opacity tracking-widest text-xs font-bold uppercase">
                {block.buttonLabel || 'Learn more'}
              </Link>
            )}
            <Link to="/contact" className="border border-border-color rounded-full px-8 py-3 hover:bg-text-strong hover:text-bg transition-colors tracking-widest text-xs font-bold">
              CONTACT THE STUDIO
            </Link>
          </div>
        </section>
      );
  }
}

/** Draws a page's content blocks in the atelier style. */
export function Blocks({ blocks, from, fromLabel }: { blocks: ContentBlock[]; from: string; fromLabel: string }) {
  return (
    <>
      {blocks.map((block, i) => <Block key={i} block={block} from={from} fromLabel={fromLabel} />)}
    </>
  );
}
