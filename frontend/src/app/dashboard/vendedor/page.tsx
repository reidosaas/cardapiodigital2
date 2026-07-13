'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StatCard } from '@/components/shared/stat-card';
import { Loading } from '@/components/shared/loading';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingCart, DollarSign, Users, Package, Store, Power, PowerOff } from 'lucide-react';
import { formatCurrency, getStatusColor, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function VendedorDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

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

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="text-gray-500">Bem-vindo, {user?.nome}!</p>
          </div>
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
    </DashboardLayout>
  );
}
