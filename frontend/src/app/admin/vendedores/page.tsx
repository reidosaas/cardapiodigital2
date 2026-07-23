'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loading } from '@/components/shared/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Search, Pencil, Trash2, Ban, CheckCircle, Eye, X, Store, Users, Package } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Vendedor {
  id: string;
  vendedorId: string;
  nome: string;
  email: string;
  telefone: string;
  loja: string;
  slug: string;
  ativo: boolean;
  produtos: number;
  pedidos: number;
  createdAt: string;
}

export default function AdminVendedores() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [selected, setSelected] = useState<Vendedor | null>(null);
  const [editing, setEditing] = useState<Vendedor | null>(null);
  const [editForm, setEditForm] = useState({ nome: '', email: '', telefone: '', nomeLoja: '' });
  const [deleting, setDeleting] = useState<Vendedor | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchVendedores = async () => {
    try {
      const res = await api.get('/api/admin/users/vendedores');
      setVendedores(res.data);
    } catch {
      toast.error('Erro ao carregar vendedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVendedores(); }, []);

  const filtered = vendedores.filter((v) =>
    v.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    v.email?.toLowerCase().includes(busca.toLowerCase()) ||
    v.loja?.toLowerCase().includes(busca.toLowerCase()) ||
    v.telefone?.includes(busca)
  );

  const totalAtivos = vendedores.filter((v) => v.ativo).length;
  const totalInativos = vendedores.filter((v) => !v.ativo).length;

  const handleToggleActive = async (v: Vendedor) => {
    try {
      const res = await api.patch(`/api/admin/users/vendedor/${v.id}/toggle-active`);
      toast.success(res.data.mensagem);
      setVendedores((prev) => prev.map((x) => x.id === v.id ? { ...x, ativo: res.data.ativo } : x));
      if (selected?.id === v.id) setSelected((prev) => prev ? { ...prev, ativo: res.data.ativo } : null);
    } catch {
      toast.error('Erro ao alterar status');
    }
  };

  const handleEdit = (v: Vendedor) => {
    setEditForm({ nome: v.nome, email: v.email, telefone: v.telefone, nomeLoja: v.loja });
    setEditing(v);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setActionLoading(true);
    try {
      await api.patch(`/api/admin/users/vendedor/${editing.id}`, editForm);
      toast.success('Vendedor atualizado');
      setEditing(null);
      await fetchVendedores();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao atualizar');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setActionLoading(true);
    try {
      await api.delete(`/api/admin/users/vendedor/${deleting.id}`);
      toast.success('Vendedor excluido');
      setDeleting(null);
      setSelected(null);
      await fetchVendedores();
    } catch {
      toast.error('Erro ao excluir');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Vendedores</h2>
          <p className="text-gray-500">Gerencie todos os vendedores do sistema</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
            <Users className="h-5 w-5 text-blue-500 mb-1" />
            <p className="text-2xl font-bold">{vendedores.length}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
            <CheckCircle className="h-5 w-5 text-green-500 mb-1" />
            <p className="text-2xl font-bold text-green-600">{totalAtivos}</p>
            <p className="text-xs text-gray-500">Ativos</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
            <Ban className="h-5 w-5 text-red-500 mb-1" />
            <p className="text-2xl font-bold text-red-600">{totalInativos}</p>
            <p className="text-xs text-gray-500">Bloqueados</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, email, loja ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border overflow-x-auto">
          <table className="w-full min-w-[850px]">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Loja</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Proprietario</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Email</th>
                <th className="text-center p-4 text-sm font-medium text-gray-500">Produtos</th>
                <th className="text-center p-4 text-sm font-medium text-gray-500">Pedidos</th>
                <th className="text-center p-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Criado em</th>
                <th className="text-center p-4 text-sm font-medium text-gray-500">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-gray-400" />
                      {v.loja}
                    </div>
                  </td>
                  <td className="p-4 text-sm">{v.nome}</td>
                  <td className="p-4 text-sm text-gray-500">{v.email}</td>
                  <td className="p-4 text-sm text-center">{v.produtos}</td>
                  <td className="p-4 text-sm text-center">{v.pedidos}</td>
                  <td className="p-4 text-center">
                    <Badge variant={v.ativo ? 'success' : 'danger'}>
                      {v.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-gray-500">{formatDate(v.createdAt)}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(v)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(v)}>
                        <Pencil className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleActive(v)}>
                        {v.ativo
                          ? <Ban className="h-4 w-4 text-orange-500" />
                          : <CheckCircle className="h-4 w-4 text-green-500" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleting(v)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    Nenhum vendedor encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalhes */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Detalhes do Vendedor</h3>
                <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Store className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">{selected.loja}</p>
                    <p className="text-xs text-gray-500">Loja</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">{selected.nome}</p>
                    <p className="text-xs text-gray-500">Proprietario</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm">@</span>
                  <div>
                    <p className="text-sm font-medium">{selected.email}</p>
                    <p className="text-xs text-gray-500">Email</p>
                  </div>
                </div>
                {selected.telefone && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm">📞</span>
                    <div>
                      <p className="text-sm font-medium">{selected.telefone}</p>
                      <p className="text-xs text-gray-500">Telefone</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">{selected.produtos} produtos / {selected.pedidos} pedidos</p>
                    <p className="text-xs text-gray-500">Produtos e Pedidos</p>
                  </div>
                </div>
                <div className="pt-2">
                  <Badge className={selected.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                    {selected.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => { setSelected(null); handleEdit(selected); }}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setSelected(null); handleToggleActive(selected); }}>
                  {selected.ativo ? <Ban className="h-3.5 w-3.5 mr-1" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                  {selected.ativo ? 'Bloquear' : 'Desbloquear'}
                </Button>
                <Button size="sm" variant="outline" className="text-red-600 border-red-300" onClick={() => { setSelected(null); setDeleting(selected); }}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Editar */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setEditing(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Editar Vendedor</h3>
                <Button variant="ghost" size="icon" onClick={() => setEditing(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome do Proprietario</label>
                  <Input value={editForm.nome} onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Nome da Loja</label>
                  <Input value={editForm.nomeLoja} onChange={(e) => setEditForm({ ...editForm, nomeLoja: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Telefone</label>
                  <Input value={editForm.telefone} onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button variant="outline" onClick={() => setEditing(null)} className="flex-1">Cancelar</Button>
                <Button onClick={handleSaveEdit} disabled={actionLoading} className="flex-1">
                  {actionLoading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Confirmar Exclusao */}
      <AnimatePresence>
        {deleting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setDeleting(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-sm shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <Trash2 className="h-12 w-12 mx-auto mb-3 text-red-500" />
                <h3 className="text-lg font-bold mb-2">Excluir Vendedor?</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Tem certeza que deseja excluir <strong>{deleting.loja}</strong> ({deleting.nome})? Todos os dados da loja serao removidos. Esta acao nao pode ser desfeita.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setDeleting(null)} className="flex-1" disabled={actionLoading}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={actionLoading} className="flex-1">
                    {actionLoading ? 'Excluindo...' : 'Excluir'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
