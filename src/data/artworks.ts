/**
 * Seifu's paintings. Edit titles, stories, sizes, prices, sale prices and
 * sold status here. Photos live in public/paintings/ (a full-size image and a
 * smaller "-thumb" version for grids).
 */

export interface Artwork {
  id: number;
  title: string;
  image: string;
  /** Smaller version of the image for grids and lists. */
  thumb: string;
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

function painting(
  collection: string,
  id: number,
  file: string,
  title: string,
  details: string[],
  price: number,
  extra: Partial<Pick<Artwork, 'salePrice' | 'sold' | 'dimensions'>> = {},
): Artwork {
  return {
    id,
    title,
    image: `/paintings/${file}.jpg`,
    thumb: `/paintings/${file}-thumb.jpg`,
    details,
    story: details.join(' '),
    dimensions: 'Size on request',
    price,
    sold: false,
    collection,
    ...extra,
  };
}

export const exhibitions: Exhibition[] = [
  {
    slug: 'forest',
    title: 'Forest',
    genre: 'ACRYLIC ON CANVAS',
    date: 'NEW WORK',
    location: 'ADDIS ABABA',
    isPast: false,
    items: [
      painting('Forest', 1, 'forest-procession', 'FOREST PROCESSION', [
        'Women with bright umbrellas walk through a tall green forest.',
        'Butterflies and white birds circle around them.',
        'Light opens up between the trees ahead.',
      ], 2400),
      painting('Forest', 2, 'green-cathedral', 'GREEN CATHEDRAL', [
        'A line of travellers passes under a great arch of trees.',
        'The forest glows brighter towards the centre.',
        'A flock of white birds rises over the path.',
      ], 2600, { salePrice: 2080 }),
      painting('Forest', 3, 'gathering-of-birds', 'GATHERING OF BIRDS', [
        'A small group stands together in a quiet clearing.',
        'Hundreds of white birds gather in the air around them.',
        'Deep green layers stretch to the horizon.',
      ], 2200),
      painting('Forest', 4, 'market-morning', 'MARKET MORNING', [
        'Women carrying baskets walk between two proud roosters.',
        'Umbrellas in yellow and orange shade them from the sun.',
        'The forest opens like a doorway behind them.',
      ], 2800),
      painting('Forest', 5, 'three-umbrellas', 'THREE UMBRELLAS', [
        'Three figures under red and orange umbrellas.',
        'Tall dark trees rise behind them.',
        'Small white birds drift across the canvas.',
      ], 1900, { sold: true }),
      painting('Forest', 6, 'under-the-vines', 'UNDER THE VINES', [
        'A family walks beneath hanging green vines.',
        'Leaves fall like rain around them.',
        'Their colourful clothes shine against the dark forest.',
      ], 2300),
      painting('Forest', 7, 'forest-light', 'FOREST LIGHT', [
        'A small group under umbrellas in a vast green field of leaves.',
        'Light falls softly from above.',
        'Every leaf is painted by hand.',
      ], 2100),
      painting('Forest', 8, 'quiet-clearing', 'QUIET CLEARING', [
        'Two companions shelter under umbrellas in a bright clearing.',
        'Birds rise from the grass around them.',
        'Layers of green fill the whole canvas.',
      ], 2000),
      painting('Forest', 9, 'falling-leaves', 'FALLING LEAVES', [
        'Two small figures stand under a shower of green leaves.',
        'Vines arch high above them.',
        'A quiet, glowing moment in the forest.',
      ], 1800, { salePrice: 1440 }),
      painting('Forest', 17, 'dark-forest-walk', 'DARK FOREST WALK', [
        'Three small figures with umbrellas under a glowing arch of leaves.',
        'White birds fly up through the dark forest.',
        'Ferns fill the ground in front of them.',
      ], 2000),
      painting('Forest', 18, 'the-long-procession', 'THE LONG PROCESSION', [
        'A long line of people in colourful clothes crosses a clearing.',
        'Some carry umbrellas, some carry baskets.',
        'A ring of white birds frames the whole crowd.',
      ], 3200),
      painting('Forest', 19, 'birds-over-the-field', 'BIRDS OVER THE FIELD', [
        'Four friends under umbrellas stand at the edge of a field.',
        'A great flock of white birds sweeps across the sky.',
        'Bright greens glow against the dark trees.',
      ], 2300),
      painting('Forest', 20, 'journey-by-night', 'JOURNEY BY NIGHT', [
        'A mother, a child and a laden donkey travel under a blue night sky.',
        'Countless white birds glow in the darkness.',
        'Tall green plants line the path home.',
      ], 2500),
      painting('Forest', 21, 'forest-doorway', 'FOREST DOORWAY', [
        'A small family stands in a doorway of light among tall trees.',
        'White birds circle above them.',
        'Calm, cool greens fill the canvas.',
      ], 2100),
      painting('Forest', 22, 'highland-farms', 'HIGHLAND FARMS', [
        'Terraced green hills with farmers and grazing cows.',
        'A flock of birds rises over the forest edge.',
        'A view of life in the Ethiopian highlands.',
      ], 2900),
      painting('Forest', 23, 'the-green-moon', 'THE GREEN MOON', [
        'Travellers and a donkey walk under a glowing green moon.',
        'Vines and birds fill the night forest.',
        'A quiet journey through the dark.',
      ], 2600),
    ],
  },
  {
    slug: 'garden',
    title: 'Garden',
    genre: 'ACRYLIC ON CANVAS',
    date: 'EARLIER WORK',
    location: 'ADDIS ABABA',
    isPast: true,
    items: [
      painting('Garden', 10, 'butterfly-women', 'BUTTERFLY WOMEN', [
        'Two women with butterfly wings among blooming flowers.',
        'Bright reds, pinks and greens on a deep blue ground.',
        'A celebration of beauty and freedom.',
      ], 2700),
      painting('Garden', 11, 'red-umbrella', 'THE RED UMBRELLA', [
        'Two women walk through a garden of flowers and butterflies.',
        'One carries a red umbrella against the sun.',
        'Patterned leaves fill every corner.',
      ], 2700, { sold: true }),
      painting('Garden', 12, 'blue-garden', 'BLUE GARDEN', [
        'A woman and a white bird meet under a glowing blue arch.',
        'Trees and leaves are drawn in fine detail.',
        'A dreamlike night garden.',
      ], 2500, { salePrice: 2000 }),
      painting('Garden', 13, 'the-bath', 'THE BATH', [
        'A woman rests in a bathtub in the middle of a garden.',
        'A single lamp glows above her.',
        'Flowers, cats and clay pots surround the scene.',
      ], 2400),
      painting('Garden', 14, 'woman-with-cat', 'WOMAN WITH CAT', [
        'A woman stands beside a tall clay pot where a black cat sits.',
        'An orange fruit hangs from a branch above.',
        'Fine white lines fill the dark background.',
      ], 2200),
      painting('Garden', 15, 'woman-with-rooster', 'WOMAN WITH ROOSTER', [
        'A woman holds up a rooster while chicks gather at her feet.',
        'Her red dress is covered in white dots.',
        'Painted on a ground of delicate silver leaves.',
      ], 2200),
      painting('Garden', 16, 'the-crossing', 'THE CROSSING', [
        'Hundreds of tiny figures cross a misty grey landscape.',
        'Small umbrellas add points of colour.',
        'A study of people moving together.',
      ], 3000),
      painting('Garden', 24, 'three-sisters-and-the-crane', 'THREE SISTERS AND THE CRANE', [
        'Three women in bright dresses stand among blue trees.',
        'A white crane and a flock of birds fly above them.',
        'Flowers and butterflies bloom at their feet.',
      ], 2800),
      painting('Garden', 25, 'coral-procession', 'CORAL PROCESSION', [
        'A line of people with umbrellas walks under a coral sky.',
        'White birds swirl through blue branches.',
        'Warm oranges and cool blues meet on the canvas.',
      ], 2400),
      painting('Garden', 26, 'woman-with-hen', 'WOMAN WITH HEN', [
        'Two women stand in a lime-green garden, one holding a hen.',
        'Chicks and round flowers gather at their feet.',
        'Patterned dresses in purple and red.',
      ], 2500),
      painting('Garden', 27, 'the-white-cranes', 'THE WHITE CRANES', [
        'A woman with an orange umbrella walks between two white cranes.',
        'A blue chequered floor leads into a garden of green flowers.',
        'Playful and dreamlike.',
      ], 2600),
      painting('Garden', 28, 'reflection', 'REFLECTION', [
        'A lone figure and a swan are mirrored in a still green pond.',
        'Tall vines rise behind them.',
        'A calm and quiet scene.',
      ], 2000),
      painting('Garden', 29, 'pink-forest', 'PINK FOREST', [
        'Four figures with umbrellas stand under a pink and violet arch.',
        'White birds rise around them.',
        'A forest painted in sunset colours.',
      ], 2300),
      painting('Garden', 30, 'cactus-garden', 'CACTUS GARDEN', [
        'Three women stand among tall green cacti.',
        'Butterflies and a ladybird rest among red flowers.',
        'Bold patterns on a bright lime ground.',
      ], 2700),
      painting('Garden', 31, 'the-flamingo', 'THE FLAMINGO', [
        'A woman reaches up as a pink flamingo flies over her.',
        'Dark green vines curl across a teal background.',
        'Graceful and full of movement.',
      ], 2400),
      painting('Garden', 32, 'rooster-ride', 'ROOSTER RIDE', [
        'A child with an umbrella rides on the back of a proud rooster.',
        'White birds fly overhead.',
        'A joyful, playful painting.',
      ], 2200),
      painting('Garden', 33, 'three-women-in-blue', 'THREE WOMEN IN BLUE', [
        'Three women stand together under a deep blue sky.',
        'A white bird and a dragonfly fly above them.',
        'Simple, strong shapes and rich colour.',
      ], 2600),
      painting('Garden', 34, 'woman-in-the-flowers', 'WOMAN IN THE FLOWERS', [
        'A woman smells a flower, almost hidden in a wall of leaves.',
        'Pink and blue blossoms are scattered all around.',
        'A peaceful garden portrait.',
      ], 2500),
      painting('Garden', 35, 'violet-arch', 'VIOLET ARCH', [
        'Five figures with umbrellas stand under a lilac archway.',
        'A bright green light glows behind them.',
        'Birds fall softly like snow.',
      ], 2300),
    ],
  },
];

const archiveWidths = ['250px', '200px', '180px', '220px', '150px', '190px', '210px', '170px'];

/** Every painting, shown on the Archive page. */
export const archive: ArchiveArtwork[] = exhibitions
  .flatMap(e => e.items)
  .map((artwork, i) => ({ ...artwork, width: archiveWidths[i % archiveWidths.length] }));

export const allArtworks: Artwork[] = exhibitions.flatMap(e => e.items);

/** Marks paintings sold online (reported by the payment server) as sold in the catalog. */
export function markSold(ids: number[]) {
  for (const artwork of [...allArtworks, ...archive]) {
    if (ids.includes(artwork.id)) artwork.sold = true;
  }
}

export function getArtwork(id: number): Artwork | undefined {
  return allArtworks.find(a => a.id === id);
}

/** The current store-wide promotion, shown in the marquee and on the offers page. */
export const promotion = {
  title: 'Season Promotion',
  message: 'Selected paintings up to 20% off',
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
