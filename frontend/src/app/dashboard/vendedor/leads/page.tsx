'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loading } from '@/components/shared/loading';
import { EmptyState } from '@/components/shared/empty-state';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatPhone, formatDate } from '@/lib/utils';
import { UserPlus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  const carregarLeads = () => {
    if (!user?.vendedor?.id) return;
    const vendedorId = user.vendedor.id;
    api.get(`/api/leads`)
      .then((res) => setLeads(res.data))
      .catch(() => toast.error('Erro ao carregar leads'))
      .finally(() => setLoading(false));
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Leads</h2>
            <p className="text-gray-500">{leads.length} leads capturados</p>
          </div>
          <div className="relative w-64">
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
