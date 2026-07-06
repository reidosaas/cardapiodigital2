'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loading } from '@/components/shared/loading';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Banknote } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FinanceiroPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.vendedor?.id) {
      api.get(`/api/financeiro/resumo/${user.vendedor.id}`)
        .then((res) => setData(res.data))
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  const chartData = [
    { name: 'Mes Passado', valor: Number(data?.faturamentoMesPassado || 0) },
    { name: 'Este Mes', valor: Number(data?.faturamentoMes || 0) },
    { name: 'Hoje', valor: Number(data?.faturamentoHoje || 0) },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Financeiro</h2>
          <p className="text-gray-500">Acompanhe suas financas</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Faturamento Hoje" value={formatCurrency(data?.faturamentoHoje || 0)} icon={TrendingUp} />
          <StatCard title="Faturamento do Mes" value={formatCurrency(data?.faturamentoMes || 0)} icon={DollarSign} />
          <StatCard title="Mes Anterior" value={formatCurrency(data?.faturamentoMesPassado || 0)} icon={TrendingDown} />
          <StatCard title="Comissao" value={formatCurrency(data?.comissao || 0)} icon={CreditCard} />
        </div>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Comparativo de Vendas</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="valor" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
