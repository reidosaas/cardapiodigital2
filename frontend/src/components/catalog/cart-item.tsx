'use client';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface CartItemProps {
  item: {
    produtoId: string;
    nome: string;
    preco: number;
    quantidade: number;
    observacao?: string;
    imagem?: string;
  };
  onUpdateQuantity: (produtoId: string, quantidade: number) => void;
  onRemove: (produtoId: string) => void;
}

export function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
      {item.imagem && (
        <img src={item.imagem} alt={item.nome} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{item.nome}</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">R$ {item.preco.toFixed(2)}</p>
        {item.observacao && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">Obs: {item.observacao}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => onUpdateQuantity(item.produtoId, item.quantidade - 1)}
            className="p-1 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <Minus size={14} />
          </button>
          <span className="text-sm font-medium w-6 text-center">{item.quantidade}</span>
          <button
            onClick={() => onUpdateQuantity(item.produtoId, item.quantidade + 1)}
            className="p-1 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => onRemove(item.produtoId)}
            className="ml-auto p-1.5 rounded-md text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
