'use client';
import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Banner {
  id: string;
  titulo?: string;
  descricao?: string;
  imagemUrl: string;
  linkUrl?: string;
}

interface CatalogBannerProps {
  banners: Banner[];
  corPrimaria?: string;
}

export function CatalogBanner({ banners, corPrimaria }: CatalogBannerProps) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((p) => (p + 1) % banners.length), [banners.length]);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + banners.length) % banners.length), [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [banners.length, next]);

  if (!banners.length) return null;

  const banner = banners[current];

  return (
    <div className="relative w-full h-[200px] sm:h-[300px] md:h-[400px] rounded-2xl overflow-hidden group">
      <img
        src={banner.imagemUrl}
        alt={banner.titulo || ''}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
        {banner.titulo && (
          <h2 className="text-white text-xl sm:text-3xl font-bold mb-2">{banner.titulo}</h2>
        )}
        {banner.descricao && (
          <p className="text-white/80 text-sm sm:text-base">{banner.descricao}</p>
        )}
      </div>
      {banners.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronLeft size={20} />
          </button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white w-6' : 'bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
