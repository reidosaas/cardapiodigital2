'use client';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import Link from 'next/link';

interface ProductCardProps {
  produto: {
    id: string;
    nome: string;
    descricao?: string | null;
    preco: number;
    precoPromocional?: number | null;
    imagens?: any;
    destaque?: boolean;
    estoque?: number;
    ilimitado?: boolean;
    _count?: { avaliacoes: number };
    categoria?: { id: string; nome: string } | null;
  };
  slug: string;
  corPrimaria?: string;
  onAddToCart: (produto: any) => void;
}

export function ProductCard({ produto, slug, corPrimaria, onAddToCart }: ProductCardProps) {
  const imagens = Array.isArray(produto.imagens) ? produto.imagens : [];
  const semEstoque = !produto.ilimitado && produto.estoque !== undefined && produto.estoque <= 0;
  const precoFinal = produto.precoPromocional || produto.preco;
  const temPromocao = !!produto.precoPromocional;
  return (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <Link href={`/catalogo/${slug}/produto/${produto.id}`} className="block relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-900">
        {imagens[0] ? (
          <img src={imagens[0]} alt={produto.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        )}
        {temPromocao && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
            -{Math.round((1 - produto.precoPromocional! / produto.preco) * 100)}%
          </span>
        )}
        {produto.destaque && (
          <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-lg">
            Destaque
          </span>
        )}
        {semEstoque && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-4 py-2 rounded-lg font-medium text-sm">Indisponivel</span>
          </div>
        )}
      </Link>

      <div className="p-4 space-y-2">
        <Link href={`/catalogo/${slug}/produto/${produto.id}`}>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors line-clamp-1">{produto.nome}</h3>
        </Link>
        {produto.descricao && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{produto.descricao}</p>
        )}
        {produto._count && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            <span>{produto._count.avaliacoes} avaliacoes</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-2">
          <div>
            {temPromocao ? (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">R$ {Number(precoFinal).toFixed(2)}</span>
                <span className="text-sm text-gray-400 line-through">R$ {Number(produto.preco).toFixed(2)}</span>
              </div>
            ) : (
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">R$ {Number(produto.preco).toFixed(2)}</span>
            )}
          </div>
          <button
            onClick={() => onAddToCart(produto)}
            disabled={semEstoque}
            className="p-2.5 rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            style={{ backgroundColor: corPrimaria || '#2563eb' }}
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
