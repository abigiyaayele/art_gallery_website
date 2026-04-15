# Strapi CMS Setup Guide

This guide will help you set up Strapi to manage your art gallery content.

## Prerequisites

- Node.js 16+ and npm installed
- PostgreSQL or SQLite (SQLite is default, easier for development)

## Installation Steps

### 1. Create Strapi Project

Create a new Strapi project in a separate directory:

```bash
# Navigate to your projects directory
cd ..

# Create Strapi project
npx create-strapi-app@latest art-gallery-cms --quickstart

# Or with PostgreSQL (if you prefer):
# npx create-strapi-app@latest art-gallery-cms
```

The `--quickstart` flag uses SQLite which is perfect for development.

### 2. Start Strapi

```bash
cd art-gallery-cms
npm run develop
```

Strapi will open at `http://localhost:1337`

### 3. Create Admin User

When you first visit Strapi, you'll be prompted to create an admin account. Create one now.

### 4. Create Content Types

In Strapi admin panel, go to **Content-Type Builder** and create these collections:

#### A. Art Piece Collection

1. Click **+ Create new collection type**
2. Name: `Art Piece` (Strapi will convert to `art-piece`)
3. Add these fields:

| Field Name   | Type                | Required | Notes                      |
|-------------|---------------------|----------|--------------------------|
| title       | Short text          | ✓        |                          |
| description | Long text           | ✓        | Use Rich Text editor     |
| artist      | Short text          | ✓        |                          |
| year        | Integer             |          |                          |
| medium      | Short text          |          | e.g., "Oil on Canvas"    |
| dimensions  | Short text          |          | e.g., "100x80 cm"        |
| price       | Decimal             |          |                          |
| image       | Media (Single)       | ✓        |                          |
| featured    | Boolean             |          | Default: false           |
| gallery     | Relation (Many-to-One) |          | Link to Gallery collection |

4. Click **Save**

#### B. Gallery Collection

1. Click **+ Create new collection type**
2. Name: `Gallery`
3. Add these fields:

| Field Name | Type                | Required | Notes           |
|-----------|---------------------|----------|-----------------|
| name      | Short text          | ✓        |                |
| description | Long text          |          |                |
| coverImage | Media (Single)      |          |                |

4. Click **Save**

### 5. Set Up API Permissions

1. Go to **Settings** → **Users & Permissions Plugin** → **Roles**
2. Click **Public** role
3. Scroll to **Permissions**
4. Expand **Art-piece** and check:
   - ✓ find
   - ✓ findOne
5. Expand **Gallery** and check:
   - ✓ find
   - ✓ findOne
6. Click **Save**

### 6. Create API Token (Optional - for authenticated requests)

1. Go to **Settings** → **API Tokens**
2. Click **+ Create new API Token**
3. Name: `Frontend Token`
4. Type: **Custom**
5. Select permissions for all collections (find, findOne, create, update, delete)
6. Click **Save**
7. Copy the token and paste it in your `.env.local` file:

```env
VITE_STRAPI_TOKEN=your_token_here
```

### 7. Configure CORS (Important!)

1. Go to **Settings** → **Administration panel**
2. Look for **CORS** settings (might be under general settings)
3. Add your frontend URL to allowed origins:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`

If CORS settings aren't visible in admin panel, edit the config file directly:

In your Strapi project, create/edit `config/middlewares.js`:

```javascript
module.exports = [
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      header: '*',
      origin: ['http://localhost:3000', 'http://localhost:1337'],
    },
  },
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
```

### 8. Add Sample Data

1. Go to **Content Manager** in Strapi
2. Click **Art Piece** → **+ Create new entry**
3. Fill in the form with sample data
4. Upload an image
5. Click **Save** and then **Publish**

Repeat for at least 2-3 art pieces to test your gallery.

## Frontend Integration

### 1. Environment Variables

In your React project, make sure `.env.local` is set up:

```env
VITE_STRAPI_URL=http://localhost:1337
VITE_STRAPI_TOKEN=  # Leave empty for public access or add your token
```

### 2. Test Connection

After starting your React app (`npm run dev`), you should see the gallery loading data from Strapi.

### 3. Example Usage in Components

```tsx
import { useStrapiFetch } from './hooks/useStrapi';
import { ArtPiece } from './lib/types';

function MyComponent() {
  const { data, loading, error } = useStrapiFetch<ArtPiece>('art-pieces', {
    populate: ['image'],
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      {data?.map(piece => (
        <div key={piece.id}>
          <h3>{piece.title}</h3>
          <p>{piece.description}</p>
        </div>
      ))}
    </div>
  );
}
```

## Running Both Services

### Terminal 1: Strapi Backend
```bash
cd art-gallery-cms
npm run develop
```

### Terminal 2: React Frontend
```bash
cd art_gallery_website
npm run dev
```

Both should be running simultaneously.

## Troubleshooting

### "Failed to fetch" or CORS errors
- Make sure Strapi is running on `http://localhost:1337`
- Check CORS configuration in Strapi
- Verify `VITE_STRAPI_URL` in `.env.local`

### "No art pieces found"
- Make sure you've created and published entries in Strapi
- Check that the Content-Type name matches (`art-piece` or `art_piece`)
- Verify API permissions are set to public

### Images not loading
- Check that the image upload was successful in Strapi
- Make sure `VITE_STRAPI_URL` is correct
- Images use relative URLs, so the full URL is constructed as: `{STRAPI_URL}{image.url}`

## Production Deployment

### Deploy Strapi
Popular options:
- Railway: https://railway.app/
- Render: https://render.com/
- Heroku (free tier discontinued)
- Self-hosted on your own server

### Deploy React
Popular options:
- Vercel: https://vercel.com/
- Netlify: https://www.netlify.com/
- Self-hosted on your own server

### Update Environment Variables
Update production environment variables with your deployed Strapi URL:

```env
VITE_STRAPI_URL=https://your-strapi-domain.com
```

## Additional Resources

- Strapi Docs: https://docs.strapi.io/
- Strapi Content API: https://docs.strapi.io/dev-docs/api/rest
- GraphQL API (optional): https://docs.strapi.io/dev-docs/api/graphql
