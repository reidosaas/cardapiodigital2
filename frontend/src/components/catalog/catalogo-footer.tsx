'use client';
import { useState, useEffect, useCallback } from 'react';
import { Home, ClipboardList, User, X, Package, Clock, Store, LogOut, ChevronRight, MapPin, Phone, ShoppingBag } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface CatalogoFooterProps {
  slug: string;
  vendedorId?: string;
  vendedor?: any;
  categorias?: any[];
  categoriasGlobais?: any[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  PREPARANDO: 'Preparando',
  SAIU_ENTREGA: 'Saiu para entrega',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-700',
  CONFIRMADO: 'bg-blue-100 text-blue-700',
  PREPARANDO: 'bg-orange-100 text-orange-700',
  SAIU_ENTREGA: 'bg-purple-100 text-purple-700',
  ENTREGUE: 'bg-green-100 text-green-700',
  CANCELADO: 'bg-red-100 text-red-700',
};

export function CatalogoFooter({ slug, vendedorId, vendedor, categorias = [], categoriasGlobais = [] }: CatalogoFooterProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'pedidos' | 'perfil'>('home');
  const [showPedidosModal, setShowPedidosModal] = useState(false);
  const [showPerfilModal, setShowPerfilModal] = useState(false);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [pedidosLoading, setPedidosLoading] = useState(false);
  const [perfilData, setPerfilData] = useState<any>(null);
  const [isLogged, setIsLogged] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [loginMode, setLoginMode] = useState<'login' | 'cadastro'>('login');
  const [loginForm, setLoginForm] = useState({ email: '', senha: '' });
  const [cadastroForm, setCadastroForm] = useState({ nome: '', email: '', telefone: '', senha: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [showSenha, setShowSenha] = useState(false);

  const [pendingAction, setPendingAction] = useState<'pedidos' | 'perfil' | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token_cliente');
    setIsLogged(!!token);
  }, []);

  const handleHome = () => {
    setActiveTab('home');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const fetchPedidos = useCallback(async () => {
    const token = localStorage.getItem('token_cliente');
    if (!token) return;
    setPedidosLoading(true);
    try {
      const res = await api.get('/api/cliente-global/pedidos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPedidos(res.data);
    } catch {
      toast.error('Erro ao carregar pedidos');
    } finally {
      setPedidosLoading(false);
    }
  }, []);

  const fetchPerfil = useCallback(async () => {
    const token = localStorage.getItem('token_cliente');
    if (!token) return;
    try {
      const res = await api.get('/api/cliente-global/perfil', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPerfilData(res.data);
    } catch {
      // silent
    }
  }, []);

  const handlePedidos = () => {
    setActiveTab('pedidos');
    if (!isLogged) {
      setPendingAction('pedidos');
      setShowAuthModal(true);
      return;
    }
    setShowPedidosModal(true);
    fetchPedidos();
  };

  const handlePerfil = () => {
    setActiveTab('perfil');
    if (!isLogged) {
      setPendingAction('perfil');
      setShowAuthModal(true);
      return;
    }
    setShowPerfilModal(true);
    fetchPerfil();
  };

  const handleLogout = () => {
    localStorage.removeItem('token_cliente');
    localStorage.removeItem('cliente');
    setIsLogged(false);
    setPerfilData(null);
    setShowPerfilModal(false);
    toast.success('Deslogado com sucesso');
  };

  const handleAuthSuccess = () => {
    setIsLogged(true);
    setShowAuthModal(false);
    const action = pendingAction;
    setPendingAction(null);
    if (action === 'pedidos') {
      setShowPedidosModal(true);
      fetchPedidos();
    } else if (action === 'perfil') {
      setShowPerfilModal(true);
      fetchPerfil();
    }
  };

  const handleAuthLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const res = await api.post('/api/cliente-global/login', loginForm);
      localStorage.setItem('token_cliente', res.data.accessToken);
      localStorage.setItem('cliente', JSON.stringify(res.data.cliente));
      setLoginForm({ email: '', senha: '' });
      toast.success('Login realizado com sucesso');
      handleAuthSuccess();
    } catch {
      toast.error('Email ou senha incorretos');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cadastroForm.nome || !cadastroForm.email || !cadastroForm.senha) {
      toast.error('Preencha nome, email e senha');
      return;
    }
    setAuthLoading(true);
    try {
      await api.post('/api/cliente-global/cadastro', cadastroForm);
      const loginRes = await api.post('/api/cliente-global/login', {
        email: cadastroForm.email,
        senha: cadastroForm.senha,
      });
      localStorage.setItem('token_cliente', loginRes.data.accessToken);
      localStorage.setItem('cliente', JSON.stringify(loginRes.data.cliente));
      setCadastroForm({ nome: '', email: '', telefone: '', senha: '' });
      toast.success('Conta criada com sucesso');
      handleAuthSuccess();
    } catch {
      toast.error('Erro ao criar conta');
    } finally {
      setAuthLoading(false);
    }
  };

  const allCats = categorias.length > 0 ? categorias : categoriasGlobais;

  const pedidosPorCategoria = pedidos.reduce<Record<string, any[]>>((acc, pedido) => {
    (pedido.itens || []).forEach((item: any) => {
      const catId = item.produto?.categoriaGlobalId || item.produto?.categoriaId || 'sem-categoria';
      if (!acc[catId]) acc[catId] = [];
      const existing = acc[catId].find(
        (p: any) => p.pedidoId === pedido.id && p.nome === item.nome
      );
      if (existing) {
        existing.quantidade += item.quantidade;
      } else {
        acc[catId].push({
          pedidoId: pedido.id,
          pedidoCodigo: pedido.codigo,
          pedidoStatus: pedido.status,
          pedidoCreatedAt: pedido.createdAt,
          nome: item.nome,
          quantidade: item.quantidade,
          precoUnitario: Number(item.precoUnitario),
          total: Number(item.total),
          produtoId: item.produtoId,
        });
      }
    });
    return acc;
  }, {});

  const catOrder = Object.keys(pedidosPorCategoria);

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[50] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-bottom">
        <div className="max-w-3xl mx-auto flex items-center justify-around h-16">
          <button
            onClick={handleHome}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 transition-colors ${
              activeTab === 'home' ? 'text-red-500' : 'text-gray-400'
            }`}
          >
            <Home size={22} />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button
            onClick={handlePedidos}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 transition-colors ${
              activeTab === 'pedidos' ? 'text-red-500' : 'text-gray-400'
            }`}
          >
            <ClipboardList size={22} />
            <span className="text-[10px] font-medium">Pedidos</span>
          </button>
          <button
            onClick={handlePerfil}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 transition-colors ${
              activeTab === 'perfil' ? 'text-red-500' : 'text-gray-400'
            }`}
          >
            <User size={22} />
            <span className="text-[10px] font-medium">Perfil</span>
          </button>
        </div>
      </div>

      {/* Auth Modal - always renders, highest z-index */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowAuthModal(false); setPendingAction(null); }} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden z-[81]">
            <div className="bg-red-500 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User size={20} className="text-white" />
                <span className="text-white font-bold">{loginMode === 'login' ? 'Entrar' : 'Criar Conta'}</span>
              </div>
              <button onClick={() => { setShowAuthModal(false); setPendingAction(null); }} className="text-white/80 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              {loginMode === 'login' ? (
                <form onSubmit={handleAuthLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 text-sm"
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
                    <div className="relative">
                      <input
                        type={showSenha ? 'text' : 'password'}
                        required
                        value={loginForm.senha}
                        onChange={(e) => setLoginForm({ ...loginForm, senha: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 text-sm pr-10"
                        placeholder="Sua senha"
                      />
                      <button type="button" onClick={() => setShowSenha(!showSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                        {showSenha ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {authLoading ? 'Entrando...' : 'Entrar'}
                  </button>
                  <p className="text-center text-sm text-gray-500">
                    Nao tem conta?{' '}
                    <button type="button" onClick={() => setLoginMode('cadastro')} className="text-red-500 font-medium hover:underline">
                      Criar conta
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleAuthCadastro} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                    <input
                      type="text"
                      required
                      value={cadastroForm.nome}
                      onChange={(e) => setCadastroForm({ ...cadastroForm, nome: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 text-sm"
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={cadastroForm.email}
                      onChange={(e) => setCadastroForm({ ...cadastroForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 text-sm"
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone (opcional)</label>
                    <input
                      type="tel"
                      value={cadastroForm.telefone}
                      onChange={(e) => setCadastroForm({ ...cadastroForm, telefone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 text-sm"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
                    <div className="relative">
                      <input
                        type={showSenha ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={cadastroForm.senha}
                        onChange={(e) => setCadastroForm({ ...cadastroForm, senha: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 text-sm pr-10"
                        placeholder="Minimo 6 caracteres"
                      />
                      <button type="button" onClick={() => setShowSenha(!showSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                        {showSenha ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {authLoading ? 'Criando...' : 'Criar Conta'}
                  </button>
                  <p className="text-center text-sm text-gray-500">
                    Ja tem conta?{' '}
                    <button type="button" onClick={() => setLoginMode('login')} className="text-red-500 font-medium hover:underline">
                      Fazer login
                    </button>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pedidos Modal */}
      {showPedidosModal && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPedidosModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-lg max-h-[85vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl z-[71]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100">Meus Pedidos</h2>
              <button onClick={() => setShowPedidosModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {pedidosLoading ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-red-500 rounded-full mx-auto mb-3" />
                  <p className="text-sm">Carregando pedidos...</p>
                </div>
              ) : pedidos.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-3" />
                  <p className="text-sm">Voce ainda nao fez nenhum pedido</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {catOrder.map((catId) => {
                    const cat = allCats.find((c) => c.id === catId);
                    const catNome = cat ? `${cat.icone || ''} ${cat.nome}` : catId === 'sem-categoria' ? 'Outros' : 'Outros';
                    const items = pedidosPorCategoria[catId];
                    return (
                      <div key={catId}>
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">{catNome}</h3>
                        <div className="space-y-2">
                          {items.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.nome}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-500">x{item.quantidade}</span>
                                  <span className="text-xs font-medium text-green-600">R$ {item.total.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[item.pedidoStatus] || 'bg-gray-100 text-gray-600'}`}>
                                    {STATUS_LABELS[item.pedidoStatus] || item.pedidoStatus}
                                  </span>
                                  <span className="text-[10px] text-gray-400">#{item.pedidoCodigo || item.pedidoId.slice(0, 8)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Perfil Modal */}
      {showPerfilModal && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPerfilModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-lg max-h-[85vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl z-[71]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100">Meu Perfil</h2>
              <button onClick={() => setShowPerfilModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {perfilData ? (
                <>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <User size={24} className="text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-gray-100">{perfilData.nome}</p>
                      <p className="text-sm text-gray-500 truncate">{perfilData.email}</p>
                      {perfilData.telefone && <p className="text-sm text-gray-500">{perfilData.telefone}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setShowPerfilModal(false);
                        if (typeof window !== 'undefined') window.location.href = `/cliente/perfil`;
                      }}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <User size={18} className="text-gray-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Editar Perfil</span>
                      </div>
                      <ChevronRight size={18} className="text-gray-400" />
                    </button>
                    <button
                      onClick={() => {
                        setShowPerfilModal(false);
                        if (typeof window !== 'undefined') window.location.href = `/cliente/enderecos`;
                      }}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin size={18} className="text-gray-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Meus Enderecos</span>
                      </div>
                      <ChevronRight size={18} className="text-gray-400" />
                    </button>
                    <button
                      onClick={() => {
                        setShowPerfilModal(false);
                        setActiveTab('pedidos');
                        setShowPedidosModal(true);
                        fetchPedidos();
                      }}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ClipboardList size={18} className="text-gray-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Meus Pedidos</span>
                      </div>
                      <ChevronRight size={18} className="text-gray-400" />
                    </button>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  >
                    <LogOut size={18} />
                    <span className="text-sm font-medium">Sair da conta</span>
                  </button>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-red-500 rounded-full mx-auto mb-3" />
                  <p className="text-sm">Carregando perfil...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
