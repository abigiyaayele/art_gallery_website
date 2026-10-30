import type { ContentBlock, PublicArtworkDto } from '@platform/contracts';
import React from 'react';
import { Link } from 'react-router-dom';
import { formatMoney } from '../../platform/api';
import { selectArtworks, useSite } from '../../platform/SiteProvider';

export const input = 'w-full border border-border-color bg-transparent px-3 py-2.5 text-sm text-text-strong focus:outline-none focus:border-text-strong';
export const button = 'inline-flex items-center justify-center bg-action-bg text-action-text px-6 py-3 text-sm font-medium hover:opacity-85 disabled:opacity-50';
export const ghostButton = 'inline-flex items-center justify-center border border-border-color px-6 py-3 text-sm font-medium hover:border-text-strong';

export function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 md:px-8 ${className}`}>{children}</div>;
}

export function Heading({ children, as: Tag = 'h2' }: { children: React.ReactNode; as?: 'h1' | 'h2' }) {
  return <Tag className={`font-cursive text-text-strong ${Tag === 'h1' ? 'text-4xl md:text-5xl' : 'text-2xl md:text-3xl'}`}>{children}</Tag>;
}

export function Price({ artwork, className = '' }: { artwork: PublicArtworkDto; className?: string }) {
  if (artwork.sold) return <span className={`text-text-muted ${className}`}>Sold</span>;
  if (!artwork.price) return <span className={`text-text-muted ${className}`}>Price on request</span>;
  const { regularCents, effectiveCents, onSale, currency } = artwork.price;
  return (
    <span className={className}>
      {onSale && <s className="mr-2 text-text-muted">{formatMoney(regularCents, currency)}</s>}
      <span className={onSale ? 'text-accent font-medium' : ''}>{formatMoney(effectiveCents, currency)}</span>
    </span>
  );
}

export function ArtworkTile({ artwork }: { artwork: PublicArtworkDto }) {
  const img = artwork.images[0];
  return (
    <Link to={`/works/${artwork.slug}`} className="group block space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden bg-text-faint">
        {img && <img src={img.urls.medium} alt={img.alt || artwork.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />}
        {artwork.sold && <span className="absolute left-2 top-2 bg-bg px-2 py-0.5 text-xs">Sold</span>}
        {!artwork.sold && artwork.price?.onSale && <span className="absolute left-2 top-2 bg-accent px-2 py-0.5 text-xs text-white">Offer</span>}
      </div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-text-strong">{artwork.title}</span>
        <Price artwork={artwork} className="shrink-0 text-xs" />
      </div>
    </Link>
  );
}

export function ArtworkGrid({ artworks }: { artworks: PublicArtworkDto[] }) {
  if (artworks.length === 0) return <p className="text-sm text-text-muted">No works to show yet.</p>;
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 md:gap-x-8">
      {artworks.map(a => <ArtworkTile key={a.id} artwork={a} />)}
    </div>
  );
}

function SiteImage({ id, className }: { id: string; className: string }) {
  const image = useSite().site.images[id];
  return image ? <img src={image.url} alt={image.alt} loading="lazy" className={className} /> : null;
}

/** Draws a page's content blocks in the minimal style. */
export function Blocks({ blocks }: { blocks: ContentBlock[] }) {
  const { artworks } = useSite();
  return (
    <div className="space-y-16 md:space-y-20">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'hero':
            return (
              <section key={i} className="grid items-center gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <Heading as="h1">{b.heading}</Heading>
                  {b.subheading && <p className="text-lg text-text-base">{b.subheading}</p>}
                </div>
                {b.imageIds[0] && <SiteImage id={b.imageIds[0]} className="aspect-[4/3] w-full object-cover" />}
              </section>
            );
          case 'text':
            return (
              <section key={i} className="max-w-2xl space-y-4">
                {b.heading && <Heading>{b.heading}</Heading>}
                {b.body.split(/\n{2,}/).map((p, j) => <p key={j} className="whitespace-pre-line leading-relaxed">{p}</p>)}
              </section>
            );
          case 'features':
            return (
              <section key={i} className="space-y-6">
                {b.heading && <Heading>{b.heading}</Heading>}
                <div className="grid gap-8 sm:grid-cols-3">
                  {b.items.map(item => (
                    <div key={item.title} className="space-y-2 border-t border-border-color pt-4">
                      <p className="font-medium text-text-strong">{item.title}</p>
                      <p className="text-sm leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            );
          case 'artworks':
            return (
              <section key={i} className="space-y-6">
                <div className="flex items-baseline justify-between">
                  {b.heading && <Heading>{b.heading}</Heading>}
                  <Link to="/works" className="text-sm underline underline-offset-4">All works</Link>
                </div>
                <ArtworkGrid artworks={selectArtworks(artworks, b)} />
              </section>
            );
          case 'gallery':
            return (
              <section key={i} className="space-y-6">
                {b.heading && <Heading>{b.heading}</Heading>}
                {b.caption && <p className="max-w-2xl text-sm">{b.caption}</p>}
                <div className="columns-2 gap-4 space-y-4 md:columns-3">
                  {b.imageIds.map(id => <SiteImage key={id} id={id} className="w-full break-inside-avoid" />)}
                </div>
              </section>
            );
          case 'clients':
            return (
              <section key={i} className="space-y-6">
                {b.heading && <Heading>{b.heading}</Heading>}
                {b.items.map(c => (
                  <div key={c.name + c.project} className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-1">
                      <p className="font-medium text-text-strong">{c.name}</p>
                      <p className="text-sm text-text-muted">{c.project}</p>
                      <p className="text-sm">{c.text}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:col-span-2">
                      {c.imageIds.map(id => <SiteImage key={id} id={id} className="aspect-square w-full object-cover" />)}
                    </div>
                  </div>
                ))}
              </section>
            );
          case 'exhibitions':
            return (
              <section key={i} className="space-y-6">
                {b.heading && <Heading>{b.heading}</Heading>}
                <ul className="divide-y divide-border-color border-y border-border-color text-sm">
                  {b.items.map(e => (
                    <li key={e.title + e.date} className="grid gap-1 py-3 sm:grid-cols-3">
                      <span className="text-text-strong">{e.title}{e.subtitle && <span className="text-text-muted"> · {e.subtitle}</span>}</span>
                      <span>{e.date}</span>
                      <span className="text-text-muted sm:text-right">{e.location}</span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          case 'cta':
            return (
              <section key={i} className="space-y-4 bg-text-faint px-6 py-10 text-center md:py-14">
                <Heading>{b.heading}</Heading>
                {b.body && <p className="mx-auto max-w-xl">{b.body}</p>}
                {b.href && <Link to={b.href} className={button}>{b.buttonLabel || 'Learn more'}</Link>}
              </section>
            );
        }
      })}
    </div>
  );
}
