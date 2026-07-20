'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loading } from '@/components/shared/loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { Search, Key, Users, Truck, ShoppingBag, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type UserType = 'VENDEDOR' | 'ENTREGADOR' | 'CLIENTE';
type UserItem = {
  id: string;
  tipo: UserType;
  nome: string;
  email: string;
  telefone: string;
  loja?: string;
  temSenha?: boolean;
  ativo: boolean;
};

export default function AdminUsuarios() {
  const [activeTab, setActiveTab] = useState<UserType>('VENDEDOR');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [resetModal, setResetModal] = useState<{ user: UserItem } | null>(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async (tipo: UserType) => {
    setLoading(true);
    try {
      const endpoint = tipo === 'VENDEDOR' ? 'vendedores' : tipo === 'ENTREGADOR' ? 'entregadores' : 'clientes';
      const res = await api.get(`/api/admin/users/${endpoint}`);
      setUsers(res.data);
    } catch {
      toast.error('Erro ao carregar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(activeTab);
  }, [activeTab]);

  const filtered = users.filter(
    (u) =>
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase())
  );

  const handleResetPassword = async () => {
    if (!resetModal) return;
    if (novaSenha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/api/admin/users/${resetModal.user.tipo}/${resetModal.user.id}/password`, { senha: novaSenha });
      toast.success(`Senha de ${resetModal.user.nome} atualizada!`);
      setResetModal(null);
      setNovaSenha('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao alterar senha');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'VENDEDOR' as UserType, label: 'Lojistas', icon: Users, count: users.length },
    { key: 'ENTREGADOR' as UserType, label: 'Entregadores', icon: Truck, count: users.length },
    { key: 'CLIENTE' as UserType, label: 'Clientes', icon: ShoppingBag, count: users.length },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Senhas</h2>
          <p className="text-gray-500">Altere a senha de lojistas, entregadores e clientes</p>
        </div>

        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setBusca(''); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Buscar por nome ou email..."
            value={busca} onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
          />
        </div>

        {loading ? (
          <Loading />
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Nome</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Email</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">Telefone</th>
                    {activeTab === 'VENDEDOR' && <th className="text-left p-4 text-sm font-medium text-gray-500">Loja</th>}
                    {activeTab === 'ENTREGADOR' && <th className="text-center p-4 text-sm font-medium text-gray-500">Senha</th>}
                    <th className="text-center p-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-center p-4 text-sm font-medium text-gray-500">Acao</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400 text-sm">
                        Nenhum usuario encontrado
                      </td>
                    </tr>
                  ) : (
                    filtered.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="p-4 text-sm font-medium">{u.nome}</td>
                        <td className="p-4 text-sm text-gray-500">{u.email}</td>
                        <td className="p-4 text-sm text-gray-500">{u.telefone}</td>
                        {activeTab === 'VENDEDOR' && <td className="p-4 text-sm">{u.loja}</td>}
                        {activeTab === 'ENTREGADOR' && (
                          <td className="p-4 text-center">
                            <Badge variant={u.temSenha ? 'success' : 'danger'}>
                              {u.temSenha ? 'Definida' : 'Nao definida'}
                            </Badge>
                          </td>
                        )}
                        <td className="p-4 text-center">
                          <Badge variant={u.ativo ? 'success' : 'danger'}>
                            {u.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => { setResetModal({ user: u }); setNovaSenha(''); setShowSenha(false); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
                          >
                            <Key size={14} />
                            Senha
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {resetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setResetModal(null)}>
            <div className="absolute inset-0 bg-black/50" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">Alterar Senha</h3>
                  <p className="text-sm text-gray-500">{resetModal.user.nome}</p>
                </div>
                <button onClick={() => setResetModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type={showSenha ? 'text' : 'password'}
                    placeholder="Nova senha (min. 6 caracteres)"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 pr-10"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowSenha(!showSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <button
                  onClick={handleResetPassword}
                  disabled={saving || novaSenha.length < 6}
                  className="w-full py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Alterar Senha'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
