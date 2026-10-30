import React from 'react';
import { motion } from 'motion/react';
import { useZoom } from '../components/layout/ZoomContext';
import { PageMain } from '../components/layout/Layout';
import { Blocks } from '../components/blocks/Blocks';
import { usePage, useSite } from '../../../platform/SiteProvider';

export default function AboutPage() {
  const zoom = useZoom();
  const { profile } = useSite().site;
  const page = usePage('about');
  const portrait = profile.photoUrl;

  return (
    <PageMain>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-16 space-y-16 md:space-y-24 text-sm md:text-base leading-relaxed">
        {/* Painter intro */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`grid grid-cols-1 gap-8 md:gap-12 items-center ${portrait ? 'md:grid-cols-2' : ''}`}
        >
          {portrait && (
            <div className="aspect-[4/5] bg-border-color/20 overflow-hidden cursor-zoom-in" onClick={() => zoom(portrait)}>
              <img src={portrait} alt={profile.displayName} className="w-full h-full object-cover object-[65%_center] transition-transform duration-500 hover:scale-105" />
            </div>
          )}
          <div className="space-y-6">
            <p className="text-text-muted text-xs tracking-widest uppercase">// About the artist</p>
            <h1 className="font-cursive text-5xl md:text-7xl text-text-strong leading-none">{profile.displayName}</h1>
            {profile.tagline && <p className="text-lg md:text-xl text-text-strong">{profile.tagline}</p>}
            {profile.bio.split(/\n{2,}/).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
            {profile.statement && <blockquote className="border-l-2 border-accent pl-4 italic">{profile.statement}</blockquote>}
          </div>
        </motion.section>

        <Blocks blocks={page?.blocks ?? []} from="/about" fromLabel="ABOUT" />
      </div>
    </PageMain>
  );
}
