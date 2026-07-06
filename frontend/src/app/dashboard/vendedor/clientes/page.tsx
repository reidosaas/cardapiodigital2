'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loading } from '@/components/shared/loading';
import { EmptyState } from '@/components/shared/empty-state';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatPhone, formatDate } from '@/lib/utils';
import { Users, Search, Mail, Phone } from 'lucide-react';

export default function ClientesPage() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    if (user?.vendedor?.id) {
      api.get(`/api/clientes/vendedor/${user.vendedor.id}`, { params: { busca } })
        .then((res) => setClientes(res.data))
        .finally(() => setLoading(false));
    }
  }, [user, busca]);

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Clientes</h2>
            <p className="text-gray-500">{clientes.length} clientes cadastrados</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Buscar cliente..." className="pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
        </div>

        {clientes.length === 0 ? (
          <EmptyState icon={Users} title="Nenhum cliente" description="Os clientes aparecerao apos o primeiro pedido" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientes.map((cliente: any) => (
              <div key={cliente.id} className="bg-white dark:bg-gray-900 rounded-xl border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary-100 text-primary-700">
                      {cliente.nome?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{cliente.nome}</h3>
                    <p className="text-xs text-gray-500">{cliente._count?.pedidos} pedidos</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  {cliente.telefone && (
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Phone size={12} /> {formatPhone(cliente.telefone)}
                    </p>
                  )}
                  {cliente.email && (
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Mail size={12} /> {cliente.email}
                    </p>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t flex justify-between items-center">
                  <span className="text-xs text-gray-400">{formatDate(cliente.createdAt)}</span>
                  <Badge variant="secondary">{formatCurrency(cliente.valorTotalGasto || 0)}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
