'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loading } from '@/components/shared/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { Key, Users, Truck, ShoppingBag, Search, Eye, EyeOff, Save, X } from 'lucide-react';
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

const TABS: { key: UserType; label: string; icon: any }[] = [
  { key: 'VENDEDOR', label: 'Vendedores', icon: Users },
  { key: 'ENTREGADOR', label: 'Entregadores', icon: Truck },
  { key: 'CLIENTE', label: 'Clientes', icon: ShoppingBag },
];

export default function AdminSenhaPage() {
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

  useEffect(() => { fetchUsers(activeTab); }, [activeTab]);

  const filtered = users.filter((u) =>
    u.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    u.email?.toLowerCase().includes(busca.toLowerCase()) ||
    u.telefone?.includes(busca)
  );

  const handleReset = async () => {
    if (!resetModal || !novaSenha || novaSenha.length < 6) {
      toast.error('Senha deve ter no minimo 6 caracteres');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/api/admin/users/${resetModal.user.tipo.toLowerCase()}/${resetModal.user.id}/password`, { senha: novaSenha });
      toast.success(`Senha de ${resetModal.user.nome} alterada com sucesso!`);
      setResetModal(null);
      setNovaSenha('');
      setShowSenha(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao alterar senha');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Senhas</h2>
          <p className="text-gray-500">Altere a senha de qualquer usuario do sistema</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setActiveTab(tab.key); setBusca(''); }}
                className={activeTab === tab.key ? 'bg-red-500 hover:bg-red-600' : ''}
              >
                <Icon className="h-4 w-4 mr-1" />
                {tab.label}
              </Button>
            );
          })}
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

        {loading ? (
          <Loading />
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">Nome</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">Email</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">Telefone</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-500">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-4 text-sm font-medium">{user.nome}</td>
                    <td className="p-4 text-sm text-gray-500">{user.email || '-'}</td>
                    <td className="p-4 text-sm text-gray-500">{user.telefone || '-'}</td>
                    <td className="p-4 text-center">
                      <Badge className={user.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {user.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setResetModal({ user }); setNovaSenha(''); setShowSenha(false); }}
                        className="gap-1"
                      >
                        <Key className="h-3 w-3" />
                        Alterar Senha
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      Nenhum usuario encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {resetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setResetModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Alterar Senha</h3>
                <Button variant="ghost" size="icon" onClick={() => setResetModal(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Alterando senha de <strong>{resetModal.nome}</strong>
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Nova Senha</label>
                  <div className="relative">
                    <Input
                      type={showSenha ? 'text' : 'password'}
                      placeholder="Minimo 6 caracteres"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSenha(!showSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleReset} disabled={saving || novaSenha.length < 6} className="flex-1">
                    {saving ? 'Salvando...' : (
                      <>
                        <Save className="h-4 w-4 mr-1" />
                        Salvar Senha
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setResetModal(null)}>Cancelar</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
