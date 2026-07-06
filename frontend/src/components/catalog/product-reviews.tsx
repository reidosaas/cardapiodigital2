'use client';
import { useState, useEffect } from 'react';
import { Star, ThumbsUp, MessageSquare } from 'lucide-react';
import { RatingStars } from './rating-stars';
import api from '@/lib/api';

interface Review {
  id: string;
  nota: number;
  comentario?: string | null;
  resposta?: string | null;
  createdAt: string;
  cliente: { nome: string };
}

interface ProductReviewsProps {
  produtoId: string;
  corPrimaria?: string;
}

export function ProductReviews({ produtoId, corPrimaria }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [media, setMedia] = useState({ media: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/api/avaliacoes/produto/${produtoId}`).then((r) => setReviews(r.data)),
      api.get(`/api/avaliacoes/media/${produtoId}`).then((r) => setMedia(r.data)),
    ]).finally(() => setLoading(false));
  }, [produtoId]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!reviews.length) {
    return (
      <div className="text-center py-8 text-gray-400">
        <MessageSquare size={40} className="mx-auto mb-3 opacity-50" />
        <p className="font-medium">Nenhuma avaliacao ainda</p>
        <p className="text-sm">Seja o primeiro a avaliar este produto</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{media.media.toFixed(1)}</div>
          <RatingStars nota={media.media} />
          <div className="text-xs text-gray-400 mt-1">{media.total} avaliacoes</div>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
                  {review.cliente.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{review.cliente.nome}</p>
                  <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <RatingStars nota={review.nota} />
            </div>
            {review.comentario && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{review.comentario}</p>
            )}
            {review.resposta && (
              <div className="mt-3 ml-4 pl-3 border-l-2 border-gray-200 dark:border-gray-600">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Resposta do vendedor:</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{review.resposta}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
