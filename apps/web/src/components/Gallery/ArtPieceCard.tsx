import { ArtPiece } from '../../lib/types';
import { strapiClient } from '../../lib/strapi';

interface ArtPieceCardProps {
  artPiece: ArtPiece;
  onClick?: () => void;
}

export function ArtPieceCard({ artPiece, onClick }: ArtPieceCardProps) {
  const imageUrl = artPiece.image?.url
    ? strapiClient.getMediaUrl(artPiece.image.url)
    : '/placeholder.png';

  return (
    <div
      onClick={onClick}
      className="cursor-pointer group overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-200">
        <img
          src={imageUrl}
          alt={artPiece.image?.alternativeText || artPiece.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {artPiece.featured && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-black px-2 py-1 rounded text-xs font-bold">
            Featured
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 mb-1">{artPiece.title}</h3>
        <p className="text-sm text-gray-600 mb-2">{artPiece.artist}</p>
        {artPiece.description && (
          <p className="text-sm text-gray-700 line-clamp-2 mb-3">{artPiece.description}</p>
        )}

        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1 text-xs text-gray-500">
            {artPiece.year && <span>Year: {artPiece.year}</span>}
            {artPiece.medium && <span>Medium: {artPiece.medium}</span>}
          </div>
          {artPiece.price && (
            <span className="text-lg font-bold text-gray-900">${artPiece.price}</span>
          )}
        </div>
      </div>
    </div>
  );
}
