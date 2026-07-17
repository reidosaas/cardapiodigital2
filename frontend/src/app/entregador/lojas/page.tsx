'use client';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Store,
  MapPin,
  Navigation,
  Clock,
  DollarSign,
  CheckCircle,
  X,
  Link,
  Phone,
  Calendar,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface LojaInfo {
  id: string;
  nomeLoja: string;
  slug: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

interface Vinculo {
  id: string;
  status: string;
  diaria: number;
  valorPorEntrega: number;
  createdAt: string;
  loja: LojaInfo;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDENTE: { label: 'Pendente', color: 'text-yellow-700', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  ACEITO: { label: 'Ativo', color: 'text-green-700', bg: 'bg-green-100 dark:bg-green-900/30' },
  RECUSADO: { label: 'Recusado', color: 'text-red-700', bg: 'bg-red-100 dark:bg-red-900/30' },
};

export default function EntregadorLojasPage() {
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [processandoVinculo, setProcessandoVinculo] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token_entregador') : null;

  const fetchVinculos = useCallback(async () => {
    if (!token) {
      window.location.href = '/entregador/login';
      return;
    }
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${baseUrl}/api/entregador/vinculos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        localStorage.removeItem('token_entregador');
        localStorage.removeItem('loja_entregador');
        window.location.href = '/entregador/login';
        return;
      }
      if (res.ok) {
        setVinculos(await res.json());
      }
    } catch (err) {
      console.error('Erro ao buscar vinculos:', err);
      toast.error('Erro ao carregar lojas vinculadas');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchVinculos();
  }, [fetchVinculos]);

  const aceitarVinculo = async (vinculoId: string) => {
    if (!token) return;
    setProcessandoVinculo(vinculoId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/entregador/vinculo/${vinculoId}/aceitar`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erro ao aceitar vinculo');
      toast.success('Vinculo aceito com sucesso!');
      fetchVinculos();
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
      fetchVinculos();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessandoVinculo(null);
    }
  };

  const getEnderecoCompleto = (loja: LojaInfo) => {
    const parts = [loja.endereco, loja.cidade, loja.estado, loja.cep].filter(Boolean);
    return parts.join(', ') || 'Endereco nao cadastrado';
  };

  const openMaps = (endereco: string) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(endereco)}`, '_blank');
  };

  const openWaze = (endereco: string) => {
    window.open(`https://waze.com/ul?navigate=yes&address=${encodeURIComponent(endereco)}`, '_blank');
  };

  const vinculosPendentes = vinculos.filter((v) => v.status === 'PENDENTE');
  const vinculosAtivos = vinculos.filter((v) => v.status === 'ACEITO');
  const vinculosRecusados = vinculos.filter((v) => v.status === 'RECUSADO');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Minhas Lojas</h1>
        <p className="text-gray-500 text-sm">{vinculosAtivos.length} loja(s) ativa(s) · {vinculosPendentes.length} pendente(s)</p>
      </div>

      {/* Vinculos Pendentes */}
      {vinculosPendentes.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Link className="h-5 w-5 text-orange-500" />
              Convites Pendentes ({vinculosPendentes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {vinculosPendentes.map((v) => (
              <div key={v.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 border space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <Store className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="font-bold">{v.loja.nomeLoja}</p>
                      <p className="text-xs text-gray-500">{getEnderecoCompleto(v.loja)}</p>
                    </div>
                  </div>
                  <Badge className={statusConfig.PENDENTE.bg + ' ' + statusConfig.PENDENTE.color}>
                    {statusConfig.PENDENTE.label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">Diaria</p>
                      <p className="font-bold">R$ {Number(v.diaria).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">Por Entrega</p>
                      <p className="font-bold">R$ {Number(v.valorPorEntrega).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-green-500 hover:bg-green-600"
                    onClick={() => aceitarVinculo(v.id)}
                    disabled={processandoVinculo === v.id}
                  >
                    {processandoVinculo === v.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Aceitar
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => recusarVinculo(v.id)}
                    disabled={processandoVinculo === v.id}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Recusar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Lojas Ativas */}
      {vinculosAtivos.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Lojas Ativas
          </h2>

          <div className="grid gap-4">
            {vinculosAtivos.map((v) => (
              <Card key={v.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className="flex-1 p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xl">
                            {v.loja.nomeLoja.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-lg">{v.loja.nomeLoja}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Vinculado em {new Date(v.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <Badge className={statusConfig.ACEITO.bg + ' ' + statusConfig.ACEITO.color}>
                          {statusConfig.ACEITO.label}
                        </Badge>
                      </div>

                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                        <span>{getEnderecoCompleto(v.loja)}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-center">
                          <p className="text-[10px] text-green-600 dark:text-green-400 uppercase font-medium">Diaria</p>
                          <p className="text-xl font-bold text-green-700 dark:text-green-400">R$ {Number(v.diaria).toFixed(2)}</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-center">
                          <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-medium">Por Entrega</p>
                          <p className="text-xl font-bold text-blue-700 dark:text-blue-400">R$ {Number(v.valorPorEntrega).toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => openMaps(getEnderecoCompleto(v.loja))}
                        >
                          <MapPin className="h-3.5 w-3.5 mr-1" />
                          Google Maps
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => openWaze(getEnderecoCompleto(v.loja))}
                        >
                          <Navigation className="h-3.5 w-3.5 mr-1" />
                          Waze
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Lojas Recusadas */}
      {vinculosRecusados.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-gray-500">
            <X className="h-5 w-5" />
            Convites Recusados ({vinculosRecusados.length})
          </h2>

          <div className="grid gap-3">
            {vinculosRecusados.map((v) => (
              <div key={v.id} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 opacity-60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                      <Store className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">{v.loja.nomeLoja}</p>
                      <p className="text-xs text-gray-400">{getEnderecoCompleto(v.loja)}</p>
                    </div>
                  </div>
                  <Badge className={statusConfig.RECUSADO.bg + ' ' + statusConfig.RECUSADO.color}>
                    {statusConfig.RECUSADO.label}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {vinculos.length === 0 && (
        <Card className="w-full">
          <CardContent className="py-16 text-center">
            <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold mb-2">Nenhuma loja vinculada</h2>
            <p className="text-gray-500 max-w-sm mx-auto">
              Aguarde um lojista te vincular informando seu email. Os convites aparecerão aqui para você aceitar ou recusar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
