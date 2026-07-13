'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loading } from '@/components/shared/loading';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Trash2, Edit3, X, Truck, Phone, Bike, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function EntregadoresPage() {
  const { user } = useAuth();
  const [entregadores, setEntregadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: '', telefone: '', diaria: '', valorPorEntrega: '' });

  const fetchData = async () => {
    const vendedorId = user?.vendedor?.id;
    if (!vendedorId) return;
    try {
      const res = await api.get(`/api/entregadores/stats/vendedor/${vendedorId}`);
      setEntregadores(res.data);
    } catch { toast.error('Erro ao carregar entregadores');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (user?.vendedor?.id) fetchData(); }, [user]);

  const resetForm = () => { setForm({ nome: '', telefone: '', diaria: '', valorPorEntrega: '' }); setEditingId(null); };

  const openEdit = (e: any) => {
    setForm({ nome: e.nome, telefone: e.telefone || '', diaria: String(e.diaria), valorPorEntrega: String(e.valorPorEntrega) });
    setEditingId(e.id); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nome) { toast.error('Preencha o nome'); return; }
    const vendedorId = user?.vendedor?.id;
    if (!vendedorId) return;
    try {
      const payload = { vendedorId, nome: form.nome, telefone: form.telefone || undefined, diaria: Number(form.diaria) || 0, valorPorEntrega: Number(form.valorPorEntrega) || 0 };
      if (editingId) { await api.patch(`/api/entregadores/${editingId}`, payload); toast.success('Entregador atualizado'); }
      else { await api.post('/api/entregadores', payload); toast.success('Entregador criado'); }
      setShowForm(false); resetForm(); fetchData();
    } catch { toast.error('Erro ao salvar'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este entregador?')) return;
    try { await api.delete(`/api/entregadores/${id}`); toast.success('Entregador excluido'); fetchData(); }
    catch { toast.error('Erro ao excluir'); }
  };

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold">Entregadores</h2>
            <p className="text-gray-500">{entregadores.length} entregador(es) cadastrado(s)</p>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:opacity-90">
            <Plus size={18} /> Novo Entregador
          </button>
        </div>

{entregadores.length === 0 ? (
  <div className="text-center py-16 text-gray-400 bg-white dark:bg-gray-900 rounded-xl border">
    <Truck className="h-12 w-12 mx-auto mb-3" />
    <p className="font-medium text-gray-500">Nenhum entregador cadastrado</p>
  </div>
) : (
  <>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Total Entregadores</p>
        <p className="text-2xl font-bold mt-1">{entregadores.length}</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Ativos</p>
        <p className="text-2xl font-bold mt-1 text-green-600">{entregadores.filter((e: any) => e.ativo).length}</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Entregas no Mes</p>
        <p className="text-2xl font-bold mt-1">{entregadores.reduce((s: number, e: any) => s + (e.totalEntreguesMes || 0), 0)}</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Ganho Total no Mes</p>
        <p className="text-2xl font-bold mt-1 text-primary">{formatCurrency(entregadores.reduce((s: number, e: any) => s + (e.totalGanhoMes || 0), 0))}</p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {entregadores.map((e: any) => (
        <div key={e.id} className="bg-white dark:bg-gray-900 rounded-xl border p-5 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">{e.nome}</h3>
              {e.telefone && <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><Phone size={14} /> {e.telefone}</p>}
            </div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(e)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Edit3 size={16} /></button>
              <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
            </div>
          </div>
          <div className="space-y-1">
            <div>
              <span className="text-2xl font-bold text-primary">{formatCurrency(e.diaria)}</span>
              <span className="text-xs text-gray-400 ml-1">diaria</span>
            </div>
            <div>
              <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(e.valorPorEntrega)}</span>
              <span className="text-xs text-gray-400 ml-1">por entrega</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 flex items-center gap-1"><Bike size={14} /> Entregas no mes</span>
              <span className="font-semibold">{e.totalEntreguesMes || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 flex items-center gap-1"><DollarSign size={14} /> Ganho no mes</span>
              <span className="font-semibold text-primary">{formatCurrency(e.totalGanhoMes || 0)}</span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs ${e.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {e.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </>
)}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold">{editingId ? 'Editar Entregador' : 'Novo Entregador'}</h3>
                <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
                  <input type="text" placeholder="Nome do entregador" value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
                  <input type="text" placeholder="(11) 99999-9999" value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Diaria (R$)</label>
                    <input type="number" placeholder="0,00" min="0" step="0.01" value={form.diaria}
                      onChange={(e) => setForm({ ...form, diaria: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor por Entrega (R$)</label>
                    <input type="number" placeholder="0,00" min="0" step="0.01" value={form.valorPorEntrega}
                      onChange={(e) => setForm({ ...form, valorPorEntrega: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">Cancelar</button>
                <button onClick={handleSave}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90">
                  {editingId ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
