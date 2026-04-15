# 🚀 Strapi + React Integration - Quick Start

Complete setup for integrating Strapi CMS with your Vite React application.

## What's Been Set Up

✅ **Strapi API Client** (`src/lib/strapi.ts`)
- Handles all API communication with Strapi
- Built-in error handling
- Support for filters, sorting, pagination
- Media URL handling

✅ **TypeScript Types** (`src/lib/types.ts`)
- Fully typed Strapi responses
- Art pieces, galleries, images
- Ready for production use

✅ **React Hooks** (`src/hooks/useStrapi.ts`)
- `useStrapiFetch()` - Fetch collections
- `useStrapiFetchItem()` - Fetch single items
- `useStrapiCreate()` - Create items
- `useStrapiUpdate()` - Update items
- `useStrapiDelete()` - Delete items

✅ **Example Components** (`src/components/Gallery/`)
- `GalleryGrid` - Display art pieces in grid
- `ArtPieceCard` - Individual art card
- `ArtDetailModal` - Art details popup

✅ **Environment Configuration** (`.env.local`)
- Strapi URL and token configuration
- Ready for Strapi at `http://localhost:1337`

## Quick Start (5 minutes)

### Step 1: Install Strapi

In a new terminal, run:

```bash
# Create a new Strapi project in a sibling directory
cd ..
npx create-strapi-app@latest art-gallery-cms --quickstart
```

This will:
- Download Strapi
- Initialize SQLite database
- Open admin panel at `http://localhost:1337`

### Step 2: Create Admin Account

When Strapi opens, create your admin account with:
- Email: `admin@example.com`
- Password: `Admin@123`

### Step 3: Set Up Content Type

Follow the **"Create Collections"** section in `STRAPI_SETUP.md`:

1. Create **Art Piece** collection with fields:
   - `title` (short text)
   - `description` (long text)
   - `artist` (short text)
   - `year` (integer)
   - `medium` (short text)
   - `dimensions` (short text)
   - `price` (decimal)
   - `image` (media)
   - `featured` (boolean)

2. Create at least 2-3 test art pieces with images

3. Set API permissions to public (allow `find` and `findOne`)

### Step 4: Run Your React App

In the art_gallery_website directory:

```bash
npm run dev
```

Open `http://localhost:3000` and you should see your gallery!

## File Structure

```
src/
├── lib/
│   ├── strapi.ts          # Strapi client
│   └── types.ts           # TypeScript types
├── hooks/
│   └── useStrapi.ts       # React hooks
├── components/
│   └── Gallery/
│       ├── GalleryGrid.tsx       # Main gallery component
│       ├── ArtPieceCard.tsx      # Individual card
│       └── ArtDetailModal.tsx    # Detail view
├── App.tsx                # Your main app
└── App-example.tsx        # Example implementation
```

## Usage Examples

### Display a Gallery

```tsx
import { GalleryGrid } from './components/Gallery/GalleryGrid';
import { ArtPiece } from './lib/types';

function MyPage() {
  const handleArtClick = (artPiece: ArtPiece) => {
    console.log('Selected:', artPiece.title);
  };

  return (
    <GalleryGrid 
      title="My Gallery"
      onArtPieceClick={handleArtClick}
    />
  );
}
```

### Fetch Data Directly

```tsx
import { useStrapiFetch } from './hooks/useStrapi';
import { ArtPiece } from './lib/types';

function MyComponent() {
  const { data, loading, error } = useStrapiFetch<ArtPiece>('art-pieces', {
    populate: ['image', 'gallery'],
    sort: ['createdAt:desc'],
    pagination: { pageSize: 10 },
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {data?.map(piece => (
        <li key={piece.id}>{piece.title} by {piece.artist}</li>
      ))}
    </ul>
  );
}
```

### Fetch Single Item

```tsx
import { useStrapiFetchItem } from './hooks/useStrapi';
import { ArtPiece } from './lib/types';

function ArtDetails({ id }: { id: number }) {
  const { data, loading, error } = useStrapiFetchItem<ArtPiece>(
    'art-pieces',
    id,
    { populate: ['image'] }
  );

  if (loading) return <p>Loading...</p>;
  if (!data) return <p>Not found</p>;

  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.description}</p>
    </div>
  );
}
```

### Create Item

```tsx
import { useStrapiCreate } from './hooks/useStrapi';
import { ArtPiece } from './lib/types';

function CreateArtForm() {
  const { create, loading, error } = useStrapiCreate<ArtPiece>('art-pieces');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await create({
        title: 'My Artwork',
        artist: 'John Doe',
        description: 'A beautiful piece',
      });
      alert('Created!');
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" placeholder="Title" required />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create'}
      </button>
      {error && <p>Error: {error.message}</p>}
    </form>
  );
}
```

## API Reference

### `strapiClient.getCollection<T>(collectionName, options?)`

Fetch multiple items from a collection.

```typescript
const artPieces = await strapiClient.getCollection<ArtPiece>('art-pieces', {
  populate: ['image', 'gallery'],
  filters: { featured: true },
  sort: ['createdAt:desc'],
  pagination: { page: 1, pageSize: 10 },
});
```

### `strapiClient.getItem<T>(collectionName, id, options?)`

Fetch a single item.

```typescript
const artPiece = await strapiClient.getItem<ArtPiece>('art-pieces', 1, {
  populate: ['image'],
});
```

### `strapiClient.getMediaUrl(path)`

Convert Strapi media URL to full URL.

```typescript
const fullUrl = strapiClient.getMediaUrl(artPiece.image?.url);
```

### `strapiClient.createItem<T>(collectionName, data)`

Create a new item.

```typescript
const newArt = await strapiClient.createItem<ArtPiece>('art-pieces', {
  title: 'New Art',
  artist: 'Jane Doe',
  description: 'Description',
});
```

### `strapiClient.updateItem<T>(collectionName, id, data)`

Update an item.

```typescript
const updated = await strapiClient.updateItem<ArtPiece>('art-pieces', 1, {
  title: 'Updated Title',
});
```

### `strapiClient.deleteItem(collectionName, id)`

Delete an item.

```typescript
await strapiClient.deleteItem('art-pieces', 1);
```

## Environment Variables

Set these in `.env.local`:

```env
# Strapi API URL (default: http://localhost:1337)
VITE_STRAPI_URL=http://localhost:1337

# Strapi API Token (optional, leave empty for public access)
VITE_STRAPI_TOKEN=

# Keep your existing vars:
GEMINI_API_KEY=your_key
```

## Troubleshooting

### "Cannot GET /api/art-pieces" (404)
- Strapi is not running. Start it: `npm run develop` in the strapi directory
- Collection name is wrong. Make sure it's `art-pieces` or `art_pieces`

### CORS error
- Check Strapi CORS settings in `config/middlewares.js`
- Make sure `http://localhost:3000` is in the allowed origins

### "Failed to load gallery - Make sure Strapi is running"
- Verify `VITE_STRAPI_URL` is correct in `.env.local`
- Strapi should be running at `http://localhost:1337`

### Images not loading
- Check that images were uploaded in Strapi
- Verify `populate: ['image']` is in your query
- Check the full URL: `{STRAPI_URL}{image.url}`

## Next Steps

1. ✅ Copy the setup code
2. ✅ Read `STRAPI_SETUP.md` for detailed Strapi configuration
3. ✅ Create content in Strapi admin panel
4. ✅ Update `App.tsx` with your components
5. ✅ Deploy to production (see `STRAPI_SETUP.md`)

## Support

- Strapi Docs: https://docs.strapi.io/
- React Docs: https://react.dev/
- Vite Docs: https://vitejs.dev/

Happy coding! 🎨
