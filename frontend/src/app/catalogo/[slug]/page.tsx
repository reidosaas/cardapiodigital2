'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Package, Store, Phone, MapPin, Clock, ChevronRight, Search, MapPinned, Info, Download, Minus, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Loading } from '@/components/shared/loading';
import { CheckoutPanel } from '@/components/catalog/checkout-panel';
import { CatalogoFooter } from '@/components/catalog/catalogo-footer';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function CatalogoPublico() {
  const { slug } = useParams() as { slug: string };
  const [vendedor, setVendedor] = useState<any>(null);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [categoriasGlobais, setCategoriasGlobais] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(true);
  const catScrollRef = useRef<HTMLDivElement>(null);
  const { canInstall, isInstalled, install } = usePWAInstall();

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, string[]>>({});
  const [productQty, setProductQty] = useState(1);

  const sectionRefs = useRef<Record<string, HTMLElement>>({});

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
    const savedTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const loadData = async () => {
      try {
        const vRes = await api.get(`/api/vendedores/slug/${slug}`);
        setVendedor(vRes.data);
        if (vRes.data.modoEscuro) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        const [prodRes, catRes, banRes, globalCatRes] = await Promise.all([
          api.get(`/api/produtos/vendedor/${vRes.data.id}`),
          api.get(`/api/categorias/vendedor/${vRes.data.id}`),
          api.get(`/api/banners/vendedor/${vRes.data.id}`),
          api.get(`/api/categorias-globais`),
        ]);
        setProdutos(prodRes.data);
        setCategorias(catRes.data);
        setBanners(banRes.data);
        setCategoriasGlobais(globalCatRes.data);
      } catch {
        toast.error('Erro ao carregar catalogo');
      } finally {
        setLoading(false);
      }
    };
    loadData();
    return () => {
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
  }, [slug]);

  useEffect(() => {
    if (produtos.length === 0 || categorias.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const catId = entry.target.getAttribute('data-cat-id');
            if (catId) setActiveSection(catId);
          }
        }
      },
      { rootMargin: '-120px 0px -60% 0px', threshold: 0 }
    );

    const allCats = categorias.length > 0 ? categorias : categoriasGlobais;
    allCats.forEach((cat) => {
      const el = sectionRefs.current[cat.id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [produtos, categorias, categoriasGlobais]);

  const scrollToCategory = (catId: string | null) => {
    if (!catId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = sectionRefs.current[catId];
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const addToCart = (produto: any, addons: Record<string, string[]> = {}, qty: number = 1) => {
    const addonTotal = calculateAddonTotal(produto, addons);
    const precoBase = Number(produto.precoPromocional || produto.preco);
    setCart((prev) => {
      return [...prev, {
        produtoId: produto.id,
        nome: produto.nome,
        preco: precoBase,
        precoTotal: precoBase + addonTotal,
        quantidade: qty,
        imagem: Array.isArray(produto.imagens) ? produto.imagens[0] : undefined,
        adicionais: addons,
        adicionaisPreco: addonTotal,
      }];
    });
    toast.success(`${produto.nome} adicionado ao carrinho`);
  };

  const updateQuantity = (index: number, quantidade: number) => {
    if (quantidade <= 0) {
      setCart((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    setCart((prev) => prev.map((item, i) => i === index ? { ...item, quantidade } : item));
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const totalCart = cart.reduce((acc, item) => acc + (item.precoTotal || item.preco) * item.quantidade, 0);
  const totalItens = cart.reduce((a, i) => a + i.quantidade, 0);

  const filteredProdutos = produtos.filter((p) => {
    const matchBusca = !busca || p.nome.toLowerCase().includes(busca.toLowerCase()) || p.descricao?.toLowerCase().includes(busca.toLowerCase());
    return p.ativo && matchBusca;
  });

  const allCategorias = categorias.length > 0 ? categorias : categoriasGlobais;

  const produtosPorCategoria = allCategorias
    .map((cat) => ({
      ...cat,
      produtos: filteredProdutos.filter((p) => p.categoriaId === cat.id || p.categoriaGlobalId === cat.id),
    }))
    .filter((cat) => cat.produtos.length > 0);

  const produtosSemCategoria = filteredProdutos.filter((p) => !p.categoriaId && !p.categoriaGlobalId);

  const calculateAddonTotal = (produto: any, addons: Record<string, string[]>) => {
    if (!produto?.gruposAdicionais) return 0;
    let total = 0;
    for (const group of produto.gruposAdicionais) {
      const selected = addons[group.id] || [];
      for (const optId of selected) {
        const opt = group.opcoes?.find((o: any) => o.id === optId);
        if (opt) total += Number(opt.preco);
      }
    }
    return total;
  };

  const openProductModal = (produto: any) => {
    setSelectedProduct(produto);
    setSelectedAddons({});
    setProductQty(1);
  };

  const handleAddFromModal = () => {
    if (!selectedProduct) return;
    if (selectedProduct.gruposAdicionais?.length > 0) {
      for (const group of selectedProduct.gruposAdicionais) {
        if (group.obrigatorio && (!selectedAddons[group.id] || selectedAddons[group.id].length === 0)) {
          toast.error(`Selecione pelo menos 1 opcao em "${group.nome}"`);
          return;
        }
      }
    }
    addToCart(selectedProduct, selectedAddons, productQty);
    setSelectedProduct(null);
  };

  const toggleAddon = (groupId: string, optionId: string, maxEscolhas: number) => {
    setSelectedAddons((prev) => {
      const current = prev[groupId] || [];
      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      }
      if (maxEscolhas === 1) {
        return { ...prev, [groupId]: [optionId] };
      }
      if (current.length >= maxEscolhas) {
        toast.error(`Maximo de ${maxEscolhas} opcoes`);
        return prev;
      }
      return { ...prev, [groupId]: [...current, optionId] };
    });
  };

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

  const parseHorario = (h: any): { abre: string; fecha: string } | null => {
    if (!h) return null;
    if (typeof h === 'string') { try { return JSON.parse(h); } catch { return null; } }
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
    return mins >= (ah * 60 + am) && mins < (fh * 60 + fm);
  })();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-20">
      {/* Search bar */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar no cardapio"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 text-sm"
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
        {bannerUrl ? (
          <div className="w-full h-48 sm:h-56 md:h-64 overflow-hidden">
            <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-48 sm:h-56 md:h-64 bg-gradient-to-br from-red-400 to-red-600" />
        )}
        {logoUrl && (
          <div className="absolute -bottom-8 left-4 sm:left-8">
            <img src={logoUrl} alt={vendedor.nomeLoja} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white object-cover shadow-lg" />
          </div>
        )}
      </div>

      {/* Store info */}
      <div className="max-w-3xl mx-auto px-4 pt-12 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 uppercase">{vendedor.nomeLoja}</h1>
            {vendedor.endereco && <p className="text-sm text-gray-500 mt-1">{vendedor.endereco}</p>}
            <button onClick={() => setShowInfo(!showInfo)} className="flex items-center gap-1 text-sm text-gray-600 mt-2 hover:text-gray-900">
              <Info size={14} /><span>Mais informacoes</span>
            </button>
          </div>
          <div className="text-right">
            <span className="inline-block text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700">Entrega e Retirada</span>
          </div>
        </div>
        {lojaAberta !== null && (
          <div className="mt-3 flex items-center gap-3">
            {lojaAberta ? (
              <p className="text-sm font-medium text-green-600">Loja Aberta no momento</p>
            ) : (
              <p className="text-sm font-medium text-red-600">Loja Fechada no momento{horario ? `, abre as ${horario.abre}` : ''}</p>
            )}
          </div>
        )}
        <AnimatePresence>
          {showInfo && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-3 p-4 bg-gray-50 rounded-xl space-y-2 text-sm text-gray-600">
                {vendedor.endereco && <div className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0" /><span>{vendedor.endereco}</span></div>}
                {vendedor.whatsappNumero && <div className="flex items-center gap-2"><Phone size={14} className="shrink-0" /><span>{vendedor.whatsappNumero}</span></div>}
                {horario && <div className="flex items-start gap-2"><Clock size={14} className="mt-0.5 shrink-0" /><span>Horario: {horario.abre} as {horario.fecha}</span></div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button className="w-full mt-4 flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <div className="flex items-center gap-3">
            <MapPinned size={20} className="text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Calcular taxa de entrega</span>
          </div>
          <ChevronRight size={18} className="text-gray-400" />
        </button>
      </div>

      {/* Category tabs - scroll to section */}
      <div className="sticky top-[60px] z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center gap-1">
            <div className="relative">
              <button onClick={() => setShowCatDropdown(!showCatDropdown)} className="p-2.5 text-gray-600 hover:text-gray-900">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
              <AnimatePresence>
                {showCatDropdown && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 py-2 max-h-72 overflow-y-auto">
                    <button onClick={() => { scrollToCategory(null); setShowCatDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!activeSection ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-gray-700 dark:text-gray-300'}`}>
                      Todos
                    </button>
                    {allCategorias.map((cat) => (
                      <button key={cat.id} onClick={() => { scrollToCategory(cat.id); setShowCatDropdown(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors uppercase ${activeSection === cat.id ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-gray-700 dark:text-gray-300'}`}>
                        {cat.icone ? `${cat.icone} ` : ''}{cat.nome}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div ref={catScrollRef} className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide py-1">
              <button onClick={() => scrollToCategory(null)}
                className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${!activeSection ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                Todos
              </button>
              {allCategorias.map((cat) => (
                <button key={cat.id} onClick={() => scrollToCategory(cat.id)}
                  className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors uppercase ${activeSection === cat.id ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  {cat.icone ? `${cat.icone} ` : ''}{cat.nome}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Products list - sections by category */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        {filteredProdutos.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package className="h-12 w-12 mx-auto mb-3" />
            <p className="text-sm">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="space-y-6">
            {produtosPorCategoria.map((cat) => (
              <div key={cat.id} ref={(el) => { if (el) sectionRefs.current[cat.id] = el; }} data-cat-id={cat.id}>
                <h2 className="text-lg font-bold text-gray-900 uppercase mb-3">{cat.icone ? `${cat.icone} ` : ''}{cat.nome}</h2>
                <div className="space-y-3">
                  {cat.produtos.map((produto: any, i: number) => (
                    <ProductRow key={produto.id} produto={produto} index={i} onOpenModal={openProductModal} />
                  ))}
                </div>
              </div>
            ))}
            {produtosSemCategoria.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 uppercase mb-3">Outros</h2>
                <div className="space-y-3">
                  {produtosSemCategoria.map((produto: any, i: number) => (
                    <ProductRow key={produto.id} produto={produto} index={i} onOpenModal={openProductModal} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedProduct(null)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="relative bg-white dark:bg-gray-900 w-full max-w-lg max-h-[90vh] rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl z-[61]">
              {/* Close button */}
              <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 dark:bg-gray-800/80 flex items-center justify-center shadow">
                <X size={18} className="text-gray-600" />
              </button>

              {/* Image */}
              {(() => {
                const imgs = Array.isArray(selectedProduct.imagens) ? selectedProduct.imagens : [];
                return imgs.length > 0 ? (
                  <div className="w-full h-56 sm:h-64 overflow-hidden rounded-t-3xl sm:rounded-t-3xl">
                    <img src={imgs[0]} alt={selectedProduct.nome} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-40 bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-t-3xl">
                    <Package size={48} className="text-gray-300" />
                  </div>
                );
              })()}

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 uppercase">{selectedProduct.nome}</h2>
                  {selectedProduct.descricao && <p className="text-sm text-gray-500 mt-1">{selectedProduct.descricao}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xl font-bold text-green-600">R$ {Number(selectedProduct.precoPromocional || selectedProduct.preco).toFixed(2)}</span>
                    {selectedProduct.precoPromocional && (
                      <span className="text-sm text-gray-400 line-through">R$ {Number(selectedProduct.preco).toFixed(2)}</span>
                    )}
                  </div>
                </div>

                {/* Addon Groups */}
                {selectedProduct.gruposAdicionais?.map((group: any) => (
                  <div key={group.id} className="border-t border-gray-100 dark:border-gray-800 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase">{group.nome}</h3>
                      <span className="text-xs text-gray-400">
                        {group.obrigatorio ? 'Obrigatorio' : 'Opcional'}
                        {group.maxEscolhas > 1 ? ` (ate ${group.maxEscolhas})` : ''}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.opcoes?.map((opt: any) => {
                        const isSelected = (selectedAddons[group.id] || []).includes(opt.id);
                        return (
                          <button key={opt.id} onClick={() => toggleAddon(group.id, opt.id, group.maxEscolhas)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${isSelected ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                            <div className="flex-1 text-left">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{opt.nome}</p>
                              <p className={`text-xs font-medium mt-0.5 ${Number(opt.preco) > 0 ? 'text-gray-600' : 'text-green-600'}`}>
                                {Number(opt.preco) > 0 ? `+ R$ ${Number(opt.preco).toFixed(2)}` : 'Gratis'}
                              </p>
                            </div>
                            {opt.imagemUrl && (
                              <img src={opt.imagemUrl} alt={opt.nome} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                            )}
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-red-500 bg-red-500' : 'border-gray-300'}`}>
                              {isSelected && <Check size={12} className="text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer: qty + add button */}
              <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4">
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-2 py-1">
                  <button onClick={() => setProductQty(Math.max(1, productQty - 1))} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700">
                    <Minus size={16} />
                  </button>
                  <span className="w-6 text-center font-bold text-gray-900 dark:text-gray-100">{productQty}</span>
                  <button onClick={() => setProductQty(productQty + 1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700">
                    <Plus size={16} />
                  </button>
                </div>
                <button onClick={handleAddFromModal}
                  className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors flex items-center justify-between px-4">
                  <span>Adicionar</span>
                  <span>R$ {((Number(selectedProduct.precoPromocional || selectedProduct.preco) + calculateAddonTotal(selectedProduct, selectedAddons)) * productQty).toFixed(2)}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install PWA Banner */}
      {canInstall && !isInstalled && (
        <div className="fixed bottom-16 left-0 right-0 z-40 px-4">
          <div className="max-w-3xl mx-auto bg-gray-900 dark:bg-gray-800 text-white rounded-xl p-3 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <Download size={18} />
              <span className="text-sm font-medium">Instalar app</span>
            </div>
            <button onClick={install} className="px-3 py-1.5 bg-white text-gray-900 rounded-lg text-xs font-semibold">Instalar</button>
          </div>
        </div>
      )}

      {/* Footer */}
      <CatalogoFooter slug={slug as string} vendedorId={vendedor?.id} vendedor={vendedor} categorias={categorias} categoriasGlobais={categoriasGlobais} />

      {/* Cart floating button */}
      {cart.length > 0 && !showCart && (
        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }}
          onClick={() => setShowCart(true)}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-6 py-3 rounded-full text-white shadow-lg shadow-black/20"
          style={{ backgroundColor: vendedor.corPrimaria || '#ef4444' }}>
          <ShoppingCart size={20} />
          <span className="font-medium">Ver Carrinho</span>
          <span className="bg-white/20 rounded-full px-2 py-0.5 text-sm font-bold">R$ {totalCart.toFixed(2)}</span>
        </motion.button>
      )}

      {/* Cart drawer */}
      <AnimatePresence>
        {showCart && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            className="fixed inset-y-0 right-0 w-full max-w-md z-50 bg-white dark:bg-gray-900 shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-lg">{showCheckout ? 'Finalizar Pedido' : `Carrinho (${totalItens})`}</h2>
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
                <CheckoutPanel cartItems={cart} total={totalCart} vendedor={vendedor} corPrimaria={vendedor.corPrimaria || '#ef4444'}
                  onSuccess={() => { setCart([]); setShowCart(false); setShowCheckout(false); }} />
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    {item.imagem && <img src={item.imagem} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{item.nome}</p>
                      {item.adicionais && Object.keys(item.adicionais).length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">+ {Object.values(item.adicionais).flat().length} adicionais</p>
                      )}
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-1">R$ {((item.precoTotal || item.preco) * item.quantidade).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => updateQuantity(idx, item.quantidade - 1)} className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 font-bold text-sm">-</button>
                      <span className="text-sm font-medium w-5 text-center text-gray-900 dark:text-gray-100">{item.quantidade}</span>
                      <button onClick={() => updateQuantity(idx, item.quantidade + 1)} className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 font-bold text-sm">+</button>
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
                  onClick={() => {
                    const token = typeof window !== 'undefined' ? localStorage.getItem('token_cliente') : null;
                    if (!token) { toast.info('Faca login para continuar'); return; }
                    setShowCheckout(true);
                  }}
                  className="w-full py-3 rounded-xl text-white font-semibold" style={{ backgroundColor: vendedor.corPrimaria || '#ef4444' }}>
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

function ProductRow({ produto, index, onOpenModal }: { produto: any; index: number; onOpenModal: (p: any) => void }) {
  const imagens = Array.isArray(produto.imagens) ? produto.imagens : [];
  const semEstoque = !produto.ilimitado && produto.estoque !== undefined && produto.estoque <= 0;
  const precoFinal = Number(produto.precoPromocional || produto.preco);
  const temPromocao = !!produto.precoPromocional;
  const hasAddons = produto.gruposAdicionais && produto.gruposAdicionais.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => { if (!semEstoque) onOpenModal(produto); }}
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 uppercase text-sm leading-tight">{produto.nome}</h3>
        {produto.descricao && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{produto.descricao}</p>}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-base font-bold text-green-600">R$ {precoFinal.toFixed(2)}</span>
          {temPromocao && <span className="text-sm text-gray-400 line-through">R$ {Number(produto.preco).toFixed(2)}</span>}
        </div>
        {hasAddons && <span className="text-xs text-gray-400 mt-1 block">Personalize ao adicionar</span>}
        {semEstoque && <span className="inline-block mt-2 text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded">Indisponivel</span>}
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <div className="block w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
          {imagens[0] ? (
            <img src={imagens[0]} alt={produto.nome} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={28} /></div>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); if (!semEstoque) onOpenModal(produto); }}
          disabled={semEstoque}
          className="w-24 sm:w-28 py-2 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#ef4444' }}>
          {hasAddons ? 'Escolher' : 'Adicionar'}
        </button>
      </div>
    </motion.div>
  );
}
