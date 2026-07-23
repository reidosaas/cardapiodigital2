'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loading } from '@/components/shared/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/api';
import { Truck, Package, DollarSign, Users, Store, Phone, Mail, Search, Pencil, Trash2, Ban, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Entregador {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  ativo: boolean;
  totalEntregasMes: number;
  totalEntreguesMes: number;
  totalGanhoMes: number;
  lojasStats: Array<{ lojaId: string; nomeLoja: string; entreguesMes: number; ganhoMes: number }>;
}

export default function AdminEntregadoresPage() {
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [editing, setEditing] = useState<Entregador | null>(null);
  const [editForm, setEditForm] = useState({ nome: '', email: '', telefone: '' });
  const [deleting, setDeleting] = useState<Entregador | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [resEnt, resStats] = await Promise.all([
        api.get('/api/admin/entregadores'),
        api.get('/api/admin/entregadores/stats'),
      ]);
      setEntregadores(resEnt.data);
      setStats(resStats.data);
    } catch {
      toast.error('Erro ao carregar entregadores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = entregadores.filter((e) =>
    e.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    e.email?.toLowerCase().includes(busca.toLowerCase()) ||
    e.telefone?.includes(busca)
  );

  const handleToggleActive = async (ent: Entregador) => {
    try {
      const res = await api.patch(`/api/admin/users/entregador/${ent.id}/toggle-active`);
      toast.success(res.data.mensagem);
      setEntregadores((prev) => prev.map((x) => x.id === ent.id ? { ...x, ativo: res.data.ativo } : x));
    } catch {
      toast.error('Erro ao alterar status');
    }
  };

  const handleEdit = (ent: Entregador) => {
    setEditForm({ nome: ent.nome, email: ent.email || '', telefone: ent.telefone || '' });
    setEditing(ent);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setActionLoading(true);
    try {
      await api.patch(`/api/admin/users/entregador/${editing.id}`, editForm);
      toast.success('Entregador atualizado');
      setEditing(null);
      await fetchData();
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
      await api.delete(`/api/admin/users/entregador/${deleting.id}`);
      toast.success('Entregador excluido');
      setDeleting(null);
      await fetchData();
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

        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, email ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="max-w-md"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white dark:bg-gray-900 rounded-xl border">
            <Truck className="h-12 w-12 mx-auto mb-3" />
            <p className="font-medium text-gray-500">Nenhum entregador encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((e) => (
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
                    <div className="flex items-center gap-2">
                      <Badge className={e.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {e.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(e)}>
                          <Pencil className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleActive(e)}>
                          {e.ativo
                            ? <Ban className="h-4 w-4 text-orange-500" />
                            : <CheckCircle className="h-4 w-4 text-green-500" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleting(e)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Package className="h-4 w-4 mx-auto mb-1 text-red-500" />
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
                <h3 className="text-lg font-bold">Editar Entregador</h3>
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
                <h3 className="text-lg font-bold mb-2">Excluir Entregador?</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Tem certeza que deseja excluir <strong>{deleting.nome}</strong>? Todos os vinculos e historico serao removidos. Esta acao nao pode ser desfeita.
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
