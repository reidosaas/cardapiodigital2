'use client';
import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loading } from '@/components/shared/loading';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import {
  Plus, X, RefreshCw, Search, Trash2, Pencil,
  Clock, CheckCircle2, Receipt, Table2,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

type MesaStatus = 'DISPONIVEL' | 'EM_CONSUMO' | 'PEDIU_CONTA';
type PedidoStatus = 'PENDENTE' | 'CONFIRMADO' | 'PREPARANDO' | 'SAIU_PARA_ENTREGA' | 'ENTREGUE' | 'CANCELADO';

interface ItemPedido {
  id: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  total: number;
  observacao?: string;
}

interface Pedido {
  id: string;
  clienteNome?: string;
  status: PedidoStatus;
  total: number;
  createdAt: string;
  itens: ItemPedido[];
}

interface Mesa {
  id: string;
  nome: string;
  status: MesaStatus;
  pedidos: Pedido[];
}

function calcularTempo(createdAt: string): string {
  const min = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (min < 1) return 'Agora';
  if (min < 60) return min + 'min';
  return Math.floor(min / 60) + 'h' + min % 60 + 'm';
}

const STATUS_CONFIG: Record<MesaStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  DISPONIVEL:  { label: 'Disponivel',  bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600', dot: 'bg-emerald-300' },
  EM_CONSUMO:  { label: 'Em consumo',  bg: 'bg-sky-500',     text: 'text-white', border: 'border-sky-600',     dot: 'bg-sky-300'     },
  PEDIU_CONTA: { label: 'Pediu conta', bg: 'bg-orange-500',  text: 'text-white', border: 'border-orange-600',  dot: 'bg-orange-300'  },
};

const PEDIDO_STATUS_LABEL: Record<PedidoStatus, string> = {
  PENDENTE: 'Pendente', CONFIRMADO: 'Confirmado', PREPARANDO: 'Preparando',
  SAIU_PARA_ENTREGA: 'Saiu p/ entrega', ENTREGUE: 'Entregue', CANCELADO: 'Cancelado',
};

const PEDIDO_STATUS_COLOR: Record<PedidoStatus, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-700', CONFIRMADO: 'bg-blue-100 text-blue-700',
  PREPARANDO: 'bg-orange-100 text-orange-700', SAIU_PARA_ENTREGA: 'bg-purple-100 text-purple-700',
  ENTREGUE: 'bg-green-100 text-green-700', CANCELADO: 'bg-red-100 text-red-700',
};

function MesaCard({ mesa, onClick }: { mesa: Mesa; onClick: () => void }) {
  const cfg = STATUS_CONFIG[mesa.status];
  const ativos = mesa.pedidos.filter(p => !['ENTREGUE','CANCELADO'].includes(p.status));
  const total = ativos.reduce((s, p) => s + Number(p.total), 0);
  const tempo = ativos.length > 0 ? calcularTempo(ativos[ativos.length - 1].createdAt) : null;
  return (
    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onClick}
      className={'relative w-full rounded-xl border-2 ' + cfg.border + ' ' + cfg.bg + ' ' + cfg.text + ' p-4 text-left transition-shadow hover:shadow-xl min-h-[110px] flex flex-col justify-between'}>
      <div className="flex items-start justify-between">
        <span className="text-2xl font-bold leading-none">{mesa.nome}</span>
        {ativos.length > 0 && (
          <span className="bg-white/25 text-xs font-semibold px-2 py-0.5 rounded-full">{ativos.length} ped.</span>
        )}
      </div>
      <div className="mt-2">
        {total > 0 && <p className="text-sm font-semibold opacity-95">{formatCurrency(total)}</p>}
        {tempo && (
          <div className="flex items-center gap-1 opacity-80 mt-0.5">
            <Clock size={11} /><span className="text-xs">{tempo}</span>
          </div>
        )}
        <div className="flex items-center gap-1 mt-1">
          <span className={'w-2 h-2 rounded-full ' + cfg.dot + ' opacity-90'} />
          <span className="text-xs opacity-90">{cfg.label}</span>
        </div>
      </div>
    </motion.button>
  );
}

export default function MesasPage() {
  const { user } = useAuth();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [novaMesa, setNovaMesa] = useState('');
  const [mesaSelecionada, setMesaSelecionada] = useState<Mesa | null>(null);
  const [showNovoPedido, setShowNovoPedido] = useState(false);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [itens, setItens] = useState<{ produtoId: string; nome: string; preco: number; quantidade: number }[]>([]);
  const [nomeCliente, setNomeCliente] = useState('');
  const [obs, setObs] = useState('');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');

  const carregar = useCallback(async () => {
    if (!user?.vendedor?.id) return;
    try {
      const res = await api.get('/api/mesas');
      setMesas(res.data);
    } catch { toast.error('Erro ao carregar mesas'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { const iv = setInterval(carregar, 5000); return () => clearInterval(iv); }, [carregar]);

  // Mantem mesaSelecionada sincronizada com dados frescos
  useEffect(() => {
    if (!mesaSelecionada) return;
    const upd = mesas.find(m => m.id === mesaSelecionada.id);
    if (upd) setMesaSelecionada(upd);
  }, [mesas]); // eslint-disable-line react-hooks/exhaustive-deps

  const fecharPainel = useCallback(() => {
    setMesaSelecionada(null);
    setShowNovoPedido(false);
    setRenameId(null);
  }, []);

  const criarMesa = async () => {
    if (!novaMesa.trim()) return;
    try {
      await api.post('/api/mesas', { nome: novaMesa.trim() });
      setNovaMesa(''); carregar(); toast.success('Mesa criada');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro'); }
  };

  const deletarMesa = async (id: string) => {
    if (!confirm('Deletar esta mesa?')) return;
    try {
      await api.delete('/api/mesas/' + id);
      fecharPainel(); carregar(); toast.success('Mesa removida');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro'); }
  };

  const renomear = async (id: string) => {
    if (!renameVal.trim()) { setRenameId(null); return; }
    try {
      await api.patch('/api/mesas/' + id, { nome: renameVal.trim() });
      setRenameId(null); carregar();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erro'); }
  };

  const mudarStatus = async (id: string, status: MesaStatus) => {
    const anterior = mesas;
    setMesas((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    setMesaSelecionada((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
    toast.success('Mesa: ' + STATUS_CONFIG[status].label);
    try {
      await api.patch('/api/mesas/' + id + '/status', { status });
      carregar();
    } catch {
      setMesas(anterior);
      toast.error('Erro ao mudar status');
    }
  };

  const liberarMesa = async (id: string) => {
    const anterior = mesas;
    setMesas((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'DISPONIVEL' as MesaStatus, pedidos: [] } : m)));
    fecharPainel();
    toast.success('Mesa liberada!');
    try {
      await api.patch('/api/mesas/' + id + '/liberar');
      carregar();
    } catch {
      setMesas(anterior);
      toast.error('Erro ao liberar');
    }
  };

  const abrirNovoPedido = async () => {
    if (!user?.vendedor?.id) return;
    if (produtos.length === 0) {
      const r = await api.get('/api/produtos/vendedor/' + user.vendedor.id);
      setProdutos(r.data);
    }
    setItens([]); setNomeCliente(''); setObs(''); setBusca('');
    setShowNovoPedido(true);
  };

  const addItem = (produto: any) => {
    setItens(prev => {
      const ex = prev.find(i => i.produtoId === produto.id);
      if (ex) return prev.map(i => i.produtoId === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      return [...prev, { produtoId: produto.id, nome: produto.nome, preco: Number(produto.preco), quantidade: 1 }];
    });
  };

  const criarPedido = async () => {
    if (!mesaSelecionada || itens.length === 0) { toast.error('Adicione ao menos 1 item'); return; }
    const total = itens.reduce((s, i) => s + i.preco * i.quantidade, 0);
    try {
      await api.post('/api/pedidos', {
        vendedorId: user!.vendedor!.id, mesaId: mesaSelecionada.id,
        clienteNome: nomeCliente || 'Mesa ' + mesaSelecionada.nome,
        items: itens.map(i => ({ produtoId: i.produtoId, nome: i.nome, quantidade: i.quantidade, precoUnitario: i.preco, total: i.preco * i.quantidade })),
        total, tipoEntrega: 'LOCAL', observacao: obs || undefined, origem: 'mesa',
      });
      if (mesaSelecionada.status === 'DISPONIVEL')
        await api.patch('/api/mesas/' + mesaSelecionada.id + '/status', { status: 'EM_CONSUMO' });
      fecharPainel(); carregar(); toast.success('Pedido criado!');
    } catch { toast.error('Erro ao criar pedido'); }
  };

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  const counts = {
    DISPONIVEL: mesas.filter(m => m.status === 'DISPONIVEL').length,
    EM_CONSUMO: mesas.filter(m => m.status === 'EM_CONSUMO').length,
    PEDIU_CONTA: mesas.filter(m => m.status === 'PEDIU_CONTA').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold">Mesas</h2>
            <p className="text-sm text-gray-500">Clique em uma mesa para gerenciar pedidos</p>
          </div>
          <button onClick={() => { setRefreshing(true); carregar(); }}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-primary-600' : 'text-gray-500'} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.entries(STATUS_CONFIG) as [MesaStatus, typeof STATUS_CONFIG[MesaStatus] ][]).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5">
              <span className={'w-3 h-3 rounded-full ' + cfg.bg} />
              <span className="text-sm text-gray-600 dark:text-gray-400">{cfg.label}</span>
              <span className="text-sm font-bold">{counts[key]}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input type="text" placeholder="Nome da nova mesa (ex: 1, 2, VIP...)" value={novaMesa}
            maxLength={20} onChange={e => setNovaMesa(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && criarMesa()}
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40" />
          <Button size="sm" onClick={criarMesa} className="gap-1"><Plus size={15} /> Adicionar</Button>
        </div>

        {mesas.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Table2 size={48} className="mx-auto mb-4 opacity-40" />
            <p className="font-medium">Nenhuma mesa cadastrada</p>
            <p className="text-sm mt-1">Adicione mesas acima para comecar</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {mesas.map(mesa => (
              <MesaCard key={mesa.id} mesa={mesa} onClick={() => setMesaSelecionada(mesa)} />
            ))}
          </div>
        )}

        {mesaSelecionada && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/30" onClick={fecharPainel} />
            <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 shadow-xl border-l border-gray-200 dark:border-gray-800 overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className={'w-3 h-3 rounded-full ' + STATUS_CONFIG[mesaSelecionada.status].bg} />
                  <div>
                    <h3 className="font-bold text-lg">Mesa {mesaSelecionada.nome}</h3>
                    <span className="text-xs text-gray-500">{STATUS_CONFIG[mesaSelecionada.status].label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setRenameId(mesaSelecionada.id); setRenameVal(''); }}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Pencil size={15} className="text-gray-400" />
                  </button>
                  <button onClick={() => liberarMesa(mesaSelecionada.id)}
                    className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20">
                    <CheckCircle2 size={15} className="text-green-500" />
                  </button>
                  <button onClick={() => deletarMesa(mesaSelecionada.id)}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 size={15} className="text-red-400" />
                  </button>
                  <button onClick={fecharPainel}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {renameId === mesaSelecionada.id && (
                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex gap-2">
                  <input type="text" defaultValue={mesaSelecionada.nome} maxLength={20} autoFocus
                    onChange={e => setRenameVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') renomear(mesaSelecionada.id); if (e.key === 'Escape') setRenameId(null); }}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40" />
                  <Button size="sm" onClick={() => renomear(mesaSelecionada.id)}>Salvar</Button>
                </div>
              )}

              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Status da mesa</p>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.entries(STATUS_CONFIG) as [MesaStatus, any][]).map(([key, cfg]) => (
                    <button key={key} onClick={() => mudarStatus(mesaSelecionada.id, key)}
                      className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-all ' + (
                        mesaSelecionada.status === key
                          ? cfg.bg + ' ' + cfg.text + ' ring-2 ring-offset-1 ring-gray-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      )}>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-5 py-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Pedidos ativos ({mesaSelecionada.pedidos.length})
                  </p>
                  {mesaSelecionada.status !== 'DISPONIVEL' && (
                    <button onClick={abrirNovoPedido}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
                      <Plus size={13} /> Novo pedido
                    </button>
                  )}
                </div>

                {mesaSelecionada.pedidos.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Receipt size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum pedido ativo</p>
                    <button onClick={abrirNovoPedido}
                      className="mt-2 text-xs text-primary-600 hover:underline">Criar pedido</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mesaSelecionada.pedidos.map(pedido => (
                      <div key={pedido.id}
                        className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={'text-[10px] font-semibold px-1.5 py-0.5 rounded-full ' + PEDIDO_STATUS_COLOR[pedido.status]}>
                            {PEDIDO_STATUS_LABEL[pedido.status]}
                          </span>
                          <span className="text-xs text-gray-400">{calcularTempo(pedido.createdAt)}</span>
                        </div>
                        {pedido.itens.map(item => (
                          <div key={item.id} className="flex justify-between text-xs text-gray-600 dark:text-gray-300 py-0.5">
                            <span>{item.quantidade}x {item.nome}</span>
                            <span>{formatCurrency(item.total)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm font-bold mt-1.5 pt-1.5 border-t border-gray-200 dark:border-gray-700">
                          <span>Total</span>
                          <span>{formatCurrency(pedido.total)}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-[10px] text-gray-400">Gerenciar no Kanban de pedidos</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showNovoPedido && mesaSelecionada && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40" onClick={fecharPainel}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto space-y-3" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold">Novo pedido - Mesa {mesaSelecionada.nome}</h3>
                <button onClick={fecharPainel} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X size={16} /></button>
              </div>
              <input type="text" placeholder="Nome do cliente (opcional)" value={nomeCliente}
                onChange={e => setNomeCliente(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40" />
              <div className="flex gap-2 mb-2">
                <Search size={15} className="text-gray-400 mt-2.5" />
                <input type="text" placeholder="Buscar produto..." value={busca}
                  onChange={e => setBusca(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40" />
              </div>
              <div className="max-h-28 overflow-y-auto space-y-1 border rounded-xl p-2">
                {produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase())).map(p => (
                  <button key={p.id} onClick={() => addItem(p)}
                    className="w-full flex justify-between items-center px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm text-left">
                    <span>{p.nome}</span>
                    <span className="text-xs text-gray-500">{formatCurrency(p.preco)}</span>
                  </button>
                ))}
                {produtos.length === 0 && <p className="text-xs text-gray-400 text-center py-3">Nenhum produto</p>}
              </div>
              {itens.length > 0 && (
                <div className="border rounded-xl p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500">Itens</p>
                  {itens.map(item => (
                    <div key={item.produtoId} className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setItens(prev => prev.map(i => i.produtoId === item.produtoId ? { ...i, quantidade: Math.max(0, i.quantidade - 1) } : i).filter(i => i.quantidade > 0))}
                          className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">-</button>
                        <span className="w-5 text-center text-xs font-medium">{item.quantidade}</span>
                        <button onClick={() => setItens(prev => prev.map(i => i.produtoId === item.produtoId ? { ...i, quantidade: i.quantidade + 1 } : i))}
                          className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">+</button>
                        <span className="ml-1">{item.nome}</span>
                      </div>
                      <span className="text-xs text-gray-500">{formatCurrency(item.preco * item.quantidade)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold pt-2 border-t">
                    <span>Total</span>
                    <span>{formatCurrency(itens.reduce((s, i) => s + i.preco * i.quantidade, 0))}</span>
                  </div>
                </div>
              )}
              <textarea placeholder="Observacao" value={obs} rows={2}
                onChange={e => setObs(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 resize-none" />
              <button onClick={criarPedido}
                className="w-full py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-colors">
                Criar Pedido
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
