'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Truck, Store } from 'lucide-react';
import { toast } from 'sonner';

export default function EntregadorLoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [showStoreSelect, setShowStoreSelect] = useState(false);
  const [lojas, setLojas] = useState<any[]>([]);
  const [tempToken, setTempToken] = useState('');
  const [entregador, setEntregador] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token_entregador');
    if (token) router.replace('/entregador/dashboard');
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/entregador-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao fazer login');
      }

      const data = await res.json();

      if (data.requiresStoreSelection) {
        setLojas(data.lojas);
        setTempToken(data.tempToken);
        setEntregador(data.entregador);
        setShowStoreSelect(true);
        return;
      }

      localStorage.setItem('token_entregador', data.accessToken);
      localStorage.setItem('entregador', JSON.stringify(data.entregador));
      if (data.loja) {
        localStorage.setItem('loja_entregador', JSON.stringify(data.loja));
      }
      if (data.vinculosPendentes) {
        localStorage.setItem('vinculos_pendentes', JSON.stringify(data.vinculosPendentes));
      }

      if (data.aguardandoVinculo) {
        toast.info('Nenhuma loja encontrada. Aguarde um lojista te vincular.');
        window.location.href = '/entregador/dashboard';
        return;
      }

      if (data.vinculosPendentes?.length > 0 && !data.loja) {
        toast.info(`Voce tem ${data.vinculosPendentes.length} pedido(s) de vinculo pendente(s)`);
        window.location.href = '/entregador/dashboard';
        return;
      }

      toast.success(`Bem-vindo, ${data.entregador.nome}!`);
      window.location.href = '/entregador/dashboard';
    } catch (err: any) {
      toast.error(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStore = async (vendedorId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/entregador-auth/select-store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, vendedorId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao selecionar loja');
      }

      const data = await res.json();
      localStorage.setItem('token_entregador', data.accessToken);
      localStorage.setItem('entregador', JSON.stringify(data.entregador));
      localStorage.setItem('loja_entregador', JSON.stringify(data.loja));
      toast.success(`Bem-vindo, ${data.entregador.nome}!`);
      window.location.href = '/entregador/dashboard';
    } catch (err: any) {
      toast.error(err.message || 'Erro ao selecionar loja');
    } finally {
      setLoading(false);
    }
  };

  if (showStoreSelect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-950 dark:to-gray-900 p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-xl bg-orange-500 flex items-center justify-center">
                  <Store className="h-6 w-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl">Selecione a Loja</CardTitle>
              <CardDescription>Ola, {entregador?.nome}! Em qual loja voce vai trabalhar hoje?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lojas.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => handleSelectStore(l.id)}
                    className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all text-left"
                    disabled={loading}
                  >
                    <p className="font-bold">{l.nomeLoja}</p>
                    <p className="text-sm text-gray-500">
                      Diaria: R$ {Number(l.diaria).toFixed(2)} | Por entrega: R$ {Number(l.valorPorEntrega).toFixed(2)}
                    </p>
                  </button>
                ))}
              </div>
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowStoreSelect(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Voltar ao login
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-950 dark:to-gray-900 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-orange-500 flex items-center justify-center">
                <Truck className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">Area do Entregador</CardTitle>
            <CardDescription>Entre para gerenciar suas entregas</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
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
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entrar'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-500">Nao tem conta? </span>
              <Link href="/entregador/cadastro" className="text-orange-600 font-medium hover:underline">
                Cadastre-se
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
