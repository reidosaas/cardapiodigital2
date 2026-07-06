'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StatCard } from '@/components/shared/stat-card';
import { Loading } from '@/components/shared/loading';
import api from '@/lib/api';
import { Users, Store, ShoppingCart, DollarSign, TrendingUp, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/relatorios/admin/dashboard')
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Admin</h2>
          <p className="text-gray-500">Visao geral do sistema</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Usuarios" value={data?.totalUsers || 0} icon={Users} />
          <StatCard title="Vendedores" value={data?.totalVendedores || 0} icon={Store} />
          <StatCard title="Pedidos" value={data?.totalPedidos || 0} icon={ShoppingCart} />
          <StatCard title="Faturamento Total" value={`R$ ${Number(data?.totalFaturamento || 0).toFixed(2)}`} icon={DollarSign} />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border p-6">
          <h3 className="text-lg font-semibold mb-4">Pedidos por Status</h3>
          <div className="space-y-3">
            {data?.pedidosPorStatus?.map((item: any) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.status}</span>
                <span className="text-sm font-medium">{item._count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
