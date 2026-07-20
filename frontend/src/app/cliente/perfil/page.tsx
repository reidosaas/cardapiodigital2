'use client';
import { useState, useEffect } from 'react';
import { User, Save } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function ClientePerfil() {
  const [form, setForm] = useState({ nome: '', email: '', telefone: '' });
  const [senha, setSenha] = useState({ senhaAtual: '', novaSenha: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token_cliente');
    if (!token) return;
    api.get('/api/cliente-global/perfil', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setForm({ nome: res.data.nome, email: res.data.email, telefone: res.data.telefone || '' });
      })
      .catch(() => toast.error('Erro ao carregar perfil'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token_cliente');
      await api.patch('/api/cliente-global/perfil', form, { headers: { Authorization: `Bearer ${token}` } });
      const c = JSON.parse(localStorage.getItem('cliente') || '{}');
      c.nome = form.nome;
      localStorage.setItem('cliente', JSON.stringify(c));
      toast.success('Perfil atualizado!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleSenha = async () => {
    if (!senha.senhaAtual || !senha.novaSenha) {
      toast.error('Preencha ambas as senhas');
      return;
    }
    try {
      const token = localStorage.getItem('token_cliente');
      await api.patch('/api/cliente-global/perfil', senha, { headers: { Authorization: `Bearer ${token}` } });
      setSenha({ senhaAtual: '', novaSenha: '' });
      toast.success('Senha alterada!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao alterar senha');
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-400">Carregando...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <User className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <p className="font-bold text-gray-900">{form.nome}</p>
            <p className="text-sm text-gray-500">{form.email}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
          <input
            type="text"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            disabled
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
          <input
            type="tel"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          <Save size={16} /> {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="font-bold text-gray-900">Alterar Senha</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Senha atual</label>
          <input
            type="password"
            value={senha.senhaAtual}
            onChange={(e) => setSenha({ ...senha, senhaAtual: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
          <input
            type="password"
            value={senha.novaSenha}
            onChange={(e) => setSenha({ ...senha, novaSenha: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          />
        </div>
        <button onClick={handleSenha} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
          Alterar Senha
        </button>
      </div>
    </div>
  );
}
