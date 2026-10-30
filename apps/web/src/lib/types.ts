/**
 * Strapi API Response Types
 */

export interface StrapiImage {
  id: number;
  name: string;
  alternativeText?: string;
  caption?: string;
  width: number;
  height: number;
  formats?: {
    thumbnail?: {
      url: string;
      width: number;
      height: number;
    };
    small?: {
      url: string;
      width: number;
      height: number;
    };
    medium?: {
      url: string;
      width: number;
      height: number;
    };
    large?: {
      url: string;
      width: number;
      height: number;
    };
  };
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl?: string;
  provider: string;
  provider_metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ArtPiece {
  id: number;
  title: string;
  description: string;
  artist: string;
  year?: number;
  medium?: string;
  dimensions?: string;
  price?: number;
  image?: StrapiImage;
  gallery?: Gallery;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Gallery {
  id: number;
  name: string;
  description?: string;
  coverImage?: StrapiImage;
  artPieces?: ArtPiece[];
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  image?: StrapiImage;
  createdAt: string;
  updatedAt: string;
}

/**
 * API Response Wrapper
 */
export interface StrapiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}
