'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Package, Store, Phone, MapPin, Clock, MessageSquare, Heart, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Loading } from '@/components/shared/loading';
import { SearchBar } from '@/components/catalog/search-bar';
import { CategoryFilter } from '@/components/catalog/category-filter';
import { CatalogBanner } from '@/components/catalog/catalog-banner';
import { ProductCard } from '@/components/catalog/product-card';
import { CartItemRow } from '@/components/catalog/cart-item';
import { CheckoutPanel } from '@/components/catalog/checkout-panel';

export default function CatalogoPublico() {
  const { slug } = useParams();
  const router = useRouter();
  const [vendedor, setVendedor] = useState<any>(null);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutMode, setCheckoutMode] = useState(false);
  const [clienteModoEscuro, setClienteModoEscuro] = useState<boolean | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const vRes = await api.get(`/api/vendedores/slug/${slug}`);
        setVendedor(vRes.data);
        const [prodRes, catRes, banRes] = await Promise.all([
          api.get(`/api/produtos/vendedor/${vRes.data.id}`),
          api.get(`/api/categorias/vendedor/${vRes.data.id}`),
          api.get(`/api/banners/vendedor/${vRes.data.id}`),
        ]);
        setProdutos(prodRes.data);
        setCategorias(catRes.data);
        setBanners(banRes.data);
      } catch {
        toast.error('Erro ao carregar catalogo');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [slug]);

  const addToCart = (produto: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.produtoId === produto.id);
      if (existing) {
        return prev.map((item) =>
          item.produtoId === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item
        );
      }
      return [{
        produtoId: produto.id,
        nome: produto.nome,
        preco: Number(produto.precoPromocional || produto.preco),
        quantidade: 1,
        imagem: Array.isArray(produto.imagens) ? produto.imagens[0] : undefined,
      }, ...prev];
    });
    toast.success(`${produto.nome} adicionado ao carrinho`);
  };

  const removeFromCart = (produtoId: string) => {
    setCart((prev) => prev.filter((item) => item.produtoId !== produtoId));
  };

  const updateQuantity = (produtoId: string, quantidade: number) => {
    if (quantidade <= 0) { removeFromCart(produtoId); return; }
    setCart((prev) => prev.map((item) => item.produtoId === produtoId ? { ...item, quantidade } : item));
  };

  const totalCart = cart.reduce((acc, item) => acc + item.preco * item.quantidade, 0);

  const filteredProdutos = produtos.filter((p) => {
    const matchCategoria = !categoriaAtiva || p.categoriaId === categoriaAtiva;
    const matchBusca = !busca || p.nome.toLowerCase().includes(busca.toLowerCase()) || p.descricao?.toLowerCase().includes(busca.toLowerCase());
    return p.ativo && matchCategoria && matchBusca;
  });

  if (loading) return <Loading />;
  if (!vendedor) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-600">Loja nao encontrada</h2>
        <p className="text-gray-400">O catalogo que voce procura nao existe</p>
      </div>
    </div>
  );

  const corPrimaria = vendedor.corPrimaria || '#2563eb';
  const temaEscuro = clienteModoEscuro !== null ? clienteModoEscuro : vendedor.modoEscuro;

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-950 ${temaEscuro ? 'dark' : ''}`}>
      <style>{`
        .catalog-bg-primary { background-color: ${corPrimaria} !important; }
        .catalog-text-primary { color: ${corPrimaria} !important; }
      `}</style>

      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {vendedor.logoUrl ? (
              <img src={vendedor.logoUrl} alt="" className="h-10 w-10 rounded-xl object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-sm font-bold catalog-bg-primary">
                {vendedor.nomeLoja?.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="font-bold text-sm text-gray-900 dark:text-gray-100">{vendedor.nomeLoja}</h1>
              <p className="text-xs text-gray-500">Cardapio Digital</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setClienteModoEscuro(!temaEscuro)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title={temaEscuro ? 'Modo Claro' : 'Modo Escuro'}>
              {temaEscuro ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-gray-600" />}
            </button>
            <button onClick={() => setShowCart(true)} className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ShoppingCart size={20} className="text-gray-700 dark:text-gray-300" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 catalog-bg-primary text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {cart.reduce((a, i) => a + i.quantidade, 0)}
                </span>
              )}
            </button>
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {showMenu ? <X size={20} /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            className="fixed inset-y-0 right-0 w-72 z-50 bg-white dark:bg-gray-900 shadow-xl"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b dark:border-gray-700">
                {vendedor.logoUrl && <img src={vendedor.logoUrl} className="h-12 w-12 rounded-xl" />}
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">{vendedor.nomeLoja}</h3>
                </div>
              </div>
              {vendedor.whatsappNumero && (
                <a href={`https://wa.me/${vendedor.whatsappNumero.replace(/\D/g, '')}`} target="_blank"
                  className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-700 dark:text-green-400">
                  <MessageSquare size={18} /> Fale conosco
                </a>
              )}
              {vendedor.endereco && (
                <div className="flex items-start gap-3 text-sm text-gray-500"><MapPin size={16} className="mt-0.5" /><span>{vendedor.endereco}</span></div>
              )}
              {vendedor.horarioFuncionamento && (
                <div className="flex items-start gap-3 text-sm text-gray-500"><Clock size={16} className="mt-0.5" /><span>{JSON.stringify(vendedor.horarioFuncionamento)}</span></div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            className="fixed inset-y-0 right-0 w-full max-w-md z-50 bg-white dark:bg-gray-900 shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {checkoutMode ? 'Finalizar Pedido' : `Carrinho (${cart.reduce((a, i) => a + i.quantidade, 0)})`}
              </h2>
              <button onClick={() => { setShowCart(false); setCheckoutMode(false); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2" />
                  <p>Carrinho vazio</p>
                </div>
              ) : checkoutMode ? (
                <CheckoutPanel
                  cartItems={cart}
                  total={totalCart}
                  vendedor={vendedor}
                  corPrimaria={corPrimaria}
                  onSuccess={() => { setCart([]); setShowCart(false); setCheckoutMode(false); }}
                />
              ) : (
                cart.map((item) => (
                  <CartItemRow key={item.produtoId} item={item} onUpdateQuantity={updateQuantity} onRemove={removeFromCart} />
                ))
              )}
            </div>

            {cart.length > 0 && !checkoutMode && (
              <div className="p-4 border-t dark:border-gray-700 space-y-3">
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-gray-100">
                  <span>Total</span>
                  <span>R$ {totalCart.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => setCheckoutMode(true)}
                  className="w-full py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90"
                  style={{ backgroundColor: corPrimaria }}
                >
                  Continuar
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <CatalogBanner banners={vendedor.bannerUrl ? [{ id: 'vendedor-banner', imagemUrl: vendedor.bannerUrl }, ...banners] : banners} corPrimaria={corPrimaria} />

        <SearchBar value={busca} onChange={setBusca} />

        <CategoryFilter
          categorias={categorias}
          selected={categoriaAtiva}
          onSelect={setCategoriaAtiva}
          corPrimaria={corPrimaria}
        />

        {filteredProdutos.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package className="h-12 w-12 mx-auto mb-2" />
            <p>Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProdutos.map((produto, i) => (
              <motion.div
                key={produto.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <ProductCard
                  produto={produto}
                  slug={slug as string}
                  corPrimaria={corPrimaria}
                  onAddToCart={addToCart}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {cart.length > 0 && !showCart && (
        <motion.button
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-6 py-3 rounded-full text-white shadow-lg shadow-black/20"
          style={{ backgroundColor: corPrimaria }}
        >
          <ShoppingCart size={20} />
          <span className="font-medium">Ver Carrinho</span>
          <span className="bg-white/20 rounded-full px-2 py-0.5 text-sm font-bold">
            R$ {totalCart.toFixed(2)}
          </span>
        </motion.button>
      )}
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700 dark:text-gray-300">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
