'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loading } from '@/components/shared/loading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/api';
import { Truck, Package, DollarSign, Users, Store, Phone, Mail } from 'lucide-react';

export default function AdminEntregadoresPage() {
  const [entregadores, setEntregadores] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/entregadores'),
      api.get('/api/admin/entregadores/stats'),
    ]).then(([resEnt, resStats]) => {
      setEntregadores(resEnt.data);
      setStats(resStats.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Entregadores</h2>
          <p className="text-gray-500">Todos os entregadores cadastrados no sistema</p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Total Entregadores</p>
              <p className="text-2xl font-bold mt-1">{stats.totalEntregadores}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Ativos</p>
              <p className="text-2xl font-bold mt-1 text-green-600">{stats.ativos}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Vinculos Loja</p>
              <p className="text-2xl font-bold mt-1 text-blue-600">{stats.vinculados}</p>
            </div>
          </div>
        )}

        {entregadores.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white dark:bg-gray-900 rounded-xl border">
            <Truck className="h-12 w-12 mx-auto mb-3" />
            <p className="font-medium text-gray-500">Nenhum entregador cadastrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entregadores.map((e) => (
              <Card key={e.id} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{e.nome}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {e.email}</span>
                        {e.telefone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {e.telefone}</span>}
                      </div>
                    </div>
                    <Badge className={e.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                      {e.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Package className="h-4 w-4 mx-auto mb-1 text-orange-500" />
                      <p className="text-lg font-bold">{e.totalEntregasMes}</p>
                      <p className="text-xs text-gray-400">Entregas Mes</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Truck className="h-4 w-4 mx-auto mb-1 text-green-500" />
                      <p className="text-lg font-bold">{e.totalEntreguesMes}</p>
                      <p className="text-xs text-gray-400">Entregues</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <DollarSign className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                      <p className="text-lg font-bold">R$ {Number(e.totalGanhoMes).toFixed(2)}</p>
                      <p className="text-xs text-gray-400">Ganho Mes</p>
                    </div>
                  </div>

                  {e.lojasStats.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase mb-2 flex items-center gap-1">
                        <Store className="h-3 w-3" /> Lojas Vinculadas
                      </p>
                      <div className="space-y-1">
                        {e.lojasStats.map((l: any) => (
                          <div key={l.lojaId} className="flex items-center justify-between text-sm py-1 px-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <span className="font-medium">{l.nomeLoja}</span>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{l.entreguesMes} entregas</span>
                              <span className="font-bold text-green-600">R$ {Number(l.ganhoMes).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
