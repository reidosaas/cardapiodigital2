'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loading } from '@/components/shared/loading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function AgendaPage() {
  const { user } = useAuth();
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.vendedor?.id) {
      api.get(`/api/agendamentos/vendedor/${user.vendedor.id}`)
        .then((res) => setAgendamentos(res.data))
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Agenda</h2>
          <p className="text-gray-500">Gerencie seus agendamentos e reservas</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Calendar size={18} /> Proximos Agendamentos</h3>
              <div className="space-y-3">
                {agendamentos.slice(0, 10).map((ag: any) => (
                  <div key={ag.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{ag.clienteNome}</p>
                      <p className="text-xs text-gray-500">{ag.tipo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{new Date(ag.data).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500">{ag.hora}h</p>
                    </div>
                    <Badge variant={ag.status === 'CONFIRMADO' ? 'success' : ag.status === 'CANCELADO' ? 'danger' : 'warning'}>
                      {ag.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Resumo</h3>
              <div className="space-y-3">
                {[
                  { icon: Calendar, label: 'Hoje', value: agendamentos.filter((a: any) => new Date(a.data).toDateString() === new Date().toDateString()).length },
                  { icon: Clock, label: 'Pendentes', value: agendamentos.filter((a: any) => a.status === 'PENDENTE').length },
                  { icon: CheckCircle, label: 'Confirmados', value: agendamentos.filter((a: any) => a.status === 'CONFIRMADO').length },
                  { icon: XCircle, label: 'Cancelados', value: agendamentos.filter((a: any) => a.status === 'CANCELADO').length },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-500">{item.label}</span>
                    </div>
                    <span className="font-medium text-sm">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
