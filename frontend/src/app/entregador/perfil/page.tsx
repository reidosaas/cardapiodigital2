'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, User, CreditCard, Key, Save, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function EntregadorPerfilPage() {
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<any>(null);
  const [form, setForm] = useState({ nome: '', cpf: '', chavePix: '' });
  const [salvando, setSalvando] = useState(false);
  const [senhaForm, setSenhaForm] = useState({ senhaAtual: '', novaSenha: '', confirmar: '' });
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token_entregador') : null;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

  const fetchPerfil = useCallback(async () => {
    if (!token) {
      window.location.href = '/entregador/login';
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/entregador-auth/perfil`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        localStorage.removeItem('token_entregador');
        window.location.href = '/entregador/login';
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setPerfil(data);
        setForm({
          nome: data.nome || '',
          cpf: data.cpf || '',
          chavePix: data.chavePix || '',
        });
      } else {
        toast.error('Erro ao carregar perfil');
      }
    } catch {
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  }, [token, apiBase]);

  useEffect(() => {
    fetchPerfil();
  }, [fetchPerfil]);

  const salvar = async () => {
    setSalvando(true);
    try {
      const res = await fetch(`${apiBase}/api/entregador-auth/perfil`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nome: form.nome, cpf: form.cpf, chavePix: form.chavePix }),
      });
      if (res.ok) {
        toast.success('Dados salvos com sucesso!');
        fetchPerfil();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Erro ao salvar');
      }
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  const alterarSenha = async () => {
    if (!senhaForm.senhaAtual || !senhaForm.novaSenha) {
      toast.error('Preencha a senha atual e a nova senha');
      return;
    }
    if (senhaForm.novaSenha.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (senhaForm.novaSenha !== senhaForm.confirmar) {
      toast.error('A confirmacao nao confere com a nova senha');
      return;
    }
    setSalvandoSenha(true);
    try {
      const res = await fetch(`${apiBase}/api/entregador-auth/perfil`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ senhaAtual: senhaForm.senhaAtual, novaSenha: senhaForm.novaSenha }),
      });
      if (res.ok) {
        setSenhaForm({ senhaAtual: '', novaSenha: '', confirmar: '' });
        toast.success('Senha alterada com sucesso!');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Erro ao alterar senha');
      }
    } catch {
      toast.error('Erro ao alterar senha');
    } finally {
      setSalvandoSenha(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold">Meu Perfil</h2>
        <p className="text-gray-500 text-sm">Gerencie seus dados e forma de recebimento</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><User size={18} /> Dados Pessoais</h3>
          <div>
            <label className="text-sm text-gray-500">Nome</label>
            <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="mt-1" />
          </div>
          <div>
            <label className="text-sm text-gray-500 flex items-center gap-1.5"><Mail size={13} /> Email</label>
            <Input value={perfil?.email || ''} readOnly className="mt-1 bg-gray-50 dark:bg-gray-800" />
            <p className="text-xs text-gray-400 mt-1">O email nao pode ser alterado</p>
          </div>
          <div>
            <label className="text-sm text-gray-500 flex items-center gap-1.5"><Phone size={13} /> Telefone</label>
            <Input value={perfil?.telefone || ''} readOnly className="mt-1 bg-gray-50 dark:bg-gray-800" />
            <p className="text-xs text-gray-400 mt-1">O telefone nao pode ser alterado</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><CreditCard size={18} /> Recebimento</h3>
          <p className="text-xs text-gray-400">Informe seu CPF e chave Pix para receber o valor dos seus ganhos</p>
          <div>
            <label className="text-sm text-gray-500">CPF</label>
            <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} className="mt-1" placeholder="000.000.000-00" />
          </div>
          <div>
            <label className="text-sm text-gray-500">Chave Pix</label>
            <Input value={form.chavePix} onChange={(e) => setForm({ ...form, chavePix: e.target.value })} className="mt-1" placeholder="CPF, email, telefone ou chave aleatoria" />
          </div>
          <Button onClick={salvar} disabled={salvando} className="w-full">
            <Save className="mr-2 h-4 w-4" /> {salvando ? 'Salvando...' : 'Salvar Dados'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><Key size={18} /> Alterar Senha</h3>
          <div>
            <label className="text-sm text-gray-500">Senha atual</label>
            <Input type="password" value={senhaForm.senhaAtual} onChange={(e) => setSenhaForm({ ...senhaForm, senhaAtual: e.target.value })} className="mt-1" placeholder="********" />
          </div>
          <div>
            <label className="text-sm text-gray-500">Nova senha</label>
            <Input type="password" value={senhaForm.novaSenha} onChange={(e) => setSenhaForm({ ...senhaForm, novaSenha: e.target.value })} className="mt-1" placeholder="Minimo 6 caracteres" />
          </div>
          <div>
            <label className="text-sm text-gray-500">Confirmar nova senha</label>
            <Input type="password" value={senhaForm.confirmar} onChange={(e) => setSenhaForm({ ...senhaForm, confirmar: e.target.value })} className="mt-1" placeholder="Repita a nova senha" />
          </div>
          <Button onClick={alterarSenha} disabled={salvandoSenha} variant="outline" className="w-full">
            <Key className="mr-2 h-4 w-4" /> {salvandoSenha ? 'Alterando...' : 'Alterar Senha'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
