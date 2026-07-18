'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
  Wallet,
  Download,
  CheckCircle2,
  Truck,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function EntregadorRelatorioPage() {
  const [periodo, setPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'personalizado'>('mes');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [relatorio, setRelatorio] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token_entregador') : null;

  const fetchRelatorio = useCallback(async () => {
    if (!token) {
      window.location.href = '/entregador/login';
      return;
    }
    setLoading(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/entregador/ganhos?periodo=${periodo}`;
      if (periodo === 'personalizado' && dataInicio && dataFim) {
        url = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/entregador/relatorio?dataInicio=${dataInicio}&dataFim=${dataFim}`;
      }
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) {
        localStorage.removeItem('token_entregador');
        localStorage.removeItem('loja_entregador');
        window.location.href = '/entregador/login';
        return;
      }
      if (res.ok) {
        setRelatorio(await res.json());
      } else {
        let msg = 'Erro ao carregar relatorio';
        try {
          const err = await res.json();
          msg = err.message || msg;
        } catch {
          // resposta sem corpo JSON
        }
        toast.error(msg);
        setRelatorio({ totalEntregas: 0, valorPorEntrega: 0, diaria: 0, totalDiarias: 0, entregas: [] });
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar relatorio');
      setRelatorio({ totalEntregas: 0, valorPorEntrega: 0, diaria: 0, totalDiarias: 0, entregas: [] });
    } finally {
      setLoading(false);
    }
  }, [periodo, dataInicio, dataFim, token]);

  useEffect(() => {
    fetchRelatorio();
  }, [fetchRelatorio]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!relatorio) return <div className="text-center py-10 text-gray-500">Nenhum dado encontrado</div>;

  const totalEntregas = relatorio.totalEntregas || 0;
  const valorPorEntrega = Number(relatorio.valorPorEntrega || 0);
  const diaria = Number(relatorio.diaria || 0);
  const ganhoEntregas = totalEntregas * valorPorEntrega;
  const ganhoDiarias = Number(relatorio.totalDiarias || 0);
  const totalGanho = ganhoEntregas + ganhoDiarias;

  const jaRecebido = 0;
  const aReceber = totalGanho;

  const periodoLabel = periodo === 'hoje' ? 'Hoje' : periodo === 'semana' ? 'Ultimos 7 Dias' : periodo === 'mes' ? 'Este Mes' : 'Periodo Personalizado';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Relatorios</h1>
      </div>

      {/* Filtro de periodo */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1">
              {['hoje', 'semana', 'mes', 'personalizado'].map((p) => (
                <Button
                  key={p}
                  variant={periodo === p && !dataInicio ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setPeriodo(p as any); if (p !== 'personalizado') { setDataInicio(''); setDataFim(''); } }}
                  className={periodo === p && !dataInicio ? 'bg-orange-500 hover:bg-orange-600' : ''}
                >
                  {p === 'hoje' ? 'Hoje' : p === 'semana' ? '7 Dias' : p === 'mes' ? 'Mes' : 'Personalizado'}
                </Button>
              ))}
            </div>
            {periodo === 'personalizado' && (
              <div className="flex gap-2 items-center">
                <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-36" />
                <span className="text-gray-400">ate</span>
                <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-36" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Principal - Valor a Receber */}
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 dark:border-orange-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Total a Receber - {periodoLabel}</p>
              <p className="text-4xl font-bold text-orange-700 dark:text-orange-400 mt-1">R$ {totalGanho.toFixed(2)}</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-orange-200 dark:bg-orange-800/50 flex items-center justify-center">
              <Wallet className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Detalhamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Diaria */}
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Diaria</p>
                <p className="text-xs text-gray-400">{periodoLabel}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Valor diaria:</span>
                <span className="font-medium">R$ {diaria.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Dias trabalhados:</span>
                <span className="font-medium">{Math.ceil(ganhoDiarias / (diaria || 1))} dia(s)</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Subtotal Diarias:</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">R$ {ganhoDiarias.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entregas */}
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Entregas</p>
                <p className="text-xs text-gray-400">{periodoLabel}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total entregas:</span>
                <span className="font-medium">{totalEntregas} entrega(s)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Valor por entrega:</span>
                <span className="font-medium">R$ {valorPorEntrega.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Subtotal Entregas:</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">R$ {ganhoEntregas.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controle de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Controle de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ja Recebido */}
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">Ja Recebido (Pago)</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">Pago</Badge>
                </div>
                <p className="text-3xl font-bold text-green-700 dark:text-green-400">R$ {jaRecebido.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-2">Pagamentos ja realizados pelo lojista</p>
              </CardContent>
            </Card>

            {/* A Receber */}
            <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-400">A Receber (Pendente)</p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400">Pendente</Badge>
                </div>
                <p className="text-3xl font-bold text-orange-700 dark:text-orange-400">R$ {aReceber.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-2">Valor total a ser pago pelo lojista</p>
              </CardContent>
            </Card>
          </div>

          {/* Resumo para o lojista */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-gray-400" />
              Resumo do Pagamento
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between md:flex-col md:gap-1">
                <span className="text-gray-500">Diaria:</span>
                <span className="font-semibold text-green-600">R$ {diaria.toFixed(2)} x {Math.ceil(ganhoDiarias / (diaria || 1))} dia(s)</span>
              </div>
              <div className="flex justify-between md:flex-col md:gap-1">
                <span className="text-gray-500">Entregas:</span>
                <span className="font-semibold text-blue-600">{totalEntregas} x R$ {valorPorEntrega.toFixed(2)}</span>
              </div>
              <div className="flex justify-between md:flex-col md:gap-1 border-t md:border-t-0 pt-2 md:pt-0">
                <span className="text-gray-500 font-medium">Total:</span>
                <span className="font-bold text-orange-600 text-lg">R$ {totalGanho.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historico de Entregas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Historico de Entregas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {relatorio.entregas && relatorio.entregas.length > 0 ? (
            <div className="space-y-2">
              {relatorio.entregas.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Pedido #{e.codigo || e.pedidoId?.slice(0, 8)}</p>
                      <p className="text-xs text-gray-500">
                        {e.entregueEm ? new Date(e.entregueEm).toLocaleString('pt-BR') : '-'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-green-600">
                    R$ {Number(e.valorEntrega || 0).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Nenhuma entrega no periodo</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
