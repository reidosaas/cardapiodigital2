'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StatCard } from '@/components/shared/stat-card';
import { Loading } from '@/components/shared/loading';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingCart, DollarSign, Users, Package, Store, Power, PowerOff, Banknote, X } from 'lucide-react';
import { formatCurrency, getStatusColor, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function VendedorDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [fechando, setFechando] = useState(false);
  const [caixaModal, setCaixaModal] = useState<any>(null);

  const fetchDashboard = () => {
    if (user?.vendedor?.id) {
      api.get(`/api/vendedores/dashboard`)
        .then((res) => setData(res.data))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => { fetchDashboard(); }, [user]);

  const toggleLoja = async () => {
    if (!user?.vendedor?.id) return;
    setToggling(true);
    try {
      const res = await api.post(`/api/vendedores/${user.vendedor.id}/toggle-loja`);
      setData((prev: any) => ({ ...prev, lojaAberta: res.data.lojaAberta }));
      toast.success(res.data.lojaAberta ? 'Loja aberta!' : 'Loja fechada!');
    } catch {
      toast.error('Erro ao alterar status da loja');
    } finally {
      setToggling(false);
    }
  };

  const fecharCaixa = async () => {
    setFechando(true);
    try {
      const res = await api.post('/api/caixa/fechar');
      setCaixaModal(res.data);
      toast.success(res.data.mensagem);
      fetchDashboard();
    } catch {
      toast.error('Erro ao fechar caixa');
    } finally {
      setFechando(false);
    }
  };

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  const resumo = caixaModal?.caixa?.resumo;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="text-gray-500">Bem-vindo, {user?.nome}!</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fecharCaixa}
              disabled={fechando}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Banknote size={16} />
              {fechando ? 'Fechando...' : 'Fechar Caixa'}
            </Button>
            <Button
              onClick={toggleLoja}
              disabled={toggling}
              variant={data?.lojaAberta ? 'destructive' : 'default'}
              className="flex items-center gap-2"
            >
              {data?.lojaAberta ? <PowerOff size={16} /> : <Power size={16} />}
              {data?.lojaAberta ? 'Fechar Loja' : 'Abrir Loja'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Pedidos Hoje" value={data?.pedidosHoje || 0} icon={ShoppingCart} />
          <StatCard title="Faturamento do Mes" value={formatCurrency(data?.faturamentoMes || 0)} icon={DollarSign} />
          <StatCard title="Clientes" value={data?.totalClientes || 0} icon={Users} />
          <StatCard title="Produtos" value={data?.totalProdutos || 0} icon={Package} />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border p-6">
          <h3 className="text-lg font-semibold mb-4">Pedidos Recentes</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm text-gray-500">Cliente</th>
                  <th className="text-left p-3 text-sm text-gray-500">Total</th>
                  <th className="text-left p-3 text-sm text-gray-500">Status</th>
                  <th className="text-left p-3 text-sm text-gray-500">Data</th>
                </tr>
              </thead>
              <tbody>
                {data?.pedidosRecentes?.map((pedido: any) => (
                  <tr key={pedido.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-3 text-sm">{pedido.clienteNome || 'Anonimo'}</td>
                    <td className="p-3 text-sm font-medium">{formatCurrency(pedido.total)}</td>
                    <td className="p-3">
                      <Badge className={getStatusColor(pedido.status)}>{pedido.status}</Badge>
                    </td>
                    <td className="p-3 text-sm text-gray-500">{formatDate(pedido.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {caixaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setCaixaModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Resumo do Caixa</h2>
                  <button onClick={() => setCaixaModal(null)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                    <X size={20} />
                  </button>
                </div>

                <div className="text-center mb-6">
                  <p className="text-sm text-gray-500">
                    {new Date(caixaModal.caixa.dataInicio).toLocaleString('pt-BR')} ate{' '}
                    {new Date(caixaModal.caixa.dataFim).toLocaleString('pt-BR')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                    <p className="text-sm text-green-600 dark:text-green-400">Vendas</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(caixaModal.caixa.totalVendas)}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                    <p className="text-sm text-red-600 dark:text-red-400">Despesas</p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(caixaModal.caixa.totalDespesas)}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                    <p className="text-sm text-blue-600 dark:text-blue-400">Ganhos Entregas</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(caixaModal.caixa.totalGanhos)}</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center">
                    <p className="text-sm text-purple-600 dark:text-purple-400">Lucro Liquido</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {formatCurrency(Number(caixaModal.caixa.totalVendas) - Number(caixaModal.caixa.totalDespesas) - Number(caixaModal.caixa.totalGanhos))}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-lg font-bold">{caixaModal.caixa.totalPedidos}</p>
                    <p className="text-xs text-gray-500">Pedidos</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-lg font-bold">{caixaModal.caixa.totalEntregas}</p>
                    <p className="text-xs text-gray-500">Entregas</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-lg font-bold">{caixaModal.caixa.totalCancelados}</p>
                    <p className="text-xs text-gray-500">Cancelados</p>
                  </div>
                </div>

                {resumo?.despesas && resumo.despesas.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2 text-sm">Despesas</h3>
                    <div className="space-y-1">
                      {resumo.despesas.map((d: any) => (
                        <div key={d.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                          <span>{d.descricao} <span className="text-gray-400">({d.categoria})</span></span>
                          <span className="font-medium text-red-600">{formatCurrency(d.valor)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {resumo?.entregas && resumo.entregas.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2 text-sm">Entregas Realizadas</h3>
                    <div className="space-y-1">
                      {resumo.entregas.map((e: any) => (
                        <div key={e.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                          <span>{e.entregador}</span>
                          <span className="font-medium text-blue-600">{formatCurrency(e.ganho)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {resumo?.vendas && resumo.vendas.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 text-sm">Vendas</h3>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {resumo.vendas.map((v: any) => (
                        <div key={v.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                          <span>#{v.codigo ? String(v.codigo).padStart(8, '0') : v.id.slice(0, 8)} - {v.cliente}</span>
                          <span className="font-medium text-green-600">{formatCurrency(v.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
