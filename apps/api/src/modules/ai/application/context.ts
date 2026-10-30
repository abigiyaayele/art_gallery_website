import type { GoalDto } from '@platform/contracts';
import type { ArtistSnapshot } from './ports.js';

const money = (cents: number | null, currency: string) => (cents === null ? 'no price' : `${(cents / 100).toLocaleString('en-US')} ${currency}`);

/**
 * Turns the artist's own data into a short briefing for the model. Only this
 * workspace's data ever goes in, so one artist's assistant cannot see another's.
 */
export function buildArtistContext(s: ArtistSnapshot, goals: GoalDto[] = []): string {
  const lines = [
    `Artist: ${s.name}${s.location ? `, based in ${s.location}` : ''}.`,
    s.tagline && `Tagline: ${s.tagline}`,
    s.bio && `Bio: ${s.bio.slice(0, 1200)}`,
    `Catalog: ${s.counts.available} published, ${s.counts.draft} drafts, ${s.counts.sold} sold.`,
    s.collections.length > 0 && `Collections: ${s.collections.map(c => `${c.name} (${c.available} available, ${c.sold} sold)`).join('; ')}.`,
    s.recentWorks.length > 0 &&
      `Recent works:\n${s.recentWorks.map(w => `- ${w.title} [${w.collection || 'no collection'}; ${w.medium || 'medium unknown'}; ${w.status}; ${money(w.priceCents, w.currency)}]`).join('\n')}`,
    `Sold in the last 90 days: ${s.soldLast90Days.length ? s.soldLast90Days.map(w => `${w.title} (${w.collection || 'no collection'})`).join(', ') : 'nothing yet'}.`,
    `Website inquiries in the last 30 days: ${s.inquiriesLast30Days}.`,
    goals.length > 0 &&
      `Goals:\n${goals.map(g => `- ${g.title} [${g.status}${g.target ? `, ${g.current}/${g.target} ${g.unit}` : ''}${g.dueDate ? `, due ${g.dueDate}` : ''}]`).join('\n')}`,
  ];
  return lines.filter(Boolean).join('\n');
}

export const ASSISTANT_PERSONA = `You are the studio assistant inside an artist's management dashboard. You help one working artist with their art business: describing artworks, pricing, planning work and exhibitions, marketing, and keeping momentum on their goals.

Ground your answers in the artist data below. When the data does not answer something, say so plainly instead of inventing numbers, sales or events. Keep a warm, practical voice, write in plain language, and keep replies short unless asked for detail. You suggest; the artist decides. You cannot change anything in their catalog or website yourself.`;
