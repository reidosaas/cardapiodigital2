'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loading } from '@/components/shared/loading';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import { printPedido } from '@/lib/print';
import { Clock, Package, Check, X, Utensils, Bike, ChefHat, ClipboardList, Phone, MapPin, MessageSquare, ChevronDown, ChevronUp, RefreshCw, Bell, Volume2, Printer, Plus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

function useAlertaSonoro() {
  const ctxRef = useRef<AudioContext | null>(null);

  const coinDrop = useCallback((ctx: AudioContext, time: number) => {
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.3, time);
    masterGain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
    masterGain.connect(ctx.destination);

    const noiseLen = 0.04;
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * noiseLen, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    noiseSrc.connect(noiseGain).connect(masterGain);
    noiseSrc.start(time);
    noiseSrc.stop(time + 0.04);

    const ringFreq = 3500;
    for (let i = 0; i < 3; i++) {
      const t = time + i * 0.18;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = ringFreq + i * 500;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.5 - i * 0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.12 - i * 0.03);
      osc.connect(g).connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.12);

      if (i < 2) {
        const nLen = 0.025 - i * 0.005;
        const nBuf = ctx.createBuffer(1, ctx.sampleRate * nLen, ctx.sampleRate);
        const nData = nBuf.getChannelData(0);
        for (let j = 0; j < nData.length; j++) nData[j] = Math.random() * 2 - 1;
        const nSrc = ctx.createBufferSource();
        nSrc.buffer = nBuf;
        const nG = ctx.createGain();
        nG.gain.setValueAtTime(0.5 - i * 0.2, t);
        nG.gain.exponentialRampToValueAtTime(0.001, t + nLen);
        nSrc.connect(nG).connect(masterGain);
        nSrc.start(t);
        nSrc.stop(t + nLen);
      }
    }
  }, []);

  const play = useCallback(() => {
    if (ctxRef.current) return;
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    if (ctx.state === 'suspended') ctx.resume();
    coinDrop(ctx, ctx.currentTime + 0.05);
  }, [coinDrop]);

  const stop = useCallback(() => {
    try { ctxRef.current?.close(); } catch {}
    ctxRef.current = null;
  }, []);

  return { play, stop };
}

type OrderStatus = 'PENDENTE' | 'CONFIRMADO' | 'PREPARANDO' | 'SAIU_PARA_ENTREGA' | 'ENTREGUE' | 'CANCELADO';

interface Order {
  id: string;
  codigo?: number;
  clienteNome?: string;
  clienteTelefone?: string;
  total: number;
  taxaEntrega?: number;
  status: OrderStatus;
  tipoEntrega?: string;
  enderecoEntrega?: string;
  observacao?: string;
  origem?: string;
  createdAt: string;
  itens: { id: string; nome: string; quantidade: number; precoUnitario: number; total: number; observacao?: string }[];
  pagamento?: { status: string; forma?: string };
}

const colunas: { key: OrderStatus; label: string; icon: any; color: string }[] = [
  { key: 'PENDENTE', label: 'Pendentes', icon: Clock, color: 'bg-yellow-500' },
  { key: 'CONFIRMADO', label: 'Confirmados', icon: ClipboardList, color: 'bg-blue-500' },
  { key: 'PREPARANDO', label: 'Preparando', icon: ChefHat, color: 'bg-orange-500' },
  { key: 'SAIU_PARA_ENTREGA', label: 'Saiu p/ Entrega', icon: Bike, color: 'bg-purple-500' },
  { key: 'ENTREGUE', label: 'Entregues', icon: Check, color: 'bg-green-500' },
  { key: 'CANCELADO', label: 'Cancelados', icon: X, color: 'bg-red-500' },
];

const statusProximo: Record<OrderStatus, OrderStatus | null> = {
  PENDENTE: 'CONFIRMADO',
  CONFIRMADO: 'PREPARANDO',
  PREPARANDO: 'SAIU_PARA_ENTREGA',
  SAIU_PARA_ENTREGA: 'ENTREGUE',
  ENTREGUE: null,
  CANCELADO: null,
};

function calcularTempo(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Agora';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h}h${min % 60}m`;
}

export default function PedidosPage() {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [alertaAtivo, setAlertaAtivo] = useState(false);
  const [novosIds, setNovosIds] = useState<string[]>([]);
  const [showNovoPedido, setShowNovoPedido] = useState(false);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [novoForm, setNovoForm] = useState({ nome: '', telefone: '', tipoEntrega: 'RETIRADA', endereco: '', observacao: '' });
  const [novoItens, setNovoItens] = useState<{ produtoId: string; nome: string; preco: number; quantidade: number }[]>([]);
  const idsConhecidos = useRef<Set<string>>(new Set());
  const { play, stop } = useAlertaSonoro();
  const [entregaModal, setEntregaModal] = useState<{ pedidoId: string } | null>(null);
  const [entregadores, setEntregadores] = useState<any[]>([]);
  const [entregadorTipo, setEntregadorTipo] = useState<'cadastrado' | 'terceirizado'>('cadastrado');
  const [entregadorSelecionado, setEntregadorSelecionado] = useState('');
  const [entregadorNomeTerceiro, setEntregadorNomeTerceiro] = useState('');
  const [ultimoCaixa, setUltimoCaixa] = useState<any>(null);

  useEffect(() => {
    if (!user?.vendedor?.id) return;
    api.get('/api/caixa/ultimo').then((r) => setUltimoCaixa(r.data)).catch(() => {});
    api.get(`/api/entregadores/stats/vendedor/${user.vendedor.id}`).then((r) => setEntregadores(r.data.filter((e: any) => e.vinculoStatus === 'ACEITO'))).catch(() => {});
  }, [user]);

  const confirmarEntrega = async () => {
    if (!entregaModal) return;
    const eid = entregadorTipo === 'cadastrado' ? entregadorSelecionado : undefined;
    const enome = entregadorTipo === 'cadastrado'
      ? entregadores.find((e) => e.id === entregadorSelecionado)?.nome
      : entregadorNomeTerceiro;
    if (!enome) { toast.error('Selecione ou digite o nome do entregador'); return; }
    try {
      await api.patch(`/api/pedidos/${entregaModal.pedidoId}/status`, { status: 'SAIU_PARA_ENTREGA', entregadorId: eid, entregadorNome: enome });
      setPedidos((prev) => prev.map((p) => p.id === entregaModal.pedidoId ? { ...p, status: 'SAIU_PARA_ENTREGA' as OrderStatus } : p));
      toast.success('Entrega registrada');
      setEntregaModal(null);
      setEntregadorSelecionado('');
      setEntregadorNomeTerceiro('');
    } catch { toast.error('Erro ao registrar entrega'); }
  };

  const carregarPedidos = useCallback(async () => {
    if (!user?.vendedor?.id) return;
    try {
      const res = await api.get(`/api/pedidos/vendedor/${user.vendedor.id}`, { params: { status: undefined } });
      let novos: Order[] = res.data;

      if (ultimoCaixa?.dataFim) {
        const desde = new Date(ultimoCaixa.dataFim).getTime();
        novos = novos.filter((p) => {
          if (p.status === 'ENTREGUE' || p.status === 'CANCELADO') {
            return new Date(p.createdAt).getTime() > desde;
          }
          return true;
        });
      }

      setPedidos(novos);

      const pendentesIds = novos.filter((p) => p.status === 'PENDENTE').map((p) => p.id);
      const novosPendentes = pendentesIds.filter((id) => !idsConhecidos.current.has(id));

      if (novosPendentes.length > 0) {
        setNovosIds((prev) => Array.from(new Set([...prev, ...novosPendentes])));
        setAlertaAtivo(true);
        play();
      }

      pendentesIds.forEach((id) => idsConhecidos.current.add(id));
    } finally {
      setLoading(false);
    }
  }, [user, play, ultimoCaixa]);

  useEffect(() => {
    carregarPedidos();
  }, [carregarPedidos]);

  useEffect(() => {
    const interval = setInterval(carregarPedidos, 10000);
    return () => clearInterval(interval);
  }, [carregarPedidos]);

  useEffect(() => {
    if (!showNovoPedido || !user?.vendedor?.id) return;
    api.get(`/api/produtos/vendedor/${user.vendedor.id}`).then((r) => setProdutos(r.data)).catch(() => {});
  }, [showNovoPedido, user]);

  const addItem = (produto: any) => {
    setNovoItens((prev) => {
      const exist = prev.find((i) => i.produtoId === produto.id);
      if (exist) return prev.map((i) => i.produtoId === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      return [...prev, { produtoId: produto.id, nome: produto.nome, preco: Number(produto.preco), quantidade: 1 }];
    });
  };

  const criarPedido = async () => {
    if (!novoForm.nome || !novoForm.telefone || novoItens.length === 0) {
      toast.error('Preencha nome, telefone e adicione itens');
      return;
    }
    const total = novoItens.reduce((s, i) => s + i.preco * i.quantidade, 0);
    try {
      await api.post('/api/pedidos', {
        vendedorId: user!.vendedor!.id,
        clienteNome: novoForm.nome,
        clienteTelefone: novoForm.telefone,
        items: novoItens.map((i) => ({ produtoId: i.produtoId, nome: i.nome, quantidade: i.quantidade, precoUnitario: i.preco, total: i.preco * i.quantidade })),
        total,
        tipoEntrega: novoForm.tipoEntrega,
        enderecoEntrega: novoForm.tipoEntrega === 'ENTREGA' ? novoForm.endereco : undefined,
        observacao: novoForm.observacao || undefined,
        origem: 'manual',
      });
      toast.success('Pedido criado!');
      setShowNovoPedido(false);
      setNovoItens([]);
      setNovoForm({ nome: '', telefone: '', tipoEntrega: 'RETIRADA', endereco: '', observacao: '' });
      carregarPedidos();
    } catch {
      toast.error('Erro ao criar pedido');
    }
  };

  const atualizar = async () => {
    setAtualizando(true);
    await carregarPedidos();
    setAtualizando(false);
    toast.success('Pedidos atualizados');
  };

  const updateStatus = async (id: string, status: OrderStatus, extra: Record<string, any> = {}) => {
    try {
      await api.patch(`/api/pedidos/${id}/status`, { status, ...extra });
      setPedidos((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
      toast.success('Status atualizado');
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  useEffect(() => {
    if (!alertaAtivo) return;
    const pendentes = novosIds.filter((id) => {
      const p = pedidos.find((p) => p.id === id);
      return p && p.status === 'PENDENTE';
    });
    if (pendentes.length === 0 && novosIds.length > 0) {
      setAlertaAtivo(false);
      setNovosIds([]);
      stop();
    }
  }, [pedidos, novosIds, alertaAtivo, stop]);

  const avançarStatus = (pedido: Order) => {
    const prox = statusProximo[pedido.status];
    if (prox) updateStatus(pedido.id, prox);
  };

  const pedidosPorStatus = (status: OrderStatus) =>
    pedidos.filter(p => p.status === status).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold">Pedidos</h2>
            <p className="text-gray-500">Acompanhe e gerencie seus pedidos em tempo real</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setShowNovoPedido(true)}>
              <Plus size={16} className="mr-1" /> Novo Pedido
            </Button>
            <Button variant="outline" size="sm" onClick={atualizar} disabled={atualizando}>
              <RefreshCw className={`mr-2 h-4 w-4 ${atualizando ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {alertaAtivo && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-5 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell size={22} className="text-red-500 animate-bounce" />
                  <Volume2 size={14} className="text-red-400 absolute -top-1 -right-2" />
                </div>
                <div>
                  <p className="font-semibold text-red-700 dark:text-red-400 text-sm">Novo pedido recebido!</p>
                  <p className="text-xs text-red-500">{novosIds.length} pedido(s) aguardando aprovacao</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-100 dark:border-red-800 dark:text-red-400 text-xs"
                onClick={() => { setAlertaAtivo(false); stop(); }}
              >
                Silenciar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 md:gap-3">
          {colunas.map((coluna) => {
            const Icon = coluna.icon;
            const lista = pedidosPorStatus(coluna.key);
            return (
              <div key={coluna.key} className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col">
                <div className={`sticky top-0 z-10 ${coluna.color} text-white px-2.5 py-1.5 rounded-t-xl flex items-center justify-between`}>
                  <div className="flex items-center gap-1 text-xs font-semibold">
                    <Icon size={12} />
                    {coluna.label}
                  </div>
                  <span className="text-[10px] bg-white/20 rounded-full px-1.5 py-0.5">{lista.length}</span>
                </div>

                <div className="p-1.5 space-y-1.5 max-h-[60vh] overflow-y-auto">
                  {lista.length === 0 && (
                    <div className="text-center py-4 text-gray-400 text-[10px]">
                      <Package size={16} className="mx-auto mb-0.5 opacity-50" />
                      Nenhum
                    </div>
                  )}
                  <AnimatePresence>
                    {lista.map((pedido) => (
                      <motion.div
                        key={pedido.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-2 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setExpandido(expandido === pedido.id ? null : pedido.id)}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-xs truncate">{pedido.clienteNome || 'Anonimo'}</p>
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                              <Clock size={9} />
                              <span>{calcularTempo(pedido.createdAt)}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-1">
                            <p className="font-bold text-xs">{formatCurrency(pedido.total)}</p>
                            <p className="text-[10px] text-gray-400">#{pedido.codigo ? String(pedido.codigo).padStart(8, '0') : pedido.id.slice(0, 6)}</p>
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          {pedido.itens.slice(0, expandido === pedido.id ? pedido.itens.length : 2).map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-[10px]">
                              <span className="text-gray-600 dark:text-gray-300 truncate">
                                <span className="font-medium">{item.quantidade}x</span> {item.nome}
                              </span>
                              <span className="text-gray-500 flex-shrink-0 ml-1">{formatCurrency(item.total)}</span>
                            </div>
                          ))}
                          {pedido.itens.length > 2 && expandido !== pedido.id && (
                            <button className="text-[10px] text-primary hover:underline mt-0.5">+{pedido.itens.length - 2} itens</button>
                          )}
                        </div>

                        {expandido === pedido.id && (
                          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 space-y-1.5 text-xs text-gray-500">
                            {pedido.clienteTelefone && (
                              <div className="flex items-center gap-1">
                                <Phone size={11} /> {pedido.clienteTelefone}
                              </div>
                            )}
                            {pedido.tipoEntrega && (
                              <div className="flex items-center gap-1">
                                <MapPin size={11} /> {pedido.tipoEntrega === 'ENTREGA' ? 'Entrega' : 'Retirada'}
                                {pedido.enderecoEntrega && ` - ${pedido.enderecoEntrega}`}
                              </div>
                            )}
                            {pedido.tipoEntrega === 'ENTREGA' && pedido.enderecoEntrega && (
                              <div className="flex gap-1 mt-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pedido.enderecoEntrega || '')}`, '_blank'); }}
                                  className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors flex-shrink-0"
                                  title="Abrir no Google Maps"
                                >
                                  <MapPin size={12} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); window.open(`https://waze.com/ul?navigate=yes&address=${encodeURIComponent(pedido.enderecoEntrega || '')}`, '_blank'); }}
                                  className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors flex-shrink-0"
                                  title="Abrir no Waze"
                                >
                                  <Bike size={12} />
                                </button>
                              </div>
                            )}
                            {pedido.observacao && (
                              <div className="flex items-start gap-1">
                                <MessageSquare size={11} className="mt-0.5" />
                                <span>{pedido.observacao}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-1.5 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                          <button
                            onClick={(e) => { e.stopPropagation(); printPedido(pedido); }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                            title="Imprimir"
                          >
                            <Printer size={14} />
                          </button>
                          {pedido.status === 'PENDENTE' && (
                            <>
                              <Button size="sm" className="flex-1 h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); updateStatus(pedido.id, 'CONFIRMADO'); }}>
                                <Check size={12} /> Aceitar
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1 h-7 text-xs gap-1 text-red-500 border-red-200 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); updateStatus(pedido.id, 'CANCELADO'); }}>
                                <X size={12} /> Recusar
                              </Button>
                            </>
                          )}
                          {pedido.status === 'CONFIRMADO' && (
                            <Button size="sm" className="flex-1 h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); updateStatus(pedido.id, 'PREPARANDO'); }}>
                              <ChefHat size={12} /> Iniciar Preparo
                            </Button>
                          )}
                          {pedido.status === 'PREPARANDO' && (
                            <Button size="sm" className="flex-1 h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); pedido.tipoEntrega === 'ENTREGA' ? setEntregaModal({ pedidoId: pedido.id }) : updateStatus(pedido.id, 'SAIU_PARA_ENTREGA'); }}>
                              <Bike size={12} /> Saiu p/ Entrega
                            </Button>
                          )}
                          {pedido.status === 'SAIU_PARA_ENTREGA' && (
                            <Button size="sm" className="flex-1 h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); updateStatus(pedido.id, 'ENTREGUE'); }}>
                              <Check size={12} /> Confirmar Entrega
                            </Button>
                          )}
                          {pedido.status !== 'PENDENTE' && pedido.status !== 'ENTREGUE' && pedido.status !== 'CANCELADO' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 border-red-200 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); updateStatus(pedido.id, 'CANCELADO'); }}>
                              <X size={12} /> Cancelar
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>

      {showNovoPedido && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNovoPedido(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Novo Pedido</h3>
              <button onClick={() => setShowNovoPedido(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <input type="text" placeholder="Nome do cliente *" value={novoForm.nome}
                onChange={(e) => setNovoForm({ ...novoForm, nome: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input type="tel" placeholder="Telefone *" value={novoForm.telefone}
                onChange={(e) => setNovoForm({ ...novoForm, telefone: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <div className="flex gap-2">
                {['RETIRADA', 'ENTREGA'].map((t) => (
                  <button key={t} onClick={() => setNovoForm({ ...novoForm, tipoEntrega: t })}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${novoForm.tipoEntrega === t ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}>
                    {t === 'RETIRADA' ? 'Retirada' : 'Entrega'}
                  </button>
                ))}
              </div>
              {novoForm.tipoEntrega === 'ENTREGA' && (
                <input type="text" placeholder="Endereco de entrega" value={novoForm.endereco}
                  onChange={(e) => setNovoForm({ ...novoForm, endereco: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              )}
              <textarea placeholder="Observacao" value={novoForm.observacao} rows={2}
                onChange={(e) => setNovoForm({ ...novoForm, observacao: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Search size={14} className="text-gray-400" />
                <input type="text" placeholder="Buscar produto..." value={buscaProduto}
                  onChange={(e) => setBuscaProduto(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 border rounded-xl p-2">
                {produtos.filter((p) => p.nome.toLowerCase().includes(buscaProduto.toLowerCase())).map((p) => (
                  <button key={p.id} onClick={() => addItem(p)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm text-left">
                    <span>{p.nome}</span>
                    <span className="text-gray-500 text-xs">R$ {Number(p.preco).toFixed(2)}</span>
                  </button>
                ))}
                {produtos.length === 0 && <p className="text-xs text-gray-400 text-center py-3">Nenhum produto cadastrado</p>}
              </div>
            </div>

            {novoItens.length > 0 && (
              <div className="border rounded-xl p-3 space-y-2">
                <p className="text-sm font-semibold">Itens adicionados</p>
                {novoItens.map((item) => (
                  <div key={item.produtoId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setNovoItens((prev) => {
                        const updated = prev.map((i) => i.produtoId === item.produtoId ? { ...i, quantidade: Math.max(0, i.quantidade - 1) } : i);
                        return updated.filter((i) => i.quantidade > 0);
                      })} className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">-</button>
                      <span className="w-5 text-center text-xs font-medium">{item.quantidade}</span>
                      <button onClick={() => addItem(produtos.find((p) => p.id === item.produtoId) || item)}
                        className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">+</button>
                      <span className="ml-1">{item.nome}</span>
                    </div>
                    <span className="text-xs text-gray-500">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>R$ {novoItens.reduce((s, i) => s + i.preco * i.quantidade, 0).toFixed(2)}</span>
                </div>
              </div>
            )}

            <button onClick={criarPedido}
              className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-colors">
              Criar Pedido
            </button>
          </div>
        </div>
      )}
      </div>

      {entregaModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEntregaModal(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg">Selecionar Entregador</h3>
            <div className="flex gap-2">
              <button onClick={() => setEntregadorTipo('cadastrado')}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${entregadorTipo === 'cadastrado' ? 'bg-primary text-white border-primary' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}>
                Cadastrado
              </button>
              <button onClick={() => setEntregadorTipo('terceirizado')}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${entregadorTipo === 'terceirizado' ? 'bg-primary text-white border-primary' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}>
                Terceirizado
              </button>
            </div>
            {entregadorTipo === 'cadastrado' ? (
              <select value={entregadorSelecionado} onChange={(e) => setEntregadorSelecionado(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">Selecione um entregador</option>
                {entregadores.filter((e) => e.ativo).map((e) => (
                  <option key={e.id} value={e.id}>{e.nome}{e.telefone ? ` - ${e.telefone}` : ''}</option>
                ))}
              </select>
            ) : (
              <input type="text" placeholder="Nome do entregador" value={entregadorNomeTerceiro}
                onChange={(e) => setEntregadorNomeTerceiro(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setEntregaModal(null)}>Cancelar</Button>
              <Button className="flex-1" onClick={confirmarEntrega}>
                <Bike size={16} className="mr-1" /> Confirmar Saida
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
