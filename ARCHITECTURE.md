# Architecture: Vite React + Strapi CMS

## System Architecture

```

                     Browser / Client                        

                                                             
    
         Vite React Application (Port   3000)            
    
                                                          
         
            React    Components                       
   App.   tsx                                       
      GalleryGrid                                   
      ArtPieceCard                                  
      ArtDetailModal                                
         
   uses                                                
         
     React Hooks (  useStrapi.   ts)                 
      useStrapiFetch()                              
      useStrapiFetchItem()                          
 useStrapiCreate/  Update/   Delete()              
         
   uses                                                
         
    Strapi Client (  strapi.   ts)                   
      getCollection()                               
      getItem()                                     
 createItem() /   updateItem() /    delete()        
      getMediaUrl()                                 
         
   uses                                                
         
       Axios   HTTP    Client                         
 Sends REST API calls   to    Strapi          
         
                                                          
    
                                                             

           
 REST API (http://localhost:1337/api)           
 Filters, sorting, pagination           
           
           

              Strapi CMS (Port 1337)                        

                                                             
    
         Strapi Content   Manager                        
 Art Pieces   Collection                               
 Galleries   Collection                                
 Pages   Collection                                    
    
                                                           
    
      Strapi REST API   Endpoints                        
 GET    /api/art-  pieces                              
 GET    /api/art-pieces/:  id                          
 POST   /api/art-  pieces                              
 PUT    /api/art-pieces/:  id                          
 DELETE /api/art-pieces/:  id                          
    
                                                           
    
      Strapi   Database                                 
  (SQLite for dev, PostgreSQL for   production)         
    
                                                             

```

## Data Flow Example

### 1. Fetching Art Pieces

```
User visits gallery page
         
GalleryGrid component mounts
         
useStrapiFetch('art-pieces', { populate: ['image'] })
         
strapiClient.getCollection()
         
axios.get('/api/art-pieces?populate=image')
         
Strapi processes request
         
Queries database for art pieces + related images
         
Returns JSON response
         
Client renders ArtPieceCard components
         
User sees gallery with images
```

### 2. Displaying Art Details

```
User clicks art piece
         
onArtPieceClick() triggered
         
ArtDetailModal shows selected piece
         
strapiClient.getMediaUrl(image.url)
         
Full URL constructed: http://localhost:1337{image.url}
         
<img> tag loads image
         
Modal displays all details
```

## Component Architecture

```
App.tsx
 Header
 Section: Featured Gallery
 GalleryGrid (featured={true})   
 Loading state       
 Error boundary       
 ArtPieceCard[] (mapped)       
 Image           
 Title           
 Price           

 Section: All Artwork
 GalleryGrid   
 ArtPieceCard[]       

 ArtDetailModal
 Full image   
 Title   
 Description   
 Metadata (artist, year, medium)   
 Price + "Add to Cart"   

 Footer
```

## API Response Types

```
GET /api/art-pieces?populate=image

{
  "data": [
    {
      "id": 1,
      "title": "Sunset Over Mountains",
      "description": "Beautiful landscape",
      "artist": "John Doe",
      "year": 2023,
      "medium": "Oil on Canvas",
      "dimensions": "100x80 cm",
      "price": 5000,
      "featured": true,
      "image": {
        "id": 10,
        "name": "sunset.jpg",
        "url": "/uploads/sunset_abc123.jpg",
        "width": 800,
        "height": 600
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 5
    }
  }
}
```

## Directory Structure

```
art_gallery_website/
 src/
 lib/   
 strapi.ts          # Strapi API client      
 types.ts           # TypeScript types      
 hooks/   
 useStrapi.ts       # React hooks      
 components/   
 Gallery/      
 GalleryGrid.tsx          
 ArtPieceCard.tsx          
 ArtDetailModal.tsx          
 App.tsx   
 App-example.tsx   
 main.tsx   
 index.css   
 .env.local                 # Environment variables
 package.json
 vite.config.ts
 tsconfig.json
 STRAPI_QUICK_START.md      # Quick start guide
 STRAPI_SETUP.md            # Detailed setup
 INTEGRATION_SUMMARY.md     # This summary
 ARCHITECTURE.md            # Architecture docs

art-gallery-cms/ (separate project)
 src/
 api/   
 art-piece/       
 gallery/       
 config/
 middlewares.js         # CORS config   
 database/
 migrations/   
 package.json
```

## Environment Variables

```
.env.local (React)
 VITE_STRAPI_URL           # Strapi API base URL
 VITE_STRAPI_TOKEN         # Optional API token
 GEMINI_API_KEY            # Existing

.env (Strapi)
 DATABASE_CLIENT           # SQLite or PostgreSQL
 DATABASE_FILENAME         # For SQLite
 DATABASE_HOST             # For PostgreSQL
 DATABASE_PORT             # For PostgreSQL
 DATABASE_NAME             # Database name
 JWT_SECRET                # For authentication
```

## Data Types

### TypeScript Interfaces

```typescript
interface ArtPiece {
  id: number;
  title: string;
  description: string;
  artist: string;
  year?: number;
  medium?: string;
  dimensions?: string;
  price?: number;
  image?: StrapiImage;
  featured?: boolean;
}

interface StrapiImage {
  id: number;
  name: string;
  url: string;
  width: number;
  height: number;
  formats?: {
    thumbnail?: { url: string };
    small?: { url: string };
    medium?: { url: string };
    large?: { url: string };
  };
}

interface Gallery {
  id: number;
  name: string;
  description?: string;
  coverImage?: StrapiImage;
  artPieces?: ArtPiece[];
}
```

## API Endpoints

```
GET  /api/art-pieces
  - Fetch all art pieces
  - Query params: populate, filters, sort, pagination

GET  /api/art-pieces/:id
  - Fetch single art piece
  - Query params: populate

POST /api/art-pieces
  - Create new art piece
  - Requires authentication

PUT  /api/art-pieces/:id
  - Update art piece
  - Requires authentication

DELETE /api/art-pieces/:id
  - Delete art piece
  - Requires authentication

GET  /api/galleries
  - Fetch all galleries

GET  /api/galleries/:id
  - Fetch single gallery
```

## Authentication Flow (Optional)

```
1. User logs in with credentials
2. Strapi returns JWT token
3. Token stored in localStorage
4. Added to Authorization header: Bearer {token}
5. Requests authenticated as user
6. Can access protected endpoints
```

## Performance Considerations

```
1. Image Optimization
 Strapi generates multiple formats   
 Client uses appropriate size   

2. Pagination
 Load 25 items per page by default   
 Implement "Load More" or pagination   

3. Caching
 React Query (optional enhancement)   
 Reduce API calls   

4. Lazy Loading
 Images loaded on demand   
 Components render efficiently   

5. Error Handling
 Try-catch in API client   
 Error states in components   
 User-friendly error messages   
```

## Deployment Architecture

```
Production:


  Frontend       
  (Vercel)       
  art-gallery.   
  example.com    

         
 API calls         
         

  Strapi CMS     
  (Railway)      
  api.example.   
  com            

         
         

  PostgreSQL     
  (Managed DB)   

```

## Security

```
1. CORS Configuration
 Allow only trusted origins   
 http://localhost:3000 (dev)   

2. Environment Variables
 Never commit tokens   
 Use .env.local (gitignored)   

3. API Tokens
 Generate in Strapi admin   
 Store securely   
 Rotate periodically   

4. Database
 Use managed services   
 Enable backups   
```

