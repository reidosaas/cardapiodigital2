'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loading } from '@/components/shared/loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Search } from 'lucide-react';

export default function AdminVendedores() {
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/vendedores')
      .then((res) => setVendedores(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Vendedores</h2>
            <p className="text-gray-500">Gerencie todos os vendedores do sistema</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">Loja</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">Proprietario</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">Email</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-500">Produtos</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-500">Pedidos</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {vendedores.map((v: any) => (
                  <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-4 text-sm font-medium">{v.nomeLoja}</td>
                    <td className="p-4 text-sm">{v.user?.nome}</td>
                    <td className="p-4 text-sm text-gray-500">{v.user?.email}</td>
                    <td className="p-4 text-sm text-center">{v._count?.produtos}</td>
                    <td className="p-4 text-sm text-center">{v._count?.pedidos}</td>
                    <td className="p-4 text-center">
                      <Badge variant={v.ativo ? 'success' : 'danger'}>
                        {v.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-gray-500">{formatDate(v.createdAt)}</td>
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
