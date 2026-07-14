'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { login } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await login(email, senha);
      if (data.user.role !== 'ADMIN') {
        toast.error('Acesso negado. Use o login do lojista.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return;
      }
      toast.success('Login admin realizado!');
      window.location.href = '/admin';
    } catch (err: any) {
      const message = err.response?.data?.message;
      const errorText = Array.isArray(message) ? message[0] : message || err.message || 'Erro ao fazer login';
      toast.error(errorText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white dark:bg-gray-900">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-gray-900 dark:bg-white flex items-center justify-center">
                <Shield className="h-6 w-6 text-white dark:text-gray-900" />
              </div>
            </div>
            <CardTitle className="text-2xl">Painel Administrativo</CardTitle>
            <CardDescription>Acesso restrito a administradores</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="admin@sistema.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Senha</label>
                <Input
                  type="password"
                  placeholder="********"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entrar'}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm">
              <Link href="/auth/login" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                Entrar como lojista
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
