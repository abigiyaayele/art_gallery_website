import { useState } from 'react';
import { GalleryGrid } from './components/Gallery/GalleryGrid';
import { ArtDetailModal } from './components/Gallery/ArtDetailModal';
import { ArtPiece } from './lib/types';

export default function App() {
  const [selectedArtPiece, setSelectedArtPiece] = useState<ArtPiece | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Art Gallery</h1>
          <p className="text-gray-600">Discover unique artwork managed by Strapi CMS</p>
        </div>
      </header>

      {/* Featured Gallery */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <GalleryGrid
            title="Featured Works"
            featured={true}
            onArtPieceClick={setSelectedArtPiece}
          />
        </div>
      </section>

      {/* All Gallery */}
      <section>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <GalleryGrid
            title="All Artwork"
            onArtPieceClick={setSelectedArtPiece}
          />
        </div>
      </section>

      {/* Art Detail Modal */}
      <ArtDetailModal
        artPiece={selectedArtPiece}
        onClose={() => setSelectedArtPiece(null)}
      />

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <p className="text-gray-400">Powered by Strapi CMS and React</p>
        </div>
      </footer>
    </div>
  );
}
