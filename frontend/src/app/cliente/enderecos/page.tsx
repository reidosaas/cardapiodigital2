'use client';
import { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Star, Edit } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Endereco {
  id: string; rotulo: string; logradouro: string; numero: string;
  complemento?: string; bairro: string; cidade: string; estado: string;
  cep: string; principal: boolean;
}

export default function ClienteEnderecos() {
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Endereco | null>(null);
  const [form, setForm] = useState({ rotulo: 'Casa', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '', principal: false });

  const getAuthHeaders = () => {
    if (typeof window === 'undefined') return {};
    const t = localStorage.getItem('token_cliente') || '';
    return { Authorization: `Bearer ${t}` };
  };

  const loadEnderecos = async () => {
    try {
      const res = await api.get('/api/cliente-global/enderecos', { headers: getAuthHeaders() });
      setEnderecos(res.data);
    } catch { toast.error('Erro ao carregar enderecos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadEnderecos(); }, []);

  const openNew = () => {
    setEditando(null);
    setForm({ rotulo: 'Casa', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '', principal: enderecos.length === 0 });
    setShowForm(true);
  };

  const openEdit = (e: Endereco) => {
    setEditando(e);
    setForm({ rotulo: e.rotulo, logradouro: e.logradouro, numero: e.numero, complemento: e.complemento || '', bairro: e.bairro, cidade: e.cidade, estado: e.estado, cep: e.cep, principal: e.principal });
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      if (editando) {
        await api.patch(`/api/cliente-global/enderecos/${editando.id}`, form, { headers: getAuthHeaders() });
      } else {
        await api.post('/api/cliente-global/enderecos', form, { headers: getAuthHeaders() });
      }
      toast.success(editando ? 'Endereco atualizado!' : 'Endereco criado!');
      setShowForm(false);
      loadEnderecos();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao salvar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este endereco?')) return;
    try {
      await api.delete(`/api/cliente-global/enderecos/${id}`, { headers: getAuthHeaders() });
      toast.success('Endereco removido!');
      loadEnderecos();
    } catch { toast.error('Erro ao remover'); }
  };

  if (loading) return <div className="text-center py-10 text-gray-400">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meus Enderecos</h1>
        <button onClick={openNew} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600">
          <Plus size={16} /> Novo
        </button>
      </div>

      {enderecos.length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-400">
          <MapPin className="h-12 w-12 mx-auto mb-3" />
          <p>Nenhum endereco cadastrado</p>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
          <h2 className="font-bold text-gray-900">{editando ? 'Editar Endereco' : 'Novo Endereco'}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Rotulo</label>
              <select value={form.rotulo} onChange={(e) => setForm({ ...form, rotulo: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm">
                <option>Casa</option><option>Trabalho</option><option>Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">CEP</label>
              <input value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="00000-000" />
            </div>
          </div>
          <div className="grid grid-cols-[1fr,auto] gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Logradouro</label>
              <input value={form.logradouro} onChange={(e) => setForm({ ...form, logradouro: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="Rua, Avenida..." />
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium text-gray-600 mb-1">Numero</label>
              <input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Complemento</label>
            <input value={form.complemento} onChange={(e) => setForm({ ...form, complemento: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="Apto, Bloco..." />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bairro</label>
              <input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cidade</label>
              <input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
              <input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="SP" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={form.principal} onChange={(e) => setForm({ ...form, principal: e.target.checked })} className="rounded" />
            Definir como endereco principal
          </label>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-6 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600">Salvar</button>
            <button onClick={() => setShowForm(false)} className="px-6 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {enderecos.map((e) => (
          <div key={e.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{e.rotulo}</span>
                  {e.principal && <Star className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />}
                </div>
                <p className="text-sm text-gray-600">{e.logradouro}, {e.numero}{e.complemento ? ` - ${e.complemento}` : ''}</p>
                <p className="text-sm text-gray-500">{e.bairro}, {e.cidade} - {e.estado}</p>
                <p className="text-xs text-gray-400">CEP: {e.cep}</p>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => openEdit(e)} className="p-2 text-gray-400 hover:text-gray-600"><Edit size={16} /></button>
              <button onClick={() => handleDelete(e.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
