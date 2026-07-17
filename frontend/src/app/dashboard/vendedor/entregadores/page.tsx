'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loading } from '@/components/shared/loading';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import {
  Plus,
  Trash2,
  Edit3,
  X,
  Truck,
  Phone,
  Bike,
  DollarSign,
  Link,
  CheckCircle2,
  Loader2,
  Wallet,
  Calendar,
  Package,
  CircleDollarSign,
  CreditCard,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function EntregadoresPage() {
  const { user } = useAuth();
  const [entregadores, setEntregadores] = useState<any[]>([]);
  const [pagamentoData, setPagamentoData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', diaria: '', valorPorEntrega: '' });
  const [pagandoId, setPagandoId] = useState<string | null>(null);

  const vendedorId = user?.vendedor?.id;

  const fetchData = async () => {
    if (!vendedorId) return;
    try {
      const [statsRes, pagRes] = await Promise.all([
        api.get(`/api/entregadores/stats/vendedor/${vendedorId}`),
        api.get(`/api/entregadores/para-pagar/vendedor/${vendedorId}`),
      ]);
      setEntregadores(statsRes.data);
      setPagamentoData(pagRes.data);
    } catch {
      toast.error('Erro ao carregar entregadores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vendedorId) fetchData();
  }, [vendedorId]);

  const resetForm = () => {
    setForm({ email: '', diaria: '', valorPorEntrega: '' });
    setEditingId(null);
  };

  const openEdit = (e: any) => {
    setForm({
      email: e.email || '',
      diaria: String(e.diaria ?? ''),
      valorPorEntrega: String(e.valorPorEntrega ?? ''),
    });
    setEditingId(e.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!vendedorId) return;
    if (!editingId && !form.email) {
      toast.error('Informe o email do entregador para vincular');
      return;
    }
    try {
      if (editingId) {
        const payload: any = {
          diaria: Number(form.diaria) || 0,
          valorPorEntrega: Number(form.valorPorEntrega) || 0,
        };
        await api.patch(`/api/entregadores/${editingId}`, payload);
        toast.success('Entregador atualizado');
      } else {
        const payload: any = {
          vendedorId,
          email: form.email,
          diaria: Number(form.diaria) || 0,
          valorPorEntrega: Number(form.valorPorEntrega) || 0,
        };
        const res = await api.post('/api/entregadores', payload);
        if (res.data.vinculado) {
          toast.success('Entregador vinculado com sucesso');
        } else {
          toast.success('Entregador criado (aguardando cadastro do entregador)');
        }
      }
      setShowForm(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erro ao salvar';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este entregador?')) return;
    try {
      await api.delete(`/api/entregadores/${id}`);
      toast.success('Entregador excluido');
      fetchData();
    } catch {
      toast.error('Erro ao excluir');
    }
  };

  const handleCheckin = async (entregadorId: string) => {
    try {
      const res = await api.post(`/api/entregadores/${entregadorId}/checkin`);
      if (res.data.jaCheckin) {
        toast.info('Check-in ja realizado hoje');
      } else {
        toast.success('Check-in realizado! Diaria registrada.');
        fetchData();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao fazer check-in');
    }
  };

  const handlePagar = async (checkinId: string) => {
    setPagandoId(checkinId);
    try {
      await api.post(`/api/entregadores/${checkinId}/pagar`);
      toast.success('Pagamento registrado com sucesso!');
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao registrar pagamento');
    } finally {
      setPagandoId(null);
    }
  };

  const getPagamentoInfo = (entregadorId: string) => {
    return pagamentoData.find((p) => p.entregadorId === entregadorId);
  };

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold">Entregadores</h2>
            <p className="text-gray-500">{entregadores.length} entregador(es) vinculado(s)</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:opacity-90"
          >
            <Plus size={18} /> Vincular Entregador
          </button>
        </div>

        {entregadores.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white dark:bg-gray-900 rounded-xl border">
            <Truck className="h-12 w-12 mx-auto mb-3" />
            <p className="font-medium text-gray-500">Nenhum entregador vinculado</p>
            <p className="text-sm text-gray-400 mt-1">
              Clique em &quot;Vincular Entregador&quot; e informe o email dele
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Total</p>
                <p className="text-2xl font-bold mt-1">{entregadores.length}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Aceitos</p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {entregadores.filter((e: any) => e.vinculoStatus === 'ACEITO').length}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Pendentes</p>
                <p className="text-2xl font-bold mt-1 text-yellow-600">
                  {entregadores.filter((e: any) => e.vinculoStatus === 'PENDENTE').length}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Entregas no Mes</p>
                <p className="text-2xl font-bold mt-1">
                  {entregadores.reduce((s: number, e: any) => s + (e.totalEntreguesMes || 0), 0)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {entregadores.map((e: any) => {
                const pg = getPagamentoInfo(e.id);
                const valorEntregasHoje = pg ? pg.valorEntregasHoje : 0;
                const valorDiaria = pg ? pg.valorDiaria : 0;
                const valorTotalHoje = pg ? pg.valorTotalHoje : 0;
                const totalEntregasHoje = pg ? pg.totalEntregasHoje : 0;
                const pago = pg?.pago || false;
                const checkinId = pg?.checkin?.id || null;

                return (
                  <div
                    key={e.id}
                    className="bg-white dark:bg-gray-900 rounded-xl border p-4 hover:shadow-sm transition-all flex flex-col"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                            {e.nome}
                          </p>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                              e.vinculoStatus === 'ACEITO'
                                ? 'bg-green-100 text-green-700'
                                : e.vinculoStatus === 'PENDENTE'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {e.vinculoStatus === 'ACEITO'
                              ? 'Aceito'
                              : e.vinculoStatus === 'PENDENTE'
                              ? 'Pendente'
                              : 'Recusado'}
                          </span>
                        </div>
                        <p className="text-[11px] text-primary font-semibold mt-1">
                          {formatCurrency(e.diaria)}/dia · {formatCurrency(e.valorPorEntrega)}/ent
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {e.vinculoStatus === 'ACEITO' && (
                          <button
                            onClick={() => handleCheckin(e.id)}
                            className="p-1.5 rounded hover:bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                            title="Check-in diaria"
                          >
                            <CheckCircle2 size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(e)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Stats basicos */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center justify-center w-5 h-5 rounded bg-green-100 dark:bg-green-900/30">
                          <CheckCircle2 size={11} className="text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-[10px]">Hoje</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {e.entreguesHoje || 0} <span className="font-normal text-gray-400">entregues</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center justify-center w-5 h-5 rounded bg-orange-100 dark:bg-orange-900/30">
                          <Truck size={11} className="text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-[10px]">Em andamento</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {e.emAndamentoHoje || 0} <span className="font-normal text-gray-400">rota</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center justify-center w-5 h-5 rounded bg-blue-100 dark:bg-blue-900/30">
                          <Bike size={11} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-[10px]">Mes</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {e.totalEntreguesMes || 0} <span className="font-normal text-gray-400">total</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center justify-center w-5 h-5 rounded bg-purple-100 dark:bg-purple-900/30">
                          <DollarSign size={11} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-[10px]">Ganho mes</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(e.totalGanhoMes || 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Mini dashboard de pagamentos */}
                    {e.vinculoStatus === 'ACEITO' && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Wallet size={12} className="text-orange-500" />
                          <p className="text-[10px] font-medium text-gray-500 uppercase">Pagamento Hoje</p>
                        </div>

                        <div className="space-y-1.5 text-xs mb-3">
                          <div className="flex justify-between">
                            <span className="text-gray-500 flex items-center gap-1">
                              <Calendar size={10} /> Diaria
                            </span>
                            <span className="font-medium">{formatCurrency(valorDiaria)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 flex items-center gap-1">
                              <Package size={10} /> {totalEntregasHoje} entrega(s) x {formatCurrency(e.valorPorEntrega)}
                            </span>
                            <span className="font-medium">{formatCurrency(valorEntregasHoje)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-1.5 mt-1.5">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Total a pagar</span>
                            <span className="font-bold text-orange-600">{formatCurrency(valorTotalHoje)}</span>
                          </div>
                        </div>

                        {pago ? (
                          <div className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                            <CheckCircle2 size={12} />
                            Pago
                          </div>
                        ) : checkinId ? (
                          <button
                            onClick={() => handlePagar(checkinId)}
                            disabled={pagandoId === checkinId || valorTotalHoje === 0}
                            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
                          >
                            {pagandoId === checkinId ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <CreditCard size={12} />
                            )}
                            Pagar {formatCurrency(valorTotalHoje)}
                          </button>
                        ) : (
                          <div className="text-center text-[10px] text-gray-400 py-2">
                            Faça check-in para registrar pagamento
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowForm(false)}
          >
            <div
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold">
                  {editingId ? 'Editar Entregador' : 'Vincular Entregador'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                {!editingId && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Informe o email do entregador que ja fez cadastro em{' '}
                      <strong>/entregador/cadastro</strong>. O vinculo sera feito automaticamente.
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email do Entregador *
                  </label>
                  <input
                    type="email"
                    placeholder="entregador@email.com"
                    value={form.email}
                    disabled={!!editingId}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm ${
                      editingId ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Diaria (R$)
                    </label>
                    <input
                      type="number"
                      placeholder="0,00"
                      min="0"
                      step="0.01"
                      value={form.diaria}
                      onChange={(e) => setForm({ ...form, diaria: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Valor por Entrega (R$)
                    </label>
                    <input
                      type="number"
                      placeholder="0,00"
                      min="0"
                      step="0.01"
                      value={form.valorPorEntrega}
                      onChange={(e) => setForm({ ...form, valorPorEntrega: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2"
                >
                  {editingId ? 'Atualizar' : <><Link size={16} /> Vincular</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
