'use client';
import { create } from 'zustand';

interface CartItem {
  produtoId: string;
  nome: string;
  preco: number;
  quantidade: number;
  observacao?: string;
  imagem?: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (produtoId: string) => void;
  updateQuantity: (produtoId: string, quantidade: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  total: () => number;
  totalItems: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,

  addItem: (item) => {
    const items = get().items;
    const existing = items.find((i) => i.produtoId === item.produtoId);
    if (existing) {
      set({
        items: items.map((i) =>
          i.produtoId === item.produtoId
            ? { ...i, quantidade: i.quantidade + item.quantidade }
            : i
        ),
      });
    } else {
      set({ items: [...items, item] });
    }
  },

  removeItem: (produtoId) => {
    set({ items: get().items.filter((i) => i.produtoId !== produtoId) });
  },

  updateQuantity: (produtoId, quantidade) => {
    if (quantidade <= 0) {
      get().removeItem(produtoId);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.produtoId === produtoId ? { ...i, quantidade } : i
      ),
    });
  },

  clearCart: () => set({ items: [] }),
  toggleCart: () => set({ isOpen: !get().isOpen }),

  total: () => get().items.reduce((acc, i) => acc + i.preco * i.quantidade, 0),
  totalItems: () => get().items.reduce((acc, i) => acc + i.quantidade, 0),
}));
