'use client';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Download, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RelatoriosPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);

  const carregar = async () => {
    if (!user?.vendedor?.id) return;
    const fim = new Date();
    const inicio = new Date();
    inicio.setMonth(inicio.getMonth() - 1);
    const res = await api.get(`/api/relatorios/vendas/${user.vendedor.id}`, {
      params: { inicio: inicio.toISOString(), fim: fim.toISOString() },
    });
    setData(res.data);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Relatorios</h2>
            <p className="text-gray-500">Analise suas vendas</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={carregar}><BarChart3 className="mr-2 h-4 w-4" /> Carregar Dados</Button>
            <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Exportar</Button>
          </div>
        </div>

        {data && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500">Total de Vendas</p>
                  <p className="text-2xl font-bold">{formatCurrency(data.total)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500">Pedidos</p>
                  <p className="text-2xl font-bold">{data.totalPedidos}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500">Ticket Medio</p>
                  <p className="text-2xl font-bold">{formatCurrency(data.ticketMedio)}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Vendas por Dia</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(data.vendasPorDia || {}).map(([dia, valor]) => ({ dia, valor }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="dia" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="valor" fill="#6366f1" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
