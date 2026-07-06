'use client';
import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loading } from '@/components/shared/loading';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import { Clock, Package, Check, X, Utensils, Bike, ChefHat, ClipboardList, Phone, MapPin, MessageSquare, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

type OrderStatus = 'PENDENTE' | 'CONFIRMADO' | 'PREPARANDO' | 'SAIU_PARA_ENTREGA' | 'ENTREGUE' | 'CANCELADO';

interface Order {
  id: string;
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

  const carregarPedidos = useCallback(async () => {
    if (!user?.vendedor?.id) return;
    try {
      const res = await api.get(`/api/pedidos/vendedor/${user.vendedor.id}`, { params: { status: undefined } });
      setPedidos(res.data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    carregarPedidos();
  }, [carregarPedidos]);

  useEffect(() => {
    const interval = setInterval(carregarPedidos, 30000);
    return () => clearInterval(interval);
  }, [carregarPedidos]);

  const atualizar = async () => {
    setAtualizando(true);
    await carregarPedidos();
    setAtualizando(false);
    toast.success('Pedidos atualizados');
  };

  const updateStatus = async (id: string, status: OrderStatus) => {
    try {
      await api.patch(`/api/pedidos/${id}/status`, { status });
      setPedidos(pedidos.map((p) => p.id === id ? { ...p, status } : p));
      toast.success('Status atualizado');
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Pedidos</h2>
            <p className="text-gray-500">Acompanhe e gerencie seus pedidos em tempo real</p>
          </div>
          <Button variant="outline" size="sm" onClick={atualizar} disabled={atualizando}>
            <RefreshCw className={`mr-2 h-4 w-4 ${atualizando ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {colunas.map((coluna) => {
            const Icon = coluna.icon;
            const lista = pedidosPorStatus(coluna.key);
            return (
              <div key={coluna.key} className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 min-h-[300px]">
                <div className={`sticky top-0 z-10 ${coluna.color} text-white px-3 py-2 rounded-t-xl flex items-center justify-between`}>
                  <div className="flex items-center gap-1.5 text-sm font-semibold">
                    <Icon size={14} />
                    {coluna.label}
                  </div>
                  <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">{lista.length}</span>
                </div>

                <div className="p-2 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {lista.length === 0 && (
                    <div className="text-center py-6 text-gray-400 text-xs">
                      <Package size={24} className="mx-auto mb-1 opacity-50" />
                      Nenhum pedido
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
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-3 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setExpandido(expandido === pedido.id ? null : pedido.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm truncate">{pedido.clienteNome || 'Anonimo'}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                              <Clock size={11} />
                              <span>{calcularTempo(pedido.createdAt)}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <p className="font-bold text-sm">{formatCurrency(pedido.total)}</p>
                            <p className="text-xs text-gray-400">#{pedido.id.slice(0, 6)}</p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          {pedido.itens.slice(0, expandido === pedido.id ? pedido.itens.length : 2).map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600 dark:text-gray-300 truncate">
                                <span className="font-medium">{item.quantidade}x</span> {item.nome}
                              </span>
                              <span className="text-gray-500 flex-shrink-0 ml-2">{formatCurrency(item.total)}</span>
                            </div>
                          ))}
                          {pedido.itens.length > 2 && expandido !== pedido.id && (
                            <button className="text-xs text-primary hover:underline mt-1">+{pedido.itens.length - 2} itens</button>
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
                            {pedido.observacao && (
                              <div className="flex items-start gap-1">
                                <MessageSquare size={11} className="mt-0.5" />
                                <span>{pedido.observacao}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-1.5 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
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
                            <Button size="sm" className="flex-1 h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); updateStatus(pedido.id, 'SAIU_PARA_ENTREGA'); }}>
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
      </div>
    </DashboardLayout>
  );
}
