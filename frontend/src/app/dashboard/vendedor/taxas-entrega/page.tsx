'use client';
import { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Save, Loader2, Info, Truck } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

interface TaxaDistancia {
  id: string;
  distanciaMinKm: number;
  distanciaMaxKm: number;
  valor: number;
  ativo: boolean;
}

export default function TaxasEntregaPage() {
  const [taxas, setTaxas] = useState<TaxaDistancia[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [novaTaxa, setNovaTaxa] = useState({ distanciaMinKm: 0, distanciaMaxKm: 1, valor: 0 });

  useEffect(() => {
    fetchTaxas();
  }, []);

  const fetchTaxas = async () => {
    try {
      const res = await api.get('/api/taxas-entrega');
      setTaxas(res.data);
    } catch {
      toast.error('Erro ao carregar taxas');
    } finally {
      setLoading(false);
    }
  };

  const adicionarTaxa = async () => {
    if (novaTaxa.distanciaMinKm >= novaTaxa.distanciaMaxKm) {
      toast.error('Distancia minima deve ser menor que a maxima');
      return;
    }
    if (novaTaxa.valor <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }
    setSalvando(true);
    try {
      const res = await api.post('/api/taxas-entrega', novaTaxa);
      setTaxas([...taxas, res.data].sort((a, b) => a.distanciaMinKm - b.distanciaMinKm));
      setNovaTaxa({ distanciaMinKm: 0, distanciaMaxKm: 1, valor: 0 });
      toast.success('Taxa adicionada!');
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Erro ao adicionar taxa');
    } finally {
      setSalvando(false);
    }
  };

  const removerTaxa = async (id: string) => {
    if (!confirm('Remover esta taxa?')) return;
    try {
      await api.delete(`/api/taxas-entrega/${id}`);
      setTaxas(taxas.filter(t => t.id !== id));
      toast.success('Taxa removida!');
    } catch {
      toast.error('Erro ao remover taxa');
    }
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    try {
      const res = await api.patch(`/api/taxas-entrega/${id}`, { ativo: !ativo });
      setTaxas(taxas.map(t => t.id === id ? { ...t, ativo: res.data.ativo } : t));
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

  const atualizarValor = async (id: string, valor: number) => {
    try {
      const res = await api.patch(`/api/taxas-entrega/${id}`, { valor });
      setTaxas(taxas.map(t => t.id === id ? { ...t, valor: res.data.valor } : t));
    } catch {
      toast.error('Erro ao atualizar valor');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-100 rounded-lg">
          <Truck className="text-red-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Taxas de Entrega por Distancia</h1>
          <p className="text-sm text-gray-500">Configure o valor da entrega por faixa de distancia</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info className="text-blue-600 shrink-0 mt-0.5" size={18} />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Como funciona:</p>
          <ul className="list-disc list-inside space-y-0.5 text-blue-700">
            <li>Defina faixas de distancia (ex: 0 a 2 km) e o valor cobrado</li>
            <li>O sistema calcula automaticamente a distancia da loja ate o cliente</li>
            <li>A taxa e aplicada com base na distancia calculada</li>
            <li>Se nao houver faixas configuradas, usa a taxa fixa padrao</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Faixas de Distancia</h2>
        {taxas.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">Nenhuma faixa configurada. Adicione a primeira abaixo.</p>
        ) : (
          <div className="space-y-3">
            {taxas.map((taxa) => (
              <div key={taxa.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${taxa.ativo ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Min (km)</label>
                    <input
                      type="number"
                      value={taxa.distanciaMinKm}
                      readOnly
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-center"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Max (km)</label>
                    <input
                      type="number"
                      value={taxa.distanciaMaxKm}
                      readOnly
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-center"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Valor (R$)</label>
                    <input
                      type="number"
                      step="0.50"
                      value={taxa.valor}
                      onChange={(e) => atualizarValor(taxa.id, parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleAtivo(taxa.id, taxa.ativo)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium ${taxa.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {taxa.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                  <button
                    onClick={() => removerTaxa(taxa.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Nova Faixa</h2>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Distancia Minima (km)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={novaTaxa.distanciaMinKm}
              onChange={(e) => setNovaTaxa({ ...novaTaxa, distanciaMinKm: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Distancia Maxima (km)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={novaTaxa.distanciaMaxKm}
              onChange={(e) => setNovaTaxa({ ...novaTaxa, distanciaMaxKm: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Valor (R$)</label>
            <input
              type="number"
              step="0.50"
              min="0"
              value={novaTaxa.valor}
              onChange={(e) => setNovaTaxa({ ...novaTaxa, valor: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <button
            onClick={adicionarTaxa}
            disabled={salvando}
            className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-red-600 disabled:opacity-50"
          >
            {salvando ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Adicionar
          </button>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex gap-3">
          <Info className="text-yellow-600 shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Dica:</p>
            <p>Configure as faixas em ordem crescente de distancia. Ex: 0-2km = R$5, 2-5km = R$8, 5-10km = R$12. Se o cliente estiver alem da maior distancia configurada, sera cobrado o valor da ultima faixa.</p>
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}
