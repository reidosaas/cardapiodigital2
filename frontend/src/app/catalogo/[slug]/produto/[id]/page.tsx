'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingCart, Package, Truck, Shield, Share2, Heart, Minus, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { ProductGallery } from '@/components/catalog/product-gallery';
import { ProductVariations } from '@/components/catalog/product-variations';
import { ProductReviews } from '@/components/catalog/product-reviews';
import { ProductCard } from '@/components/catalog/product-card';
import { CatalogLayout } from '@/components/catalog/catalog-layout';

export default function ProdutoDetalhe() {
  const { slug, id } = useParams() as { slug: string; id: string };
  const router = useRouter();
  const [produto, setProduto] = useState<any>(null);
  const [vendedor, setVendedor] = useState<any>(null);
  const [relacionados, setRelacionados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qtd, setQtd] = useState(1);
  const [variacoesSelected, setVariacoesSelected] = useState<Record<string, string>>({});
  const [cartItems, setCartItems] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [vRes, pRes] = await Promise.all([
          api.get(`/api/vendedores/slug/${slug}`),
          api.get(`/api/produtos/${id}`),
        ]);
        setVendedor(vRes.data);
        setProduto(pRes.data);

        if (pRes.data.categoriaId) {
          const relRes = await api.get(`/api/produtos/vendedor/${vRes.data.id}`, {
            params: { categoriaId: pRes.data.categoriaId },
          });
          setRelacionados(relRes.data.filter((p: any) => p.id !== id).slice(0, 4));
        }
      } catch {
        toast.error('Erro ao carregar produto');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse space-y-4">
          <div className="aspect-square bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/4" />
          <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!produto || !vendedor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Package size={48} className="mx-auto mb-3" />
          <p className="font-medium">Produto nao encontrado</p>
        </div>
      </div>
    );
  }

  const imagens = Array.isArray(produto.imagens) ? produto.imagens : [];
  const variacoes = produto.variacoes ? (typeof produto.variacoes === 'string' ? JSON.parse(produto.variacoes) : produto.variacoes) : [];
  const precoFinal = produto.precoPromocional || produto.preco;
  const temPromocao = !!produto.precoPromocional;
  const semEstoque = !produto.ilimitado && produto.estoque <= 0;
  const corPrimaria = vendedor.corPrimaria || '#2563eb';

  const handleAddToCart = () => {
    const item = {
      produtoId: produto.id,
      nome: produto.nome,
      preco: Number(precoFinal),
      quantidade: qtd,
      observacao: Object.entries(variacoesSelected).map(([k, v]) => `${k}: ${v}`).join(', '),
      imagem: imagens[0],
    };
    setCartItems((prev) => [...prev, item]);
    toast.success(`${qtd}x ${produto.nome} adicionado ao carrinho`);
  };

  const handleVariationSelect = (nome: string, opcao: string) => {
    setVariacoesSelected((prev) => ({ ...prev, [nome]: opcao }));
  };

  const handleCheckout = () => {
    const msg = [
      `*Novo Pedido - ${vendedor.nomeLoja}*`,
      ``,
      `${qtd}x ${produto.nome} - R$ ${Number(precoFinal * qtd).toFixed(2)}`,
      Object.entries(variacoesSelected).length ? `Variacoes: ${Object.entries(variacoesSelected).map(([k, v]) => `${k}: ${v}`).join(', ')}` : '',
      ``,
      `*Total: R$ ${Number(precoFinal * qtd).toFixed(2)}*`,
    ].filter(Boolean).join('\n');

    if (vendedor.whatsappNumero) {
      window.open(`https://wa.me/${vendedor.whatsappNumero.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  return (
    <CatalogLayout vendedor={vendedor}>
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors">
        <ArrowLeft size={18} />
        Voltar
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        <ProductGallery imagens={imagens} videoUrl={produto.videoUrl} nome={produto.nome} />

        <div className="space-y-5">
          <div>
            {produto.categoria && (
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{produto.categoria.nome}</span>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{produto.nome}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold" style={{ color: corPrimaria }}>R$ {Number(precoFinal).toFixed(2)}</span>
              {temPromocao && (
                <span className="text-lg text-gray-400 line-through">R$ {Number(produto.preco).toFixed(2)}</span>
              )}
            </div>
            {temPromocao && (
              <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-1 rounded-lg">
                -{Math.round((1 - Number(produto.precoPromocional) / Number(produto.preco)) * 100)}%
              </span>
            )}
          </div>

          {produto.descricao && (
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{produto.descricao}</p>
          )}

          <div className="flex items-center gap-4 text-sm">
            {produto.ilimitado ? (
              <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400"><Check size={16} /> Disponivel</span>
            ) : (
              <span className={`flex items-center gap-1.5 ${produto.estoque > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                <Package size={16} />
                {produto.estoque > 0 ? `${produto.estoque} em estoque` : 'Indisponivel'}
              </span>
            )}
            {produto.tempoPreparoMin && (
              <span className="text-gray-400 flex items-center gap-1.5"><Truck size={16} /> ~{produto.tempoPreparoMin}min</span>
            )}
          </div>

          <ProductVariations
            variacoes={variacoes}
            selected={variacoesSelected}
            onSelect={handleVariationSelect}
            corPrimaria={corPrimaria}
          />

          {!semEstoque && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantidade:</span>
              <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-xl px-2 py-1">
                <button onClick={() => setQtd((p) => Math.max(1, p - 1))} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center font-semibold">{qtd}</span>
                <button onClick={() => setQtd((p) => Math.min(produto.ilimitado ? 99 : produto.estoque, p + 1))} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={semEstoque}
              className="flex-1 py-3.5 px-6 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: corPrimaria }}
            >
              <ShoppingCart size={20} />
              Adicionar ao Carrinho
            </button>
            <button
              onClick={handleCheckout}
              disabled={semEstoque}
              className="py-3.5 px-6 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#25D366' }}
            >
              Comprar via WhatsApp
            </button>
          </div>

          <div className="flex items-center gap-4 pt-2 text-sm text-gray-400">
            <button className="flex items-center gap-1.5 hover:text-gray-600 transition-colors"><Shield size={16} /> Pagamento seguro</button>
            <button className="flex items-center gap-1.5 hover:text-gray-600 transition-colors"><Share2 size={16} /> Compartilhar</button>
          </div>
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Produtos Relacionados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relacionados.map((p) => (
              <ProductCard
                key={p.id}
                produto={p}
                slug={slug as string}
                corPrimaria={corPrimaria}
                onAddToCart={() => {}}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Avaliacoes</h2>
        <ProductReviews produtoId={produto.id} corPrimaria={corPrimaria} />
      </section>

      {cartItems.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={() => router.push(`/catalogo/${slug}`)}
            className="flex items-center gap-3 px-6 py-3 rounded-full text-white shadow-lg shadow-black/20"
            style={{ backgroundColor: corPrimaria }}
          >
            <ShoppingCart size={20} />
            <span className="font-medium">{cartItems.reduce((a, i) => a + i.quantidade, 0)} itens no carrinho</span>
            <span className="bg-white/20 rounded-full px-2 py-0.5 text-sm font-bold">
              R$ {cartItems.reduce((a, i) => a + i.preco * i.quantidade, 0).toFixed(2)}
            </span>
          </button>
        </div>
      )}
    </CatalogLayout>
  );
}
