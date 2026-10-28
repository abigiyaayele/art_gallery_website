/**
 * Local artwork catalog. This is the fallback content the site shows when no
 * Strapi backend is configured (VITE_STRAPI_URL unset).
 */

export interface Artwork {
  id: number;
  title: string;
  image: string;
  /** Short lines shown under the exhibition carousel. */
  details: string[];
  /** Longer story shown on the artwork page. */
  story: string;
  dimensions: string;
  /** Regular price in USD. */
  price: number;
  /** Discounted price in USD while the piece is on promotion. */
  salePrice?: number;
  sold: boolean;
  /** Name of the exhibition or collection the piece belongs to. */
  collection: string;
}

export interface Exhibition {
  slug: string;
  title: string;
  genre: string;
  date: string;
  location: string;
  isPast: boolean;
  items: Artwork[];
}

/** Archive pieces carry a display width for the scattered archive layout. */
export interface ArchiveArtwork extends Artwork {
  width: string;
}

function exhibitionItem(
  collection: string,
  id: number,
  image: string,
  title: string,
  details: string[],
  price: number,
  extra: Partial<Pick<Artwork, 'salePrice' | 'sold'>> = {},
): Artwork {
  return {
    id,
    title,
    image,
    details,
    story: details.join(' '),
    dimensions: '100cm x 100cm',
    price,
    sold: false,
    collection,
    ...extra,
  };
}

export const exhibitions: Exhibition[] = [
  {
    slug: 'floral',
    title: 'Floral',
    genre: 'SCI-FI / BOTANICAL',
    date: 'OCT 12 - NOV 24, 2025',
    location: 'NEO-TOKYO SECTOR 4',
    isPast: false,
    items: [
      exhibitionItem('Floral', 1, 'https://picsum.photos/seed/art1/800/800', 'VENENATA PULCHRITUDO', [
        'A rare specimen found in the ruins of Sector 4.',
        'Exhibits bioluminescent properties when exposed to toxins.',
        'Requires a specialized containment unit.',
      ], 45000),
      exhibitionItem('Floral', 2, 'https://picsum.photos/seed/art2/800/800', 'URBAN OVERGROWTH', [
        'The concrete has been completely consumed.',
        'Nature reclaims what was once a bustling metropolis.',
        'Contains traces of ancient synthetic materials.',
      ], 32500, { salePrice: 26000 }),
      exhibitionItem('Floral', 3, 'https://picsum.photos/seed/art3/800/800', 'SYNTHETIC BLOOM', [
        'Artificial petals that mimic organic life.',
        'Powered by a micro-fusion core.',
        'Never wilts, never dies.',
      ], 88000),
      exhibitionItem('Floral', 4, 'https://picsum.photos/seed/art4/800/800', 'TOXIC BEAUTY', [
        'Beautiful but deadly to the touch.',
        'Emits a faint humming sound.',
        'Handle only with Class-4 protective gear.',
      ], 115000, { sold: true }),
      exhibitionItem('Floral', 5, 'https://picsum.photos/seed/art5/800/800', 'ECHOES OF EARTH', [
        'A memory of a world that no longer exists.',
        'Preserved in a stasis field.',
        'The last of its kind.',
      ], 250000),
    ],
  },
  {
    slug: 'neon',
    title: 'Neon',
    genre: 'CYBERPUNK / URBAN',
    date: 'DEC 01 - JAN 15, 2027',
    location: 'UNDERGROUND ARCHIVES',
    isPast: true,
    items: [
      exhibitionItem('Neon', 6, 'https://picsum.photos/seed/neon1/800/800', 'CHROMATIC DRIFTER', [
        'Recovered from the lower levels of Neo-Tokyo.',
        'Constantly shifting color spectrum.',
        'Emits a low-frequency hum.',
      ], 22000),
      exhibitionItem('Neon', 7, 'https://picsum.photos/seed/neon2/800/800', 'SYNTH-WAVE', [
        'A physical manifestation of sound.',
        'Reacts to audio input in real-time.',
        'Fragile crystalline structure.',
      ], 64000, { salePrice: 48000 }),
      exhibitionItem('Neon', 8, 'https://picsum.photos/seed/neon3/800/800', 'NEURAL NET', [
        'An obsolete AI core.',
        'Still processes fragmented memories.',
        'Handle with extreme caution.',
      ], 150000),
      exhibitionItem('Neon', 9, 'https://picsum.photos/seed/neon4/800/800', 'HOLOGRAPHIC ECHO', [
        'A glitch in the visual spectrum.',
        'Appears differently to each observer.',
        'Cannot be captured on standard cameras.',
      ], 89000, { sold: true }),
      exhibitionItem('Neon', 10, 'https://picsum.photos/seed/neon5/800/800', 'VOID FRAGMENT', [
        'Origin unknown.',
        'Absorbs all surrounding light.',
        'Cold to the touch.',
      ], 300000),
    ],
  },
];

function archiveItem(id: number, title: string, story: string, width: string, price: number, sold: boolean, salePrice?: number): ArchiveArtwork {
  return {
    id,
    title,
    image: `https://picsum.photos/seed/arch${id - 100}/800/800`,
    details: [],
    story,
    dimensions: '100cm x 100cm',
    price,
    salePrice,
    sold,
    collection: 'Archive Collection',
    width,
  };
}

export const archive: ArchiveArtwork[] = [
  archiveItem(101, 'FLORAL', 'The floral series was an exploration of organic decay and synthetic rebirth. Each piece was carefully cultivated in a controlled environment before being crystallized in resin.', '250px', 12000, true),
  archiveItem(102, 'ECHO', 'Echo represents the sound of silence in a post-apocalyptic world. The visual representation of a soundwave that no longer exists.', '200px', 8500, false, 6800),
  archiveItem(103, 'VOID', 'A deep dive into the nothingness. Void was created using a proprietary light-absorbing pigment that reflects zero photons.', '180px', 15000, true),
  archiveItem(104, 'SYNTH', 'Synthetic lifeforms captured in stasis. This piece explores the boundary between artificial intelligence and organic consciousness.', '220px', 22000, false),
  archiveItem(105, 'NEON', "The bright lights of the underground. Neon captures the chaotic energy of Neo-Tokyo's lower sectors.", '150px', 6000, true),
  archiveItem(106, 'RUST', 'Decay as a form of beauty. Rust is a study of oxidation on ancient metallic structures found in the wasteland.', '120px', 4500, false, 3600),
  archiveItem(107, 'CHROME', "Reflections of a metallic future. Chrome uses highly polished surfaces to distort the viewer's perception of space.", '160px', 18000, true),
  archiveItem(108, 'DUST', 'What remains after the storm. Dust is composed of actual particulate matter collected from the upper atmosphere.', '190px', 9000, false),
  archiveItem(109, 'FRACTAL', 'A mathematical anomaly rendered in physical space. Fractal explores the infinite complexity hidden within simple equations.', '210px', 25000, true),
  archiveItem(110, 'PRISM', 'Light bent and fractured into its component parts. Prism serves as a reminder of the spectrum of possibilities that exist just beyond our perception.', '170px', 11500, false),
  archiveItem(111, 'MONOLITH', 'A monument to forgotten gods. Monolith stands as a testament to the enduring power of belief in a secular age.', '140px', 35000, true),
  archiveItem(112, 'AETHER', 'Capturing the invisible currents of energy that flow through the universe. Aether visualizes the unseen forces that connect us all.', '130px', 14000, false, 10500),
  archiveItem(113, 'PULSE', 'The heartbeat of a dying star. Pulse translates cosmic radiation into a visual rhythm that resonates with the viewer.', '160px', 19500, true),
  archiveItem(114, 'MIRAGE', 'An illusion of water in a desert of data. Mirage challenges our perception of reality in an increasingly digital world.', '180px', 7500, false),
  archiveItem(115, 'NEXUS', 'The point where all timelines converge. Nexus represents the singularity at the center of the multiverse.', '200px', 42000, true),
  archiveItem(116, 'ZENITH', 'The highest point of achievement. Zenith is a celebration of human potential and the relentless pursuit of perfection.', '150px', 28000, false),
  archiveItem(117, 'ABYSS', 'A glimpse into the darkest depths of the ocean. Abyss reveals the strange and terrifying creatures that lurk in the shadows.', '170px', 16500, true),
  archiveItem(118, 'ECLIPSE', 'The moment when the sun is obscured by the moon. Eclipse captures the awe and terror of a celestial event.', '190px', 13000, false),
];

export const allArtworks: Artwork[] = [...exhibitions.flatMap(e => e.items), ...archive];

/** Marks paintings sold online (reported by the payment server) as sold in the catalog. */
export function markSold(ids: number[]) {
  for (const id of ids) {
    const artwork = getArtwork(id);
    if (artwork) artwork.sold = true;
  }
}

export function getArtwork(id: number): Artwork | undefined {
  return allArtworks.find(a => a.id === id);
}

/** The current store-wide promotion, shown in the marquee and on the offers page. */
export const promotion = {
  title: 'Season Promotion',
  message: 'Selected paintings up to 25% off',
  endsOn: 'NOV 30, 2026',
};

export function isOnSale(artwork: Artwork): boolean {
  return !artwork.sold && artwork.salePrice !== undefined && artwork.salePrice < artwork.price;
}

/** The price a buyer pays today. */
export function currentPrice(artwork: Artwork): number {
  return isOnSale(artwork) ? artwork.salePrice! : artwork.price;
}

export function discountPercent(artwork: Artwork): number {
  return isOnSale(artwork) ? Math.round((1 - artwork.salePrice! / artwork.price) * 100) : 0;
}

export function formatPrice(usd: number): string {
  return `$${usd.toLocaleString('en-US')} USD`;
}
