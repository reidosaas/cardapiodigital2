'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loading } from '@/components/shared/loading';
import { EmptyState } from '@/components/shared/empty-state';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatPhone, formatDate } from '@/lib/utils';
import { UserPlus, Search, Trash2, Users, Truck, Table2, ShoppingBag, TrendingUp, CheckCircle2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  const carregarLeads = () => {
    if (!user?.vendedor?.id) return;
    api.get(`/api/leads`)
      .then((res) => setLeads(res.data))
      .catch(() => toast.error('Erro ao carregar leads'))
      .finally(() => setLoading(false));
    api.get(`/api/leads/stats`)
      .then((res) => setStats(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    carregarLeads();
  }, [user]);

  const removerLead = async (id: string) => {
    try {
      await api.delete(`/api/leads/${id}`);
      setLeads((prev) => prev.filter((l) => l.id !== id));
      toast.success('Lead removido');
    } catch {
      toast.error('Erro ao remover lead');
    }
  };

  const leadsFiltrados = leads.filter((l) =>
    l.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    l.telefone?.includes(busca)
  );

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Leads</h2>
          <p className="text-gray-500">Painel de clientes e comportamento de pedidos</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                  <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalLeads ?? 0}</p>
                  <p className="text-xs text-gray-500">Total de Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.convertidos ?? 0}</p>
                  <p className="text-xs text-gray-500">Convertidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/30">
                  <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.taxaConversao ?? 0}%</p>
                  <p className="text-xs text-gray-500">Taxa Conversao</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-900/30">
                  <MessageCircle className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.porOrigem?.whatsapp ?? 0}</p>
                  <p className="text-xs text-gray-500">Via WhatsApp</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-2">Leads por tipo de pedido</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                      <Truck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Entrega</p>
                      <p className="text-xs text-gray-500">{stats?.entrega?.pedidos ?? 0} pedidos</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats?.entrega?.leads ?? 0}</p>
                </div>
                <p className="text-xs text-gray-400 mt-2">clientes que pediram entrega</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-sky-100 dark:bg-sky-900/30">
                      <Table2 className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Mesa</p>
                      <p className="text-xs text-gray-500">{stats?.mesa?.pedidos ?? 0} pedidos</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-sky-600 dark:text-sky-400">{stats?.mesa?.leads ?? 0}</p>
                </div>
                <p className="text-xs text-gray-400 mt-2">clientes que consumiram na mesa</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                      <ShoppingBag className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Retirada</p>
                      <p className="text-xs text-gray-500">{stats?.retirada?.pedidos ?? 0} pedidos</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats?.retirada?.leads ?? 0}</p>
                </div>
                <p className="text-xs text-gray-400 mt-2">clientes que pediram para retirar</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-lg font-semibold">Lista de Leads</h3>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar lead..."
              className="pl-9"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        {leadsFiltrados.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="Nenhum lead encontrado"
            description="Os leads aparecerão automaticamente quando clientes enviarem mensagens pelo WhatsApp"
          />
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left p-4 font-medium text-sm">Nome</th>
                    <th className="text-left p-4 font-medium text-sm">Telefone</th>
                    <th className="text-left p-4 font-medium text-sm">Origem</th>
                    <th className="text-left p-4 font-medium text-sm">Ultima Mensagem</th>
                    <th className="text-left p-4 font-medium text-sm">Status</th>
                    <th className="text-left p-4 font-medium text-sm">Data</th>
                    <th className="text-right p-4 font-medium text-sm">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {leadsFiltrados.map((lead: any) => (
                    <tr key={lead.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="p-4 font-medium">{lead.nome}</td>
                      <td className="p-4 text-gray-600">{formatPhone(lead.telefone)}</td>
                      <td className="p-4">
                        <Badge variant="outline">
                          {lead.origem === 'whatsapp' ? 'WhatsApp' : lead.origem}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-gray-500 max-w-[200px] truncate">
                        {lead.ultimaMensagem || '-'}
                      </td>
                      <td className="p-4">
                        {lead.converted ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Convertido
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Novo</Badge>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-500">
                        {formatDate(lead.createdAt)}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => {
                            if (confirm(`Remover ${lead.nome} da lista de leads?`)) {
                              removerLead(lead.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
