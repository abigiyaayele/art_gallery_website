import { useStrapiFetch } from '../../hooks/useStrapi';
import { ArtPiece } from '../../lib/types';
import { ArtPieceCard } from './ArtPieceCard';

interface GalleryGridProps {
  title?: string;
  featured?: boolean;
  onArtPieceClick?: (artPiece: ArtPiece) => void;
}

export function GalleryGrid({ title = 'Gallery', featured, onArtPieceClick }: GalleryGridProps) {
  const { data: artPieces, loading, error } = useStrapiFetch<ArtPiece>('art-pieces', {
    populate: ['image', 'gallery'],
    filters: featured ? { featured: true } : undefined,
    sort: ['createdAt:desc'],
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 font-semibold mb-2">Failed to load gallery</p>
        <p className="text-red-600 text-sm">{error.message}</p>
        <p className="text-red-500 text-xs mt-2">
          Make sure Strapi is running on {import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337'}
        </p>
      </div>
    );
  }

  if (!artPieces || artPieces.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No art pieces found</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold mb-8 text-gray-900">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {artPieces.map((artPiece) => (
          <ArtPieceCard
            key={artPiece.id}
            artPiece={artPiece}
            onClick={() => onArtPieceClick?.(artPiece)}
          />
        ))}
      </div>
    </div>
  );
}
