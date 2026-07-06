'use client';
import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';

interface ProductGalleryProps {
  imagens: string[];
  videoUrl?: string | null;
  nome: string;
}

export function ProductGallery({ imagens, videoUrl, nome }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const allMedia = [
    ...(videoUrl && showVideo ? [{ type: 'video' as const, url: videoUrl }] : []),
    ...imagens.map((url) => ({ type: 'image' as const, url })),
  ];

  const currentSrc = imagens[selectedIndex] || '';

  return (
    <>
      <div className="space-y-3">
        <div
          className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer group"
          onClick={() => setLightboxOpen(true)}
        >
          <img src={currentSrc} alt={nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          {videoUrl && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowVideo(!showVideo); }}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors"
              title={showVideo ? 'Mostrar imagem' : 'Ver video'}
            >
              <Play size={18} className={showVideo ? 'text-blue-400' : ''} />
            </button>
          )}
        </div>
        {imagens.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {imagens.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedIndex(i)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === selectedIndex ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <img src={img} alt={`${nome} ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 text-white/80 hover:text-white p-2">
            <X size={24} />
          </button>
          {imagens.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setSelectedIndex((p) => (p - 1 + imagens.length) % imagens.length); }} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2">
                <ChevronLeft size={32} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setSelectedIndex((p) => (p + 1) % imagens.length); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2">
                <ChevronRight size={32} />
              </button>
            </>
          )}
          <img src={imagens[selectedIndex]} alt={nome} className="max-w-[90vw] max-h-[90vh] object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
