'use client';
import { useState, useEffect } from 'react';
import { ClipboardList, Store, Package } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

const statusColors: Record<string, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-700',
  CONFIRMADO: 'bg-blue-100 text-blue-700',
  PREPARANDO: 'bg-red-100 text-red-700',
  SAIU_ENTREGA: 'bg-purple-100 text-purple-700',
  ENTREGUE: 'bg-green-100 text-green-700',
  CANCELADO: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  PREPARANDO: 'Preparando',
  SAIU_ENTREGA: 'Saiu para entrega',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

export default function ClientePedidos() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token_cliente');
    if (!token) return;
    api.get('/api/cliente-global/pedidos', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setPedidos(res.data))
      .catch(() => toast.error('Erro ao carregar pedidos'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-10 text-gray-400">Carregando...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Meus Pedidos</h1>

      {pedidos.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <ClipboardList className="h-12 w-12 mx-auto mb-3" />
          <p>Nenhum pedido realizado</p>
        </div>
      )}

      <div className="space-y-4">
        {pedidos.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {p.vendedor?.logoUrl ? (
                  <img src={p.vendedor.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Store className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900 text-sm">{p.vendedor?.nomeLoja || 'Loja'}</p>
                  <p className="text-xs text-gray-500">Pedido #{p.codigo}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[p.status] || 'bg-gray-100 text-gray-600'}`}>
                {statusLabels[p.status] || p.status}
              </span>
            </div>

            <div className="border-t border-gray-100 pt-2">
              {p.itens?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span className="text-gray-600">{item.quantidade}x {item.nome}</span>
                  <span className="text-gray-900 font-medium">R$ {Number(item.total).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-2 flex justify-between">
              <span className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString('pt-BR')}</span>
              <span className="font-bold text-gray-900">R$ {Number(p.total).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
