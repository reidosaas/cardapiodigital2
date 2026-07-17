'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Link,
  X,
  Navigation,
  Wallet,
  Calendar,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-800',
  ACEITO: 'bg-blue-100 text-blue-800',
  EM_ROTA: 'bg-purple-100 text-purple-800',
  ENTREGUE: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  PENDENTE: 'Pendente',
  ACEITO: 'Aceito',
  EM_ROTA: 'Em Rota',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

interface PedidoEntrega {
  id: string;
  pedidoId: string;
  codigoPedido: number;
  status: string;
  endereco: string;
  valorEntrega: number;
  valorCobrado: number;
  criadoEm: string;
  aceitoEm: string;
  saiuEm: string;
  entregueEm: string;
  rotaOrdem?: number;
  pedido: {
    id: string;
    codigo: number;
    status: string;
    total: number;
    observacao: string;
    rua: string;
    numero: string;
    bairro: string;
    complemento: string;
    cliente: { id: string; nome: string; telefone: string };
    itens: any[];
    pagamento: any;
  };
}

interface Vinculo {
  id: string;
  status: string;
  diaria: number;
  valorPorEntrega: number;
  createdAt: string;
  loja: { id: string; nomeLoja: string; slug: string; endereco?: string; cidade?: string; estado?: string; cep?: string; latitude?: number; longitude?: number };
}

interface RelatorioStats {
  totalEntregasHoje: number;
  pendentes: number;
  emRota: number;
  entreguesHoje: number;
  diaria: number;
  valorPorEntrega: number;
  ganhoHoje: number;
  totalGanhoMes: number;
  totalDiariasMes: number;
  totalEntregasMes: number;
  valorEntregasMes: number;
}

export default function EntregadorDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'entregas' | 'relatorio'>('entregas');
  const [entregasAtivas, setEntregasAtivas] = useState<PedidoEntrega[]>([]);
  const [entregasHistorico, setEntregasHistorico] = useState<PedidoEntrega[]>([]);
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [stats, setStats] = useState<RelatorioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<string>('todos');
  const [processandoVinculo, setProcessandoVinculo] = useState<string | null>(null);
  const [relatorioPeriodo, setRelatorioPeriodo] = useState<'hoje' | 'semana' | 'mes'>('mes');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token_entregador') : null;

  const fetchData = useCallback(async () => {
    if (!token) { window.location.href = '/entregador/login'; return; }
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const vinculosRes = await fetch(`${baseUrl}/api/entregador/vinculos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (vinculosRes.status === 401) {
        localStorage.removeItem('token_entregador');
        localStorage.removeItem('loja_entregador');
        window.location.href = '/entregador/login';
        return;
      }
      if (vinculosRes.ok) {
        const v = await vinculosRes.json();
        setVinculos(v);
        const ativo = v.find((x: Vinculo) => x.status === 'ACEITO');
        if (ativo) localStorage.setItem('loja_entregador', JSON.stringify(ativo.loja));
      }

      const lojaData = localStorage.getItem('loja_entregador');
      if (lojaData && lojaData !== 'null') {
        const [pedidosRes, statsRes] = await Promise.all([
          fetch(`${baseUrl}/api/entregador/pedidos`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${baseUrl}/api/entregador/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (pedidosRes.status === 401) {
          localStorage.removeItem('token_entregador');
          localStorage.removeItem('loja_entregador');
          window.location.href = '/entregador/login';
          return;
        }
        if (pedidosRes.ok) {
          const data = await pedidosRes.json();
          setEntregasAtivas(data.ativas || []);
          setEntregasHistorico(data.historico || []);
        }
        if (statsRes.ok) setStats(await statsRes.json());
      }
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const updateStatus = async (entregaId: string, newStatus: string) => {
    if (!token) return;
    setUpdatingId(entregaId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/entregador/entrega/${entregaId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Erro ao atualizar');
      toast.success(`Status atualizado para ${statusLabels[newStatus]}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const aceitarVinculo = async (vinculoId: string) => {
    if (!token) return;
    setProcessandoVinculo(vinculoId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/entregador/vinculo/${vinculoId}/aceitar`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erro ao aceitar vinculo');
      toast.success('Vinculo aceito!');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessandoVinculo(null);
    }
  };

  const recusarVinculo = async (vinculoId: string) => {
    if (!token) return;
    setProcessandoVinculo(vinculoId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/entregador/vinculo/${vinculoId}/recusar`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erro ao recusar vinculo');
      toast.success('Vinculo recusado');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessandoVinculo(null);
    }
  };

  const vinculosPendentes = vinculos.filter((v) => v.status === 'PENDENTE');
  const vinculosAtivos = vinculos.filter((v) => v.status === 'ACEITO');
  const filteredEntregas = filtro === 'todos'
    ? entregasAtivas
    : filtro === 'ENTREGUE'
      ? entregasHistorico.filter((p) => p.status === 'ENTREGUE')
      : filtro === 'CANCELADO'
        ? entregasHistorico.filter((p) => p.status === 'CANCELADO')
        : entregasAtivas.filter((p) => p.status === filtro);

  const openMaps = (endereco: string) => {
    const addr = encodeURIComponent(endereco);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${addr}`, '_blank');
  };

  // Calculos para o relatorio
  const ganhoDiario = stats ? Number(stats.diaria) + (Number(stats.totalEntregasHoje) * Number(stats.valorPorEntrega)) : 0;
  const ganhoMesEntregas = stats ? Number(stats.valorPorEntrega) * Number(stats.totalEntregasMes || 0) : 0;
  const ganhoMesDiarias = stats ? Number(stats.diaria) * 30 : 0;
  const totalGanhoMes = ganhoMesEntregas + ganhoMesDiarias;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vinculos pendentes */}
      {vinculosPendentes.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Link className="h-5 w-5 text-orange-500" />
              Pedidos de Vinculo ({vinculosPendentes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {vinculosPendentes.map((v) => (
              <div key={v.id} className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl p-4 border">
                <div>
                  <p className="font-bold">{v.loja.nomeLoja}</p>
                  <p className="text-sm text-gray-500">
                    Diaria: R$ {Number(v.diaria).toFixed(2)} | Por entrega: R$ {Number(v.valorPorEntrega).toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-500 hover:bg-green-600"
                    onClick={() => aceitarVinculo(v.id)}
                    disabled={processandoVinculo === v.id}
                  >
                    {processandoVinculo === v.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><CheckCircle className="h-3 w-3 mr-1" /> Aceitar</>}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 hover:bg-red-50"
                    onClick={() => recusarVinculo(v.id)}
                    disabled={processandoVinculo === v.id}
                  >
                    <X className="h-3 w-3 mr-1" /> Recusar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {vinculosAtivos.length === 0 && vinculosPendentes.length === 0 && (
        <Card className="w-full">
          <CardContent className="py-12 text-center">
            <Clock className="h-16 w-16 mx-auto mb-4 text-orange-400" />
            <h2 className="text-xl font-bold mb-2">Aguardando Vinculo</h2>
            <p className="text-gray-500 mb-4">
              Nenhuma loja te vinculou ainda. Aguarde um lojista informar seu email.
            </p>
            <p className="text-sm text-gray-400">
              Assim que uma loja te vincular, voce recebera um pedido de vinculo aqui.
            </p>
          </CardContent>
        </Card>
      )}

      {vinculosAtivos.length > 0 && (
        <>
          {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entregas">Entregas</TabsTrigger>
              <TabsTrigger value="relatorio">Relatorio</TabsTrigger>
            </TabsList>

            {/* Aba Entregas */}
            <TabsContent value="entregas" className="space-y-4">
              {/* Stats cards */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Package className="h-6 w-6 mx-auto mb-1 text-orange-500" />
                      <p className="text-2xl font-bold">{stats.totalEntregasHoje}</p>
                      <p className="text-xs text-gray-500">Entregas Hoje</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Clock className="h-6 w-6 mx-auto mb-1 text-yellow-500" />
                      <p className="text-2xl font-bold">{stats.pendentes}</p>
                      <p className="text-xs text-gray-500">Pendentes</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Truck className="h-6 w-6 mx-auto mb-1 text-purple-500" />
                      <p className="text-2xl font-bold">{stats.emRota}</p>
                      <p className="text-xs text-gray-500">Em Rota</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Wallet className="h-6 w-6 mx-auto mb-1 text-green-500" />
                      <p className="text-2xl font-bold">R$ {ganhoDiario.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Ganhos Hoje (Diaria + Entregas)</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Filtros */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {['todos', 'PENDENTE', 'ACEITO', 'EM_ROTA', 'ENTREGUE'].map((f) => (
                  <Button
                    key={f}
                    variant={filtro === f ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFiltro(f)}
                    className={filtro === f ? 'bg-orange-500 hover:bg-orange-600' : ''}
                  >
                    {f === 'todos' ? 'Todos' : statusLabels[f]}
                  </Button>
                ))}
              </div>

              {/* Lista de entregas */}
              {filteredEntregas.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhuma entrega encontrada</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredEntregas.map((p) => (
                    <Card key={p.id} className={`overflow-hidden ${(filtro === 'ENTREGUE' || filtro === 'CANCELADO') ? 'opacity-75' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {p.rotaOrdem && (
                              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-bold shrink-0">
                                {p.rotaOrdem}
                              </span>
                            )}
                            <div>
                              <p className="font-bold text-sm">#{p.codigoPedido}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(p.criadoEm).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <Badge className={statusColors[p.status]}>{statusLabels[p.status]}</Badge>
                        </div>

                        <div className="space-y-1 mb-3 text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{p.endereco || p.pedido.rua + ', ' + p.pedido.numero + ' - ' + p.pedido.bairro || 'Sem endereco'}</span>
                          </div>
                          {p.pedido.cliente && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Phone className="h-3.5 w-3.5" />
                              <span>{p.pedido.cliente.nome} - {p.pedido.cliente.telefone}</span>
                            </div>
                          )}
                          <p className="text-gray-500 text-xs">
                            {p.pedido.itens.map((i: any) => i.quantidade + 'x ' + i.produto?.nome).join(', ')}
                          </p>
                          {p.pedido.observacao && (
                            <p className="text-xs text-orange-600 italic">Obs: {p.pedido.observacao}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-bold text-green-600">
                              R$ {Number(p.valorEntrega || 0).toFixed(2)}
                            </p>
                            {p.status === 'ENTREGUE' && p.entregueEm && (
                              <span className="text-[10px] text-gray-400">
                                Entregue {new Date(p.entregueEm).toLocaleString('pt-BR')}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {p.status === 'PENDENTE' && (
                              <Button
                                size="sm"
                                className="bg-blue-500 hover:bg-blue-600"
                                onClick={() => updateStatus(p.id, 'ACEITO')}
                                disabled={updatingId === p.id}
                              >
                                {updatingId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Aceitar'}
                              </Button>
                            )}
                            {p.status === 'ACEITO' && (
                              <Button
                                size="sm"
                                className="bg-purple-500 hover:bg-purple-600"
                                onClick={() => updateStatus(p.id, 'EM_ROTA')}
                                disabled={updatingId === p.id}
                              >
                                {updatingId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Sair p/ Entrega'}
                              </Button>
                            )}
                            {p.status === 'EM_ROTA' && (
                              <Button
                                size="sm"
                                className="bg-green-500 hover:bg-green-600"
                                onClick={() => updateStatus(p.id, 'ENTREGUE')}
                                disabled={updatingId === p.id}
                              >
                                {updatingId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Entregue'}
                              </Button>
                            )}
                            {(p.status === 'ENTREGUE' || p.status === 'PENDENTE' || p.status === 'ACEITO' || p.status === 'EM_ROTA') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openMaps(p.endereco || p.pedido.rua + ', ' + p.pedido.numero + ' - ' + p.pedido.bairro)}
                              >
                                <MapPin className="h-3 w-3 mr-1" /> Rota
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

            </TabsContent>

            {/* Aba Relatorio */}
            <TabsContent value="relatorio" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Relatorio Financeiro</h2>
                <div className="flex gap-2">
                  {['hoje', 'semana', 'mes'].map((p) => (
                    <Button
                      key={p}
                      variant={relatorioPeriodo === p ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRelatorioPeriodo(p as 'hoje' | 'semana' | 'mes')}
                    >
                      {p === 'hoje' ? 'Hoje' : p === 'semana' ? 'Semana' : 'Mes'}
                    </Button>
                  ))}
              </div>
            </div>

            {/* Dashboard Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Diaria (Hoje)</p>
                        <p className="text-2xl font-bold text-green-600">R$ {Number(stats?.diaria || 0).toFixed(2)}</p>
                      </div>
                      <Calendar className="h-6 w-6 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Por Entrega</p>
                        <p className="text-2xl font-bold text-blue-600">R$ {Number(stats?.valorPorEntrega || 0).toFixed(2)}</p>
                      </div>
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Entregas Hoje</p>
                        <p className="text-2xl font-bold text-purple-600">{stats?.totalEntregasHoje || 0}</p>
                      </div>
                      <Truck className="h-6 w-6 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Ganho Hoje</p>
                        <p className="text-2xl font-bold text-orange-600">R$ {ganhoDiario.toFixed(2)}</p>
                      </div>
                      <Wallet className="h-6 w-6 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Resumo do Mes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Resumo do Mes
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Entregas</p>
                    <p className="text-2xl font-bold">{stats?.totalEntregasMes || 0}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Valor Entregas</p>
                    <p className="text-2xl font-bold text-blue-600">R$ {ganhoMesEntregas.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Diarias</p>
                    <p className="text-2xl font-bold text-green-600">R$ {ganhoMesDiarias.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total a Receber</p>
                    <p className="text-2xl font-bold text-orange-600">R$ {totalGanhoMes.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Separacao Recebido vs A Receber */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Controle de Pagamentos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                      <CardContent className="p-4">
                        <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-1">Ja Recebido (Pago)</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-400">R$ 0.00</p>
                        <p className="text-xs text-gray-500 mt-1">Registrar pagamentos feitos</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
                      <CardContent className="p-4">
                        <p className="text-xs text-orange-700 dark:text-orange-400 font-medium mb-1">A Receber (Pendente)</p>
                        <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">R$ {totalGanhoMes.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-1">Total do mes a ser pago</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={() => router.push('/entregador/relatorio')}>
                    <Download className="h-4 w-4 mr-2" />
                    Ver Relatorio Detalhado
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}