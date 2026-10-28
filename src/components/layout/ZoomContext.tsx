import { X } from 'lucide-react';
import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const ZoomContext = createContext<(src: string) => void>(() => {});

/** Opens an image full screen from anywhere in the app. */
export function useZoom() {
  return useContext(ZoomContext);
}

export function ZoomProvider({ children }: { children: React.ReactNode }) {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  return (
    <ZoomContext.Provider value={setZoomedImage}>
      {children}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-[100] bg-bg/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={zoomedImage}
                alt="Zoomed view"
                className="max-w-full max-h-[85vh] object-contain shadow-2xl border border-border-color/30"
              />
              <button
                onClick={() => setZoomedImage(null)}
                className="absolute -top-12 right-0 text-text-muted hover:text-text-strong transition-colors flex items-center gap-2 text-xs tracking-widest uppercase"
              >
                CLOSE <X size={16} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ZoomContext.Provider>
  );
}
