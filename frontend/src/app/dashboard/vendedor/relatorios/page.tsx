'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import { Download, BarChart3, Bike, Users, Calendar, Eye, X, ChevronDown, ChevronUp, Phone, DollarSign, CheckCircle, Clock, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

type Aba = 'vendas' | 'entregas';

export default function RelatoriosPage() {
  const { user } = useAuth();
  const [aba, setAba] = useState<Aba>('vendas');
  const [vendas, setVendas] = useState<any>(null);
  const [entregas, setEntregas] = useState<any[]>([]);
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedEntregador, setSelectedEntregador] = useState<any>(null);
  const [detalhesEntregador, setDetalhesEntregador] = useState<any>(null);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);
  const [diasAbertos, setDiasAbertos] = useState<Record<string, boolean>>({});

  const carregarVendas = async () => {
    if (!user?.vendedor?.id) return;
    const fim = new Date(dataFim);
    const inicio = new Date(dataInicio);
    const res = await api.get(`/api/relatorios/vendas/${user.vendedor.id}`, {
      params: { inicio: inicio.toISOString(), fim: fim.toISOString() },
    });
    setVendas(res.data);
  };

  const carregarEntregas = async () => {
    if (!user?.vendedor?.id) return;
    try {
      const res = await api.get(`/api/entregadores/relatorio/vendedor/${user.vendedor.id}`, {
        params: { dataInicio, dataFim },
      });
      setEntregas(res.data);
    } catch { toast.error('Erro ao carregar relatorio de entregas'); }
  };

  const abrirDetalhes = async (grupo: any) => {
    const entregadorId = grupo.entregador.id;
    if (entregadorId === 'terceirizado') {
      toast.info('Entregador terceirizado sem detalhes individuais');
      return;
    }
    setSelectedEntregador(grupo);
    setLoadingDetalhes(true);
    setDetalhesEntregador(null);
    try {
      const res = await api.get(`/api/entregadores/relatorio/entregador/${entregadorId}`, {
        params: { dataInicio, dataFim },
      });
      setDetalhesEntregador(res.data);
    } catch {
      toast.error('Erro ao carregar detalhes');
    } finally {
      setLoadingDetalhes(false);
    }
  };

  const toggleDia = (dia: string) => {
    setDiasAbertos((prev) => ({ ...prev, [dia]: !prev[dia] }));
  };

  useEffect(() => { if (user?.vendedor?.id) carregarVendas(); }, [user, dataInicio, dataFim]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold">Relatorios</h2>
            <p className="text-gray-500">Vendas e entregas</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}><Download className="mr-2 h-4 w-4" /> Exportar</Button>
          </div>
        </div>

        <div className="flex gap-2 border-b pb-2">
          <button onClick={() => setAba('vendas')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${aba === 'vendas' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            <BarChart3 size={16} className="inline mr-1" /> Vendas
          </button>
          <button onClick={() => { setAba('entregas'); if (entregas.length === 0) carregarEntregas(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${aba === 'entregas' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            <Bike size={16} className="inline mr-1" /> Entregas
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Calendar size={16} className="text-gray-400" />
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm" />
          <span className="text-gray-400">ate</span>
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm" />
          {aba === 'entregas' && (
            <Button size="sm" onClick={carregarEntregas}>Filtrar</Button>
          )}
        </div>

        {aba === 'vendas' && vendas && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card><CardContent className="p-4">
                <p className="text-sm text-gray-500">Total de Vendas</p>
                <p className="text-2xl font-bold">{formatCurrency(vendas.total)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <p className="text-sm text-gray-500">Pedidos</p>
                <p className="text-2xl font-bold">{vendas.totalPedidos}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <p className="text-sm text-gray-500">Ticket Medio</p>
                <p className="text-2xl font-bold">{formatCurrency(vendas.ticketMedio)}</p>
              </CardContent></Card>
            </div>

            <Card><CardContent className="p-6">
              <h3 className="font-semibold mb-4">Vendas por Dia</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(vendas.vendasPorDia || {}).map(([dia, valor]) => ({ dia, valor }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dia" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="valor" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent></Card>
          </>
        )}

        {aba === 'entregas' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card><CardContent className="p-4">
                <p className="text-sm text-gray-500">Total Entregadores</p>
                <p className="text-2xl font-bold">{entregas.length}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <p className="text-sm text-gray-500">Total Entregas</p>
                <p className="text-2xl font-bold">{entregas.reduce((s: number, g: any) => s + g.total, 0)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <p className="text-sm text-gray-500">Ganho Total</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(entregas.reduce((s: number, g: any) => s + g.ganho, 0))}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <p className="text-sm text-gray-500">Dias no Periodo</p>
                <p className="text-2xl font-bold">{Math.ceil((new Date(dataFim).getTime() - new Date(dataInicio).getTime()) / (1000 * 60 * 60 * 24)) + 1}</p>
              </CardContent></Card>
            </div>

            {entregas.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-white dark:bg-gray-900 rounded-xl border">
                <Bike className="h-12 w-12 mx-auto mb-3" />
                <p>Nenhuma entrega no periodo</p>
              </div>
            ) : (
              <div className="space-y-4">
                {entregas.map((grupo: any) => (
                  <Card key={grupo.entregador.id}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Users size={18} className="text-primary" />
                          <h3 className="font-bold text-lg">{grupo.entregador.nome}</h3>
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                            grupo.entregador.id !== 'terceirizado' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {grupo.entregador.id !== 'terceirizado' ? 'Cadastrado' : 'Terceirizado'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="hidden sm:flex gap-4 text-sm">
                            <span className="text-gray-500">{grupo.total} entrega(s)</span>
                            <span className="font-semibold text-primary">{formatCurrency(grupo.ganho)}</span>
                          </div>
                          {grupo.entregador.id !== 'terceirizado' && (
                            <Button size="sm" variant="outline" onClick={() => abrirDetalhes(grupo)}>
                              <Eye size={14} className="mr-1" /> Detalhes
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left text-gray-400 text-xs uppercase">
                              <th className="pb-2 pr-3">Pedido</th>
                              <th className="pb-2 pr-3">Data</th>
                              <th className="pb-2 pr-3">Cliente</th>
                              <th className="pb-2 pr-3">Tipo</th>
                              <th className="pb-2 pr-3">Status</th>
                              <th className="pb-2 text-right">Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {grupo.entregas.map((e: any) => (
                              <tr key={e.id} className="border-b last:border-0">
                                <td className="py-2 pr-3 font-medium">
                                  #{e.pedido?.codigo ? String(e.pedido.codigo).padStart(8, '0') : e.pedido?.id?.slice(0, 6) || '-'}
                                </td>
                                <td className="py-2 pr-3 text-gray-500">{new Date(e.createdAt).toLocaleDateString('pt-BR')}</td>
                                <td className="py-2 pr-3">{e.pedido?.clienteNome || '-'}</td>
                                <td className="py-2 pr-3">{e.pedido?.tipoEntrega === 'ENTREGA' ? 'Entrega' : 'Retirada'}</td>
                                <td className="py-2 pr-3">
                                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                                    e.status === 'ENTREGUE' ? 'bg-green-100 text-green-700' :
                                    e.status === 'EM_ROTA' ? 'bg-blue-100 text-blue-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>{e.status}</span>
                                </td>
                                <td className="py-2 text-right">{formatCurrency(e.pedido?.total || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {selectedEntregador && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto bg-black/50" onClick={() => { setSelectedEntregador(null); setDetalhesEntregador(null); }}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 flex items-center justify-between p-6 pb-4 border-b rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold">{selectedEntregador.entregador.nome}</h3>
                <p className="text-sm text-gray-500">Dashboard do entregador</p>
              </div>
              <button onClick={() => { setSelectedEntregador(null); setDetalhesEntregador(null); }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {loadingDetalhes ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : detalhesEntregador ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <Card><CardContent className="p-3 text-center">
                      <Bike size={18} className="mx-auto mb-1 text-primary" />
                      <p className="text-xs text-gray-500">Total Entregas</p>
                      <p className="text-xl font-bold">{detalhesEntregador.totalEntregas}</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-3 text-center">
                      <CheckCircle size={18} className="mx-auto mb-1 text-green-500" />
                      <p className="text-xs text-gray-500">Entregues</p>
                      <p className="text-xl font-bold text-green-600">{detalhesEntregador.totalEntregues}</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-3 text-center">
                      <Calendar size={18} className="mx-auto mb-1 text-blue-500" />
                      <p className="text-xs text-gray-500">Dias Trabalhados</p>
                      <p className="text-xl font-bold">{detalhesEntregador.totalDiasTrabalhados}</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-3 text-center">
                      <DollarSign size={18} className="mx-auto mb-1 text-primary" />
                      <p className="text-xs text-gray-500">Ganho Total</p>
                      <p className="text-xl font-bold text-primary">{formatCurrency(detalhesEntregador.totalGanho)}</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-3 text-center">
                      <Clock size={18} className="mx-auto mb-1 text-amber-500" />
                      <p className="text-xs text-gray-500">Total Diarias</p>
                      <p className="text-xl font-bold text-amber-600">{formatCurrency(detalhesEntregador.totalDiarias)}</p>
                    </CardContent></Card>
                  </div>

                  {/* Resumo Financeiro */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                      <CardContent className="p-3 text-center">
                        <CheckCircle size={16} className="mx-auto mb-1 text-green-600 dark:text-green-400" />
                        <p className="text-xs text-gray-500">Ja Recebido</p>
                        <p className="text-lg font-bold text-green-700 dark:text-green-300">{formatCurrency(detalhesEntregador.jaRecebido || 0)}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                      <CardContent className="p-3 text-center">
                        <Clock size={16} className="mx-auto mb-1 text-blue-600 dark:text-blue-400" />
                        <p className="text-xs text-gray-500">Diarias Recebidas</p>
                        <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatCurrency(detalhesEntregador.diariasRecebidas || 0)}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
                      <CardContent className="p-3 text-center">
                        <Bike size={16} className="mx-auto mb-1 text-purple-600 dark:text-purple-400" />
                        <p className="text-xs text-gray-500">Entregas Recebidas</p>
                        <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{formatCurrency(detalhesEntregador.entregasRecebidas || 0)}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                      <CardContent className="p-3 text-center">
                        <Clock size={16} className="mx-auto mb-1 text-yellow-600 dark:text-yellow-400" />
                        <p className="text-xs text-gray-500">A Receber</p>
                        <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{formatCurrency(detalhesEntregador.aReceber || 0)}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Calendar size={16} className="text-primary" />
                      Entregas por Dia
                    </h4>
                    <div className="space-y-3">
                      {detalhesEntregador.dias.map((dia: any) => (
                        <Card key={dia.dia} className="overflow-hidden">
                          <button onClick={() => toggleDia(dia.dia)}
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="bg-primary/10 rounded-lg p-2">
                                <Calendar size={16} className="text-primary" />
                              </div>
                              <div className="text-left">
                                <p className="font-semibold">{dia.dia}</p>
                                <p className="text-xs text-gray-500">{dia.total} entrega(s)</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-medium text-primary">{formatCurrency(dia.ganho)}</span>
                              {diasAbertos[dia.dia] ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                            </div>
                          </button>
                          {diasAbertos[dia.dia] && (
                            <div className="border-t px-4 pb-4">
                              <table className="w-full text-sm mt-3">
                                <thead>
                                  <tr className="border-b text-left text-gray-400 text-xs uppercase">
                                    <th className="pb-2 pr-3">Hora</th>
                                    <th className="pb-2 pr-3">Pedido</th>
                                    <th className="pb-2 pr-3">Cliente</th>
                                    <th className="pb-2 pr-3">Tipo</th>
                                    <th className="pb-2 pr-3">Status</th>
                                    <th className="pb-2 text-right">Valor Pedido</th>
                                    <th className="pb-2 text-right">Ganho</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {dia.entregas.map((e: any) => (
                                    <tr key={e.id} className="border-b last:border-0">
                                      <td className="py-2 pr-3 text-gray-500">{new Date(e.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                                      <td className="py-2 pr-3 font-medium">
                                        #{e.pedido?.codigo ? String(e.pedido.codigo).padStart(8, '0') : e.pedido?.id?.slice(0, 6) || '-'}
                                      </td>
                                      <td className="py-2 pr-3">{e.pedido?.clienteNome || '-'}</td>
                                      <td className="py-2 pr-3">{e.pedido?.tipoEntrega === 'ENTREGA' ? 'Entrega' : 'Retirada'}</td>
                                      <td className="py-2 pr-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                                          e.status === 'ENTREGUE' ? 'bg-green-100 text-green-700' :
                                          e.status === 'EM_ROTA' ? 'bg-blue-100 text-blue-700' :
                                          'bg-yellow-100 text-yellow-700'
                                        }`}>{e.status}</span>
                                      </td>
                                      <td className="py-2 text-right">{formatCurrency(e.pedido?.total || 0)}</td>
                                      <td className="py-2 text-right font-medium text-primary">
                                        {e.status === 'ENTREGUE' ? formatCurrency(Number(detalhesEntregador.entregador.valorPorEntrega)) : '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Bike size={16} className="text-primary" />
                      Todas as Entregas do Periodo
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-gray-400 text-xs uppercase">
                            <th className="pb-2 pr-3">Data</th>
                            <th className="pb-2 pr-3">Pedido</th>
                            <th className="pb-2 pr-3">Cliente</th>
                            <th className="pb-2 pr-3">Tipo</th>
                            <th className="pb-2 pr-3">Endereco</th>
                            <th className="pb-2 pr-3">Status</th>
                            <th className="pb-2 text-right">Valor Pedido</th>
                            <th className="pb-2 text-right">Ganho</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detalhesEntregador.entregas.map((e: any) => (
                            <tr key={e.id} className="border-b last:border-0">
                              <td className="py-2 pr-3 text-gray-500 whitespace-nowrap">
                                {new Date(e.createdAt).toLocaleDateString('pt-BR')} {new Date(e.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-2 pr-3 font-medium">
                                #{e.pedido?.codigo ? String(e.pedido.codigo).padStart(8, '0') : e.pedido?.id?.slice(0, 6) || '-'}
                              </td>
                              <td className="py-2 pr-3">{e.pedido?.clienteNome || '-'}</td>
                              <td className="py-2 pr-3">{e.pedido?.tipoEntrega === 'ENTREGA' ? 'Entrega' : 'Retirada'}</td>
                              <td className="py-2 pr-3 text-gray-500 max-w-[150px] truncate">
                                {e.pedido?.enderecoEntrega || '-'}
                              </td>
                              <td className="py-2 pr-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                  e.status === 'ENTREGUE' ? 'bg-green-100 text-green-700' :
                                  e.status === 'EM_ROTA' ? 'bg-blue-100 text-blue-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>{e.status}</span>
                              </td>
                              <td className="py-2 text-right">{formatCurrency(e.pedido?.total || 0)}</td>
                              <td className="py-2 text-right font-medium text-primary">
                                {e.status === 'ENTREGUE' ? formatCurrency(Number(detalhesEntregador.entregador.valorPorEntrega)) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
