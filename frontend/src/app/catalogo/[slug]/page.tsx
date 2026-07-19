'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Package, Store, Phone, MapPin, Clock, ChevronRight, Search, Home, ClipboardList, User, MapPinned, Info } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Loading } from '@/components/shared/loading';
import { CheckoutPanel } from '@/components/catalog/checkout-panel';

export default function CatalogoPublico() {
  const { slug } = useParams();
  const [vendedor, setVendedor] = useState<any>(null);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(true);
  const catScrollRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'pedidos' | 'perfil'>('home');

  useEffect(() => {
    document.querySelectorAll('link[rel="manifest"]').forEach((el) => el.parentElement?.removeChild(el));
    const linkEl = document.createElement('link');
    linkEl.id = 'dynamic-manifest';
    linkEl.rel = 'manifest';
    linkEl.href = `/pwa/manifest/${slug}`;
    document.head.appendChild(linkEl);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/pwa/sw/catalogo', { scope: '/catalogo/' }).catch(() => {});
    }
  }, [slug]);

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

  const updateQuantity = (produtoId: string, quantidade: number) => {
    if (quantidade <= 0) {
      setCart((prev) => prev.filter((item) => item.produtoId !== produtoId));
      return;
    }
    setCart((prev) => prev.map((item) => item.produtoId === produtoId ? { ...item, quantidade } : item));
  };

  const removeFromCart = (produtoId: string) => {
    setCart((prev) => prev.filter((item) => item.produtoId !== produtoId));
  };

  const totalCart = cart.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
  const totalItens = cart.reduce((a, i) => a + i.quantidade, 0);

  const filteredProdutos = produtos.filter((p) => {
    const matchCategoria = !categoriaAtiva || p.categoriaId === categoriaAtiva;
    const matchBusca = !busca || p.nome.toLowerCase().includes(busca.toLowerCase()) || p.descricao?.toLowerCase().includes(busca.toLowerCase());
    return p.ativo && matchCategoria && matchBusca;
  });

  const produtosPorCategoria = categorias
    .map((cat) => ({
      ...cat,
      produtos: filteredProdutos.filter((p) => p.categoriaId === cat.id),
    }))
    .filter((cat) => cat.produtos.length > 0);

  const produtosSemCategoria = filteredProdutos.filter((p) => !p.categoriaId);
  const showSemCategoria = categoriaAtiva === null && produtosSemCategoria.length > 0;

  if (loading) return <Loading />;
  if (!vendedor) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-600">Loja nao encontrada</h2>
        <p className="text-gray-400">O catalogo que voce procura nao existe</p>
      </div>
    </div>
  );

  const logoUrl = vendedor.logoUrl;
  const bannerUrl = vendedor.bannerUrl || (banners.length > 0 ? banners[0].imagemUrl : null);
  const temHorario = vendedor.horarioFuncionamento;

  const parseHorario = (h: any): { abre: string; fecha: string } | null => {
    if (!h) return null;
    if (typeof h === 'string') {
      try { return JSON.parse(h); } catch { return null; }
    }
    if (h.abre && h.fecha) return h;
    return null;
  };

  const horario = parseHorario(vendedor.horarioFuncionamento);

  const lojaAberta = (() => {
    if (!horario) return null;
    const now = new Date();
    const [ah, am] = horario.abre.split(':').map(Number);
    const [fh, fm] = horario.fecha.split(':').map(Number);
    const mins = now.getHours() * 60 + now.getMinutes();
    const abre = ah * 60 + am;
    const fecha = fh * 60 + fm;
    return mins >= abre && mins < fecha;
  })();

  const formatHorario = (h: { abre: string; fecha: string }) => {
    return `${h.abre} as ${h.fecha}`;
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Search bar - sticky top */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar no cardapio"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 border-0 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm"
            />
            {busca && (
              <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Banner + Logo + Store Info */}
      <div className="relative">
        {/* Banner */}
        {bannerUrl ? (
          <div className="w-full h-48 sm:h-56 md:h-64 overflow-hidden">
            <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-48 sm:h-56 md:h-64 bg-gradient-to-br from-orange-400 to-orange-600" />
        )}

        {/* Logo overlapping banner */}
        {logoUrl && (
          <div className="absolute -bottom-8 left-4 sm:left-8">
            <img
              src={logoUrl}
              alt={vendedor.nomeLoja}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white object-cover shadow-lg"
            />
          </div>
        )}
      </div>

      {/* Store info */}
      <div className="max-w-3xl mx-auto px-4 pt-12 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 uppercase">{vendedor.nomeLoja}</h1>
            {vendedor.endereco && (
              <p className="text-sm text-gray-500 mt-1">{vendedor.endereco}</p>
            )}
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="flex items-center gap-1 text-sm text-gray-600 mt-2 hover:text-gray-900"
            >
              <Info size={14} />
              <span>Mais informacoes</span>
            </button>
          </div>
          <div className="text-right">
            <span className="inline-block text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700">
              Entrega e Retirada
            </span>
          </div>
        </div>

        {/* Store status */}
        {lojaAberta !== null && (
          <div className="mt-3 flex items-center gap-3">
            {lojaAberta ? (
              <p className="text-sm font-medium text-green-600">Loja Aberta no momento</p>
            ) : (
              <p className="text-sm font-medium text-red-600">Loja Fechada no momento{horario ? `, abre as ${horario.abre}` : ''}</p>
            )}
          </div>
        )}

        {/* Info dropdown */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 p-4 bg-gray-50 rounded-xl space-y-2 text-sm text-gray-600">
                {vendedor.endereco && (
                  <div className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0" /><span>{vendedor.endereco}</span></div>
                )}
                {vendedor.whatsappNumero && (
                  <div className="flex items-center gap-2"><Phone size={14} className="shrink-0" /><span>{vendedor.whatsappNumero}</span></div>
                )}
                {horario && (
                  <div className="flex items-start gap-2"><Clock size={14} className="mt-0.5 shrink-0" /><span>Horario: {formatHorario(horario)}</span></div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Calcular taxa de entrega */}
        <button className="w-full mt-4 flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <div className="flex items-center gap-3">
            <MapPinned size={20} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Calcular taxa de entrega</span>
          </div>
          <ChevronRight size={18} className="text-gray-400" />
        </button>
      </div>

      {/* Category tabs */}
      <div className="sticky top-[60px] z-30 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center gap-1">
            {/* Hamburger for all categories */}
            <div className="relative">
              <button
                onClick={() => setShowCatDropdown(!showCatDropdown)}
                className="p-2.5 text-gray-600 hover:text-gray-900"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
              <AnimatePresence>
                {showCatDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-2 max-h-72 overflow-y-auto"
                  >
                    <button
                      onClick={() => { setCategoriaAtiva(null); setShowCatDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors ${!categoriaAtiva ? 'text-orange-600 bg-orange-50' : 'text-gray-700'}`}
                    >
                      Todos
                    </button>
                    {categorias.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => { setCategoriaAtiva(cat.id); setShowCatDropdown(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors uppercase ${categoriaAtiva === cat.id ? 'text-orange-600 bg-orange-50' : 'text-gray-700'}`}
                      >
                        {cat.nome}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Scrollable tabs */}
            <div ref={catScrollRef} className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide py-1">
              <button
                onClick={() => setCategoriaAtiva(null)}
                className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  !categoriaAtiva
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Todos
              </button>
              {categorias.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaAtiva(cat.id)}
                  className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors uppercase ${
                    categoriaAtiva === cat.id
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {cat.nome}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Products list */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        {filteredProdutos.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package className="h-12 w-12 mx-auto mb-3" />
            <p className="text-sm">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Products by category */}
            {produtosPorCategoria.map((cat) => (
              <div key={cat.id}>
                <h2 className="text-lg font-bold text-gray-900 uppercase mb-3">{cat.nome}</h2>
                <div className="space-y-3">
                  {cat.produtos.map((produto: any, i: number) => (
                    <ProductRow key={produto.id} produto={produto} slug={slug as string} onAddToCart={addToCart} index={i} />
                  ))}
                </div>
              </div>
            ))}

            {/* Products without category */}
            {showSemCategoria && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 uppercase mb-3">Outros</h2>
                <div className="space-y-3">
                  {produtosSemCategoria.map((produto: any, i: number) => (
                    <ProductRow key={produto.id} produto={produto} slug={slug as string} onAddToCart={addToCart} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="max-w-3xl mx-auto flex items-center justify-around h-16">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-0.5 px-4 py-1.5 ${activeTab === 'home' ? 'text-orange-500' : 'text-gray-400'}`}>
            <Home size={22} />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button onClick={() => setActiveTab('pedidos')} className={`flex flex-col items-center gap-0.5 px-4 py-1.5 ${activeTab === 'pedidos' ? 'text-orange-500' : 'text-gray-400'}`}>
            <ClipboardList size={22} />
            <span className="text-[10px] font-medium">Pedidos</span>
          </button>
          <button onClick={() => setActiveTab('perfil')} className={`flex flex-col items-center gap-0.5 px-4 py-1.5 ${activeTab === 'perfil' ? 'text-orange-500' : 'text-gray-400'}`}>
            <User size={22} />
            <span className="text-[10px] font-medium">Perfil</span>
          </button>
        </div>
      </div>

      {/* Cart floating button */}
      {cart.length > 0 && !showCart && (
        <motion.button
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          onClick={() => setShowCart(true)}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-6 py-3 rounded-full text-white shadow-lg shadow-black/20"
          style={{ backgroundColor: vendedor.corPrimaria || '#f97316' }}
        >
          <ShoppingCart size={20} />
          <span className="font-medium">Ver Carrinho</span>
          <span className="bg-white/20 rounded-full px-2 py-0.5 text-sm font-bold">
            R$ {totalCart.toFixed(2)}
          </span>
        </motion.button>
      )}

      {/* Cart drawer */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            className="fixed inset-y-0 right-0 w-full max-w-md z-50 bg-white shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-lg">
                {showCheckout ? 'Finalizar Pedido' : `Carrinho (${totalItens})`}
              </h2>
              <button onClick={() => { setShowCart(false); setShowCheckout(false); }} className="p-2 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2" />
                  <p>Carrinho vazio</p>
                </div>
              ) : showCheckout ? (
                <CheckoutPanel
                  cartItems={cart}
                  total={totalCart}
                  vendedor={vendedor}
                  corPrimaria={vendedor.corPrimaria || '#f97316'}
                  onSuccess={() => { setCart([]); setShowCart(false); setShowCheckout(false); }}
                />
              ) : (
                cart.map((item) => (
                  <div key={item.produtoId} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
                    {item.imagem && <img src={item.imagem} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{item.nome}</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">R$ {(item.preco * item.quantidade).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => updateQuantity(item.produtoId, item.quantidade - 1)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">-</button>
                      <span className="text-sm font-medium w-5 text-center">{item.quantidade}</span>
                      <button onClick={() => updateQuantity(item.produtoId, item.quantidade + 1)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">+</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && !showCheckout && (
              <div className="p-4 border-t space-y-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>R$ {totalCart.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => setShowCheckout(true)}
                  className="w-full py-3 rounded-xl text-white font-semibold"
                  style={{ backgroundColor: vendedor.corPrimaria || '#f97316' }}
                >
                  Continuar
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductRow({ produto, slug, onAddToCart, index }: { produto: any; slug: string; onAddToCart: (p: any) => void; index: number }) {
  const imagens = Array.isArray(produto.imagens) ? produto.imagens : [];
  const semEstoque = !produto.ilimitado && produto.estoque !== undefined && produto.estoque <= 0;
  const precoFinal = Number(produto.precoPromocional || produto.preco);
  const temPromocao = !!produto.precoPromocional;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
    >
      <a href={`/catalogo/${slug}/produto/${produto.id}`} className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-900 uppercase text-sm leading-tight">{produto.nome}</h3>
        {produto.descricao && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{produto.descricao}</p>
        )}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-base font-bold text-green-600">R$ {precoFinal.toFixed(2)}</span>
          {temPromocao && (
            <span className="text-sm text-gray-400 line-through">R$ {Number(produto.preco).toFixed(2)}</span>
          )}
        </div>
        {semEstoque && (
          <span className="inline-block mt-2 text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded">Indisponivel</span>
        )}
      </a>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <a href={`/catalogo/${slug}/produto/${produto.id}`} className="block w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-gray-100">
          {imagens[0] ? (
            <img src={imagens[0]} alt={produto.nome} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Package size={28} />
            </div>
          )}
        </a>
        <button
          onClick={(e) => { e.preventDefault(); if (!semEstoque) onAddToCart(produto); }}
          disabled={semEstoque}
          className="w-24 sm:w-28 py-2 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#f97316' }}
        >
          Adicionar
        </button>
      </div>
    </motion.div>
  );
}
