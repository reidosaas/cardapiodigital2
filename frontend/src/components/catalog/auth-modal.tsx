'use client';
import { useState } from 'react';
import { X, User, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (cliente: any) => void;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'cadastro'>('login');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', senha: '' });
  const [cadastroForm, setCadastroForm] = useState({ nome: '', email: '', telefone: '', senha: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/api/cliente-global/login', loginForm);
      localStorage.setItem('token_cliente', res.data.accessToken);
      localStorage.setItem('cliente', JSON.stringify(res.data.cliente));
      toast.success('Login realizado!');
      onAuthSuccess(res.data.cliente);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/api/cliente-global/cadastro', cadastroForm);
      toast.success('Cadastro realizado! Fazendo login...');
      const loginRes = await api.post('/api/cliente-global/login', { email: cadastroForm.email, senha: cadastroForm.senha });
      localStorage.setItem('token_cliente', loginRes.data.accessToken);
      localStorage.setItem('cliente', JSON.stringify(loginRes.data.cliente));
      onAuthSuccess(loginRes.data.cliente);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">
              {mode === 'login' ? 'Entrar' : 'Criar Conta'}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="email" required placeholder="Email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
              <div className="relative">
                <input
                  type={showSenha ? 'text' : 'password'} required placeholder="Senha"
                  value={loginForm.senha}
                  onChange={(e) => setLoginForm({ ...loginForm, senha: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 pr-10"
                />
                <button type="button" onClick={() => setShowSenha(!showSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCadastro} className="space-y-3">
              <input
                type="text" required placeholder="Nome completo"
                value={cadastroForm.nome}
                onChange={(e) => setCadastroForm({ ...cadastroForm, nome: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
              <input
                type="email" required placeholder="Email"
                value={cadastroForm.email}
                onChange={(e) => setCadastroForm({ ...cadastroForm, email: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
              <input
                type="tel" placeholder="Telefone (opcional)"
                value={cadastroForm.telefone}
                onChange={(e) => setCadastroForm({ ...cadastroForm, telefone: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
              <div className="relative">
                <input
                  type={showSenha ? 'text' : 'password'} required minLength={6} placeholder="Minimo 6 caracteres"
                  value={cadastroForm.senha}
                  onChange={(e) => setCadastroForm({ ...cadastroForm, senha: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 pr-10"
                />
                <button type="button" onClick={() => setShowSenha(!showSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </form>
          )}

          <div className="mt-3 text-center text-xs text-gray-500">
            {mode === 'login' ? (
              <span>Nao tem conta?{' '}
                <button onClick={() => setMode('cadastro')} className="text-red-500 font-medium hover:underline">Cadastre-se</button>
              </span>
            ) : (
              <span>Ja tem conta?{' '}
                <button onClick={() => setMode('login')} className="text-red-500 font-medium hover:underline">Fazer login</button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
