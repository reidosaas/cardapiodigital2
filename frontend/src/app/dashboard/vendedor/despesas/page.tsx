'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loading } from '@/components/shared/loading';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Trash2, TrendingDown, Wallet, Receipt, X, BarChart3, PiggyBank } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

const CATEGORIAS = ['Aluguel', 'Material', 'Salarios', 'Marketing', 'Utilidades', 'Alimentacao', 'Transporte', 'Outros'];
const CATEGORY_COLORS: Record<string, string> = {
  Aluguel: '#ef4444', Material: '#f97316', Salarios: '#eab308',
  Marketing: '#a855f7', Utilidades: '#06b6d4', Alimentacao: '#10b981',
  Transporte: '#3b82f6', Outros: '#6b7280',
};

export default function DespesasPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [despesas, setDespesas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ descricao: '', valor: '', categoria: '', data: '' });

  const fetchData = async () => {
    try {
      const [dashRes, listRes] = await Promise.all([
        api.get('/api/despesas/dashboard'),
        api.get('/api/despesas?limit=100'),
      ]);
      setDashboard(dashRes.data);
      setDespesas(listRes.data.items);
    } catch {
      toast.error('Erro ao carregar despesas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user?.vendedor?.id) fetchData(); }, [user]);

  const handleCreate = async () => {
    if (!form.descricao || !form.valor) { toast.error('Preencha descricao e valor'); return; }
    try {
      await api.post('/api/despesas', {
        descricao: form.descricao,
        valor: Number(form.valor),
        categoria: form.categoria || undefined,
        data: form.data || undefined,
      });
      toast.success('Despesa adicionada!');
      setShowForm(false);
      setForm({ descricao: '', valor: '', categoria: '', data: '' });
      fetchData();
    } catch {
      toast.error('Erro ao salvar despesa');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/despesas/${id}`);
      toast.success('Despesa removida');
      fetchData();
    } catch {
      toast.error('Erro ao remover despesa');
    }
  };

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  const totalMes = Number(dashboard?.totalMes) || 0;
  const totalGeral = Number(dashboard?.totalGeral) || 0;
  const categorias = dashboard?.porCategoria || [];
  const mediaPorCat = categorias.length > 0 ? totalMes / categorias.length : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold">Dashboard de Despesas</h2>
            <p className="text-gray-500">Visao geral dos gastos</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus size={16} /> Nova Despesa
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border p-5 col-span-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-red-100 dark:bg-red-900/20"><TrendingDown size={20} className="text-red-600" /></div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total do Mes</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalMes)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800"><Receipt size={20} className="text-gray-600" /></div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Geral</p>
                <p className="text-xl font-bold">{formatCurrency(totalGeral)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/20"><Wallet size={20} className="text-blue-600" /></div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Despesas no Mes</p>
                <p className="text-xl font-bold">{categorias.reduce((a: number, c: any) => a + c.quantidade, 0)} registros</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-green-100 dark:bg-green-900/20"><PiggyBank size={20} className="text-green-600" /></div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Media por Categoria</p>
                <p className="text-xl font-bold">{formatCurrency(mediaPorCat)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border p-6">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 size={18} className="text-gray-500" />
              <h3 className="text-lg font-semibold">Gastos por Categoria</h3>
            </div>
            {categorias.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Nenhuma despesa neste mes</p>
            ) : (
              <div className="space-y-4">
                {categorias.map((cat: any) => {
                  const pct = totalMes > 0 ? (Number(cat.total) / totalMes) * 100 : 0;
                  const color = CATEGORY_COLORS[cat.categoria] || '#6b7280';
                  return (
                    <div key={cat.categoria}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-sm font-medium">{cat.categoria}</span>
                          <span className="text-xs text-gray-400">({cat.quantidade}x)</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold">{formatCurrency(cat.total)}</span>
                          <span className="text-xs text-gray-400 ml-2">({pct.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Receipt size={18} className="text-gray-500" />
              <h3 className="text-lg font-semibold">Ultimas Despesas</h3>
            </div>
            <div className="space-y-3">
              {(dashboard?.ultimasDespesas || []).map((d: any) => (
                <div key={d.id} className="flex items-center justify-between py-2 border-b last:border-0 border-gray-100 dark:border-gray-800">
                  <div>
                    <p className="text-sm font-medium">{d.descricao}</p>
                    <p className="text-xs text-gray-400">{d.categoria || 'Sem categoria'} &middot; {new Date(d.data).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-600">{formatCurrency(d.valor)}</span>
                </div>
              ))}
              {(!dashboard?.ultimasDespesas || dashboard.ultimasDespesas.length === 0) && (
                <p className="text-sm text-gray-400 text-center py-4">Nenhuma despesa registrada</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border p-6">
          <h3 className="text-lg font-semibold mb-4">Todas as Despesas</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm text-gray-500">Descricao</th>
                  <th className="text-left p-3 text-sm text-gray-500">Categoria</th>
                  <th className="text-left p-3 text-sm text-gray-500">Valor</th>
                  <th className="text-left p-3 text-sm text-gray-500">Data</th>
                  <th className="text-right p-3 text-sm text-gray-500"></th>
                </tr>
              </thead>
              <tbody>
                {despesas.map((d) => (
                  <tr key={d.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-3 text-sm">{d.descricao}</td>
                    <td className="p-3 text-sm text-gray-500">{d.categoria || '-'}</td>
                    <td className="p-3 text-sm font-medium text-red-600">{formatCurrency(d.valor)}</td>
                    <td className="p-3 text-sm text-gray-500">{new Date(d.data).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {despesas.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-400 text-sm">Nenhuma despesa registrada</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Nova Despesa</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X size={18} /></button>
            </div>
            <input type="text" placeholder="Descricao *" value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input type="number" step="0.01" placeholder="Valor *" value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">Sem categoria</option>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="date" value={form.data}
              onChange={(e) => setForm({ ...form, data: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <button onClick={handleCreate}
              className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-colors">
              Salvar Despesa
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}