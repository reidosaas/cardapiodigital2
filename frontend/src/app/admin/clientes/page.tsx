'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loading } from '@/components/shared/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/api';
import { Users, Search, ShoppingBag, Phone, Mail, Calendar, Eye, X, Pencil, Trash2, Ban, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  ativo: boolean;
  createdAt: string;
}

export default function AdminClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [selected, setSelected] = useState<Cliente | null>(null);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [editForm, setEditForm] = useState({ nome: '', email: '', telefone: '' });
  const [deleting, setDeleting] = useState<Cliente | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchClientes = async () => {
    try {
      const res = await api.get('/api/admin/users/clientes');
      setClientes(res.data);
    } catch {
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClientes(); }, []);

  const filtered = clientes.filter((c) =>
    c.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    c.email?.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone?.includes(busca)
  );

  const totalAtivos = clientes.filter((c) => c.ativo).length;
  const totalInativos = clientes.filter((c) => !c.ativo).length;

  const handleToggleActive = async (cliente: Cliente) => {
    try {
      const res = await api.patch(`/api/admin/users/cliente/${cliente.id}/toggle-active`);
      toast.success(res.data.mensagem);
      setClientes((prev) => prev.map((c) => c.id === cliente.id ? { ...c, ativo: res.data.ativo } : c));
      if (selected?.id === cliente.id) setSelected((prev) => prev ? { ...prev, ativo: res.data.ativo } : null);
    } catch {
      toast.error('Erro ao alterar status');
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditForm({ nome: cliente.nome, email: cliente.email, telefone: cliente.telefone });
    setEditing(cliente);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setActionLoading(true);
    try {
      await api.patch(`/api/admin/users/cliente/${editing.id}`, editForm);
      toast.success('Cliente atualizado');
      setEditing(null);
      await fetchClientes();
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
      await api.delete(`/api/admin/users/cliente/${deleting.id}`);
      toast.success('Cliente excluido');
      setDeleting(null);
      setSelected(null);
      await fetchClientes();
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
          <h2 className="text-2xl font-bold">Clientes Cadastrados</h2>
          <p className="text-gray-500">{clientes.length} clientes no sistema</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-1 text-blue-500" />
              <p className="text-2xl font-bold">{clientes.length}</p>
              <p className="text-xs text-gray-500">Total Clientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <ShoppingBag className="h-6 w-6 mx-auto mb-1 text-green-500" />
              <p className="text-2xl font-bold">{totalAtivos}</p>
              <p className="text-xs text-gray-500">Ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-1 text-red-500" />
              <p className="text-2xl font-bold">{totalInativos}</p>
              <p className="text-xs text-gray-500">Inativos</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, email ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Nome</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Email</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Telefone</th>
                <th className="text-center p-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Cadastro</th>
                <th className="text-center p-4 text-sm font-medium text-gray-500">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-4 text-sm font-medium">{cliente.nome}</td>
                  <td className="p-4 text-sm text-gray-500">{cliente.email || '-'}</td>
                  <td className="p-4 text-sm text-gray-500">{cliente.telefone || '-'}</td>
                  <td className="p-4 text-center">
                    <Badge className={cliente.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {cliente.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(cliente.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(cliente)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(cliente)}>
                        <Pencil className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleActive(cliente)}>
                        {cliente.ativo
                          ? <Ban className="h-4 w-4 text-orange-500" />
                          : <CheckCircle className="h-4 w-4 text-green-500" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleting(cliente)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Nenhum cliente encontrado
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
                <h3 className="text-lg font-bold">Detalhes do Cliente</h3>
                <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">{selected.nome}</p>
                    <p className="text-xs text-gray-500">Nome</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">{selected.email || 'Nao informado'}</p>
                    <p className="text-xs text-gray-500">Email</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">{selected.telefone || 'Nao informado'}</p>
                    <p className="text-xs text-gray-500">Telefone</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">{new Date(selected.createdAt).toLocaleDateString('pt-BR')}</p>
                    <p className="text-xs text-gray-500">Data de Cadastro</p>
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
                <h3 className="text-lg font-bold">Editar Cliente</h3>
                <Button variant="ghost" size="icon" onClick={() => setEditing(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome</label>
                  <Input value={editForm.nome} onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })} />
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
                <h3 className="text-lg font-bold mb-2">Excluir Cliente?</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Tem certeza que deseja excluir <strong>{deleting.nome}</strong>? Esta acao nao pode ser desfeita.
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
