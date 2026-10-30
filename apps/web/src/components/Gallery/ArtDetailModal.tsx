import { ArtPiece } from '../../lib/types';
import { strapiClient } from '../../lib/strapi';
import { X } from 'lucide-react';

interface ArtDetailModalProps {
  artPiece: ArtPiece | null;
  onClose: () => void;
}

export function ArtDetailModal({ artPiece, onClose }: ArtDetailModalProps) {
  if (!artPiece) return null;

  const imageUrl = artPiece.image?.url
    ? strapiClient.getMediaUrl(artPiece.image.url)
    : '/placeholder.png';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-white">
          <h2 className="text-2xl font-bold text-gray-900">{artPiece.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="aspect-square overflow-hidden rounded-lg bg-gray-200">
            <img
              src={imageUrl}
              alt={artPiece.image?.alternativeText || artPiece.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Artist</p>
                <p className="text-lg font-semibold text-gray-900">{artPiece.artist}</p>
              </div>
              {artPiece.year && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Year</p>
                  <p className="text-lg font-semibold text-gray-900">{artPiece.year}</p>
                </div>
              )}
            </div>

            {artPiece.description && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Description</p>
                <p className="text-gray-700 leading-relaxed">{artPiece.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {artPiece.medium && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Medium</p>
                  <p className="text-gray-900">{artPiece.medium}</p>
                </div>
              )}
              {artPiece.dimensions && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Dimensions</p>
                  <p className="text-gray-900">{artPiece.dimensions}</p>
                </div>
              )}
            </div>

            {artPiece.price && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-1">Price</p>
                <p className="text-2xl font-bold text-gray-900">${artPiece.price}</p>
              </div>
            )}

            <button className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition font-semibold">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
