'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loading } from '@/components/shared/loading';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Trash2, Edit3, X, Calendar, Package, BadgePercent } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function CuponsPage() {
  const { user } = useAuth();
  const [cupons, setCupons] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    codigo: '',
    valor: '',
    descricao: '',
    usoMaximo: '100',
    expiraEm: '',
    produtoIds: [] as string[],
  });

  const fetchData = async () => {
    const vendedorId = user?.vendedor?.id;
    if (!vendedorId) return;
    try {
      const [cupRes, prodRes] = await Promise.all([
        api.get(`/api/cupons/vendedor/${vendedorId}`),
        api.get(`/api/produtos/vendedor/${vendedorId}`),
      ]);
      setCupons(cupRes.data);
      setProdutos(prodRes.data);
    } catch {
      toast.error('Erro ao carregar cupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user?.vendedor?.id) fetchData(); }, [user]);

  const resetForm = () => {
    setForm({ codigo: '', valor: '', descricao: '', usoMaximo: '100', expiraEm: '', produtoIds: [] });
    setEditingId(null);
  };

  const openEdit = (cupom: any) => {
    setForm({
      codigo: cupom.codigo,
      valor: String(cupom.valor),
      descricao: cupom.descricao || '',
      usoMaximo: String(cupom.usoMaximo),
      expiraEm: cupom.expiraEm ? cupom.expiraEm.slice(0, 10) : '',
      produtoIds: cupom.produtos?.map((p: any) => p.id) || [],
    });
    setEditingId(cupom.id);
    setShowForm(true);
  };

  const toggleProduto = (id: string) => {
    setForm((prev) => ({
      ...prev,
      produtoIds: prev.produtoIds.includes(id)
        ? prev.produtoIds.filter((p) => p !== id)
        : [...prev.produtoIds, id],
    }));
  };

  const handleSave = async () => {
    if (!form.codigo || !form.valor) { toast.error('Preencha codigo e % de desconto'); return; }
    try {
      const vendedorId = user?.vendedor?.id;
      if (!vendedorId) return;
      const payload = {
        vendedorId,
        codigo: form.codigo,
        tipo: 'porcentagem',
        valor: Number(form.valor),
        descricao: form.descricao || undefined,
        usoMaximo: Number(form.usoMaximo),
        expiraEm: form.expiraEm ? new Date(form.expiraEm).toISOString() : undefined,
        produtoIds: form.produtoIds,
      };

      if (editingId) {
        await api.patch(`/api/cupons/${editingId}`, payload);
        toast.success('Cupom atualizado');
      } else {
        await api.post('/api/cupons', payload);
        toast.success('Cupom criado');
      }
      setShowForm(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Erro ao salvar cupom');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cupom?')) return;
    try {
      await api.delete(`/api/cupons/${id}`);
      toast.success('Cupom excluido');
      fetchData();
    } catch {
      toast.error('Erro ao excluir cupom');
    }
  };

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold">Cupons</h2>
            <p className="text-gray-500">Gerencie seus cupons de desconto</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={18} />
            Novo Cupom
          </button>
        </div>

        {cupons.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white dark:bg-gray-900 rounded-xl border">
            <BadgePercent className="h-12 w-12 mx-auto mb-3" />
            <p className="font-medium text-gray-500">Nenhum cupom cadastrado</p>
            <p className="text-sm mt-1">Crie cupons de desconto para seus clientes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cupons.map((cupom: any) => {
              const expirado = cupom.expiraEm && new Date(cupom.expiraEm) < new Date();
              const esgotado = cupom.usosAtuais >= cupom.usoMaximo;
              const inativo = !cupom.ativo || expirado || esgotado;

              return (
                <div key={cupom.id} className={`bg-white dark:bg-gray-900 rounded-xl border p-5 hover:shadow-lg transition-all ${inativo ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{cupom.codigo}</h3>
                      {cupom.descricao && <p className="text-sm text-gray-500 mt-0.5">{cupom.descricao}</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(cupom)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleDelete(cupom.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl font-bold text-primary">{Number(cupom.valor)}%</span>
                    <span className="text-sm text-gray-400">OFF</span>
                  </div>

                  <div className="space-y-1.5 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Package size={14} />
                      <span>{cupom.produtos?.length || 0} produto(s)</span>
                    </div>
                    {cupom.expiraEm && (
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span className={expirado ? 'text-red-500' : ''}>
                          {expirado ? 'Expirado em' : 'Valido ate'} {formatDate(cupom.expiraEm)}
                        </span>
                      </div>
                    )}
                    {cupom.produtos?.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Ver produtos</summary>
                        <div className="mt-1 space-y-0.5">
                          {cupom.produtos.map((p: any) => (
                            <span key={p.id} className="block text-xs text-gray-500">{p.nome}</span>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400">
                    <span>Usos: {cupom.usosAtuais}/{cupom.usoMaximo}</span>
                    <span className={cupom.ativo ? 'text-green-500' : 'text-red-500'}>
                      {expirado ? 'Expirado' : esgotado ? 'Esgotado' : cupom.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {editingId ? 'Editar Cupom' : 'Novo Cupom'}
                </h3>
                <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Codigo do Cupom *</label>
                  <input
                    type="text" placeholder="Ex: PROMO10" value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Desconto (%) *</label>
                  <input
                    type="number" placeholder="10" min="0" max="100" value={form.valor}
                    onChange={(e) => setForm({ ...form, valor: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descricao (opcional)</label>
                  <input
                    type="text" placeholder="Descricao do cupom" value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Expiracao</label>
                    <input
                      type="date" value={form.expiraEm}
                      onChange={(e) => setForm({ ...form, expiraEm: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Uso Maximo</label>
                    <input
                      type="number" placeholder="100" min="1" value={form.usoMaximo}
                      onChange={(e) => setForm({ ...form, usoMaximo: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Produtos que o cupom se aplica</label>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl p-2 space-y-1">
                    {produtos.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-3">Nenhum produto cadastrado</p>
                    ) : (
                      produtos.map((p) => (
                        <label key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-sm">
                          <input
                            type="checkbox" checked={form.produtoIds.includes(p.id)}
                            onChange={() => toggleProduto(p.id)}
                            className="rounded border-gray-300 text-primary focus:ring-primary/50"
                          />
                          <span className="text-gray-700 dark:text-gray-300">{p.nome}</span>
                          <span className="ml-auto text-xs text-gray-400">{formatCurrency(p.preco)}</span>
                        </label>
                      ))
                    )}
                  </div>
                  {form.produtoIds.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">{form.produtoIds.length} produto(s) selecionado(s)</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  {editingId ? 'Atualizar' : 'Criar Cupom'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
