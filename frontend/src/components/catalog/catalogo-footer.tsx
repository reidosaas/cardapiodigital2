'use client';
import { useState, useEffect } from 'react';
import { Home, ShoppingBag, User, X, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface Pedido {
  id: string;
  codigo?: number;
  status: string;
  total: number;
  createdAt: string;
  vendedor: { nomeLoja: string; slug: string; logoUrl?: string };
  itens: { nome: string; quantidade: number; precoUnitario: number; total: number; categoriaId?: string; categoriaGlobalId?: string; categoria?: { nome: string; icone?: string }; categoriaGlobal?: { nome: string; icone?: string } }[];
}

interface PedidosModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
}

export function PedidosModal({ isOpen, onClose, slug }: PedidosModalProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<{ id: string; nome: string; icone?: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      carregarPedidos();
    }
  }, [isOpen]);

  const carregarPedidos = async () => {
    const token = localStorage.getItem('token_cliente');
    if (!token) return;

    setLoading(true);
    try {
      const res = await api.get('/api/cliente-global/pedidos', {
        params: { vendedorId: slug },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Agrupar categorias dos itens
      const catsSet = new Set<string>();
      res.data.forEach((p: any) => {
        p.itens.forEach((item: any) => {
          const cat = item.categoria || item.categoriaGlobal;
          if (cat?.nome) catsSet.add(JSON.stringify({ id: cat.id || '', nome: cat.nome, icone: cat.icone }));
        });
      });
      
      setPedidos(res.data);
      setCategorias(Array.from(catsSet).map(s => JSON.parse(s)));
    } catch {
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const pedidosFiltrados = filtroCategoria 
    ? pedidos.filter(p => p.itens.some(item => (item.categoria?.nome || item.categoriaGlobal?.nome) === filtroCategoria))
    : pedidos;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[80vh] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">Meus Pedidos</span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
              <X size={18} />
            </button>
          </div>

          {categorias.length > 0 && (
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-2">
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setFiltroCategoria(null)}
                  className={`shrink-0 px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                    !filtroCategoria
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Todos
                </button>
                {categorias.map((cat) => (
                  <button
                    key={cat.id || cat.nome}
                    onClick={() => setFiltroCategoria(cat.nome)}
                    className={`shrink-0 px-3 py-1.5 text-sm font-medium rounded-full transition-colors flex items-center gap-1 ${
                      filtroCategoria === cat.nome
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.icone ? <span>{cat.icone}</span> : <Package className="h-3 w-3" />}
                    {cat.nome}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
              </div>
            ) : pedidosFiltrados.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhum pedido encontrado</p>
                <p className="text-sm mt-1">{filtroCategoria ? `Nesta categoria: ${filtroCategoria}` : 'Faça seu primeiro pedido!'}</p>
              </div>
            ) : (
              pedidosFiltrados.map((pedido) => (
                <motion.div
                  key={pedido.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden"
                >
                  <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">#{pedido.codigo || pedido.id.slice(0, 6)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        pedido.status === 'ENTREGUE' ? 'bg-green-100 text-green-700' :
                        pedido.status === 'SAIU_PARA_ENTREGA' ? 'bg-purple-100 text-purple-700' :
                        pedido.status === 'PREPARANDO' ? 'bg-orange-100 text-orange-700' :
                        pedido.status === 'CONFIRMADO' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {pedido.status}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">R$ {Number(pedido.total).toFixed(2)}</span>
                  </div>

                  <div className="p-3 space-y-2">
                    <p className="text-sm text-gray-500">{pedido.vendedor?.nomeLoja || 'Loja'}</p>
                    <p className="text-xs text-gray-400">{new Date(pedido.createdAt).toLocaleString('pt-BR')}</p>
                    
                    <div className="space-y-2 mt-2 pt-2 border-t border-gray-100">
                      {pedido.itens.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm py-1">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-gray-500">{item.quantidade}x</span>
                            <span className="font-medium text-gray-900 truncate">{item.nome}</span>
                          </div>
                          <span className="font-semibold text-gray-900">R$ {Number(item.total).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between pt-2 border-t border-gray-100">
                      <span className="text-sm text-gray-500">Total</span>
                      <span className="text-lg font-bold text-purple-600">R$ {Number(pedido.total).toFixed(2)}</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">Pedidos são salvos automaticamente na sua conta</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

interface PerfilModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  onLoginSuccess?: () => void;
}

export function PerfilModal({ isOpen, onClose, slug, onLoginSuccess }: PerfilModalProps) {
  const [mode, setMode] = useState<'login' | 'cadastro' | 'area'>('login');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', senha: '' });
  const [cadastroForm, setCadastroForm] = useState({ nome: '', email: '', telefone: '', senha: '' });
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidosLoading, setPedidosLoading] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<{ id: string; nome: string; icone?: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('token_cliente');
      const cliente = localStorage.getItem('cliente');
      
      if (token && cliente) {
        setMode('area');
        carregarPedidos();
      } else {
        setMode('login');
      }
    }
  }, [isOpen]);

  const carregarPedidos = async () => {
    const token = localStorage.getItem('token_cliente');
    if (!token) return;

    setPedidosLoading(true);
    try {
      const res = await api.get('/api/cliente-global/pedidos', {
        params: { vendedorId: slug },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const catsSet = new Set<string>();
      res.data.forEach((p: any) => {
        p.itens.forEach((item: any) => {
          const cat = item.categoria || item.categoriaGlobal;
          if (cat?.nome) catsSet.add(JSON.stringify({ id: cat.id || '', nome: cat.nome, icone: cat.icone }));
        });
      });
      
      setPedidos(res.data);
      setCategorias(Array.from(catsSet).map(s => JSON.parse(s)));
    } catch {
      toast.error('Erro ao carregar pedidos');
    } finally {
      setPedidosLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/api/cliente-global/login', loginForm);
      localStorage.setItem('token_cliente', res.data.accessToken);
      localStorage.setItem('cliente', JSON.stringify(res.data.cliente));
      toast.success('Login realizado!');
      onLoginSuccess?.();
      setMode('area');
      setLoginForm({ email: '', senha: '' });
      carregarPedidos();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/api/cliente-global/cadastro', cadastroForm);
      toast.success('Cadastro realizado! Fazendo login...');
      const loginRes = await api.post('/api/cliente-global/login', { email: cadastroForm.email, senha: cadastroForm.senha });
      localStorage.setItem('token_cliente', loginRes.data.accessToken);
      localStorage.setItem('cliente', JSON.stringify(loginRes.data.cliente));
      onLoginSuccess?.();
      setMode('area');
      setCadastroForm({ nome: '', email: '', telefone: '', senha: '' });
      carregarPedidos();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token_cliente');
    localStorage.removeItem('cliente');
    setMode('login');
    setPedidos([]);
  };

  const pedidosFiltrados = filtroCategoria
    ? pedidos.filter(p => p.itens.some(item => (item.categoria?.nome || item.categoriaGlobal?.nome) === filtroCategoria))
    : pedidos;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">
                {mode === 'login' ? 'Entrar' : mode === 'cadastro' ? 'Criar Conta' : 'Minha Conta'}
              </span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
              <X size={18} />
            </button>
          </div>

          {mode === 'area' && (
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{JSON.parse(localStorage.getItem('cliente') || '{}').nome || 'Cliente'}</p>
                    <p className="text-xs text-gray-500">Área do Cliente</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="text-xs text-red-500 hover:underline">Sair</button>
              </div>
            )}

          <div className="flex-1 overflow-y-auto p-4">
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-3">
                <input
                  type="email" required placeholder="Email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
                <div className="relative">
                  <input
                    type={showSenha ? 'text' : 'password'} required placeholder="Senha"
                    value={loginForm.senha}
                    onChange={(e) => setLoginForm({ ...loginForm, senha: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 pr-10"
                  />
                  <button type="button" onClick={() => setShowSenha(!showSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl bg-purple-500 text-white font-semibold text-sm hover:bg-purple-600 disabled:opacity-50">
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>
            )}

            {mode === 'cadastro' && (
              <form onSubmit={handleCadastro} className="space-y-3">
                <input type="text" required placeholder="Nome completo" value={cadastroForm.nome} onChange={(e) => setCadastroForm({ ...cadastroForm, nome: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
                <input type="email" required placeholder="Email" value={cadastroForm.email} onChange={(e) => setCadastroForm({ ...cadastroForm, email: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
                <input type="tel" placeholder="Telefone (opcional)" value={cadastroForm.telefone} onChange={(e) => setCadastroForm({ ...cadastroForm, telefone: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
                <div className="relative">
                  <input type={showSenha ? 'text' : 'password'} required minLength={6} placeholder="Mínimo 6 caracteres" value={cadastroForm.senha} onChange={(e) => setCadastroForm({ ...cadastroForm, senha: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 pr-10" />
                  <button type="button" onClick={() => setShowSenha(!showSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showSenha ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
                <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl bg-purple-500 text-white font-semibold text-sm hover:bg-purple-600 disabled:opacity-50">{loading ? 'Cadastrando...' : 'Cadastrar'}</button>
              </form>
            )}

            {mode === 'area' && (
              <div className="space-y-4">
                {categorias.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <button onClick={() => setFiltroCategoria(null)} className={`shrink-0 px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${!filtroCategoria ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Todos</button>
                    {categorias.map((cat) => (
                      <button key={cat.id || cat.nome} onClick={() => setFiltroCategoria(cat.nome)} className={`shrink-0 px-3 py-1.5 text-sm font-medium rounded-full transition-colors flex items-center gap-1 ${filtroCategoria === cat.nome ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{cat.icone && <span>{cat.icone}</span>}{cat.nome}</button>
                    ))}
                  </div>
                )}

                {pedidosLoading ? (
                  <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" /></div>
                ) : pedidos.length === 0 ? (
                  <div className="text-center py-12 text-gray-400"><ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" /><p className="font-medium">Nenhum pedido ainda</p><p className="text-sm mt-1">Seus pedidos aparecerão aqui</p></div>
                ) : (
                  <div className="space-y-3">
                    {pedidosFiltrados.map((pedido) => (
                      <motion.div key={pedido.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">#{pedido.codigo || pedido.id.slice(0, 6)}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pedido.status === 'ENTREGUE' ? 'bg-green-100 text-green-700' : pedido.status === 'SAIU_PARA_ENTREGA' ? 'bg-purple-100 text-purple-700' : pedido.status === 'PREPARANDO' ? 'bg-orange-100 text-orange-700' : pedido.status === 'CONFIRMADO' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{pedido.status}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-900">R$ {Number(pedido.total).toFixed(2)}</span>
                        </div>
                        <div className="p-3 space-y-2">
                          <p className="text-sm text-gray-500">{pedido.vendedor?.nomeLoja || 'Loja'}</p>
                          <p className="text-xs text-gray-400">{new Date(pedido.createdAt).toLocaleString('pt-BR')}</p>
                          <div className="space-y-1 mt-2 pt-2 border-t border-gray-100">
                            {pedido.itens.map((item, i) => (
                              <div key={i} className="flex items-center justify-between text-sm py-1"><div className="flex items-center gap-2 flex-1 min-w-0"><span className="text-gray-500">{item.quantidade}x</span><span className="font-medium text-gray-900 truncate">{item.nome}</span></div><span className="font-semibold text-gray-900">R$ {Number(item.total).toFixed(2)}</span></div>
                            ))}
                          </div>
                          <div className="flex justify-between pt-2 border-t border-gray-100"><span className="text-sm text-gray-500">Total</span><span className="text-lg font-bold text-purple-600">R$ {Number(pedido.total).toFixed(2)}</span></div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 text-center text-xs text-gray-500">
              {mode === 'login' && <span>Não tem conta? <button onClick={() => setMode('cadastro')} className="text-purple-500 font-medium hover:underline">Cadastre-se</button></span>}
              {mode === 'cadastro' && <span>Já tem conta? <button onClick={() => setMode('login')} className="text-purple-500 font-medium hover:underline">Fazer login</button></span>}
              {mode === 'area' && <span>Pedidos salvos na sua conta</span>}
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">Pedidos ficam salvos na sua conta</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export function CatalogoFooter({ slug }: { slug: string }) {
  const [showPedidos, setShowPedidos] = useState(false);
  const [showPerfil, setShowPerfil] = useState(false);
  const token = localStorage.getItem('token_cliente');

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="grid grid-cols-3 max-w-3xl mx-auto">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center justify-center gap-1 py-3 text-purple-500"
        >
          <Home className="h-6 w-6" />
          <span className="text-xs font-medium">Home</span>
        </button>

        <button
          onClick={() => setShowPedidos(true)}
          className="flex flex-col items-center justify-center gap-1 py-3 text-gray-600 dark:text-gray-400"
        >
          <ShoppingBag className="h-6 w-6" />
          <span className="text-xs font-medium">Pedidos</span>
        </button>

        <button
          onClick={() => setShowPerfil(true)}
          className="flex flex-col items-center justify-center gap-1 py-3 text-gray-600 dark:text-gray-400"
        >
          <User className="h-6 w-6" />
          <span className="text-xs font-medium">Perfil</span>
        </button>
      </div>

      <PedidosModal isOpen={showPedidos} onClose={() => setShowPedidos(false)} slug={slug} />
      <PerfilModal isOpen={showPerfil} onClose={() => setShowPerfil(false)} slug={slug} />
    </div>
  );
}

function EyeOff(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>; }
function Eye(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }