'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Map, Navigation, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface RotaPedido {
  id: string;
  codigo: number;
  endereco: string;
  bairro?: string;
  numero?: string;
  total: number;
  status: string;
  cliente?: { nome: string; telefone: string };
}

export default function EntregadorRotasPage() {
  const [pedidos, setPedidos] = useState<RotaPedido[]>([]);
  const [ordem, setOrdem] = useState<RotaPedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculando, setCalculando] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token_entregador') : null;

  const fetchPedidos = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/entregador/pedidos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const pendentes = data.filter((p: any) => ['ACEITO', 'EM_ROTA'].includes(p.status));
        setPedidos(pendentes);
        if (ordem.length === 0) setOrdem(pendentes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, ordem.length]);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrdem = [...ordem];
    [newOrdem[index - 1], newOrdem[index]] = [newOrdem[index], newOrdem[index - 1]];
    setOrdem(newOrdem);
  };

  const moveDown = (index: number) => {
    if (index === ordem.length - 1) return;
    const newOrdem = [...ordem];
    [newOrdem[index], newOrdem[index + 1]] = [newOrdem[index + 1], newOrdem[index]];
    setOrdem(newOrdem);
  };

  const otimizarRota = () => {
    setCalculando(true);
    setTimeout(() => {
      const otimizado = [...ordem].sort((a, b) => {
        const bA = a.bairro?.toLowerCase() || '';
        const bB = b.bairro?.toLowerCase() || '';
        if (bA < bB) return -1;
        if (bA > bB) return 1;
        const nA = parseInt(a.numero || '0') || 0;
        const nB = parseInt(b.numero || '0') || 0;
        return nA - nB;
      });
      setOrdem(otimizado);
      setCalculando(false);
      toast.success('Rota otimizada por bairro!');
    }, 1000);
  };

  const abrirGoogleMaps = () => {
    if (ordem.length === 0) return;
    const origin = 'Current+Location';
    const waypoints = ordem.slice(0, -1).map(
      (p) => encodeURIComponent(p.endereco || 'Sem endereco')
    );
    const destination = ordem[ordem.length - 1];
    const destStr = encodeURIComponent(destination.endereco || 'Sem endereco');

    let url = `https://www.google.com/maps/dir/${origin}`;
    if (waypoints.length > 0) {
      url += `/${waypoints.join('/')}`;
    }
    url += `/${destStr}`;
    url += '/data=!3m1!4b1!4m2!4m1!3e0';

    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Otimizador de Rotas</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={otimizarRota}
            disabled={calculando || ordem.length < 2}
          >
            {calculando ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Navigation className="h-4 w-4 mr-1" />}
            Otimizar
          </Button>
          <Button
            className="bg-green-500 hover:bg-green-600"
            onClick={abrirGoogleMaps}
            disabled={ordem.length === 0}
          >
            <Map className="h-4 w-4 mr-1" />
            Abrir no Maps
          </Button>
        </div>
      </div>

      {ordem.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Map className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum pedido aceito/em rota para otimizar</p>
            <p className="text-sm mt-1">Aceite pedidos primeiro para montar sua rota</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ordem.map((p, index) => (
            <Card key={p.id} className="relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-10 bg-red-500 flex items-center justify-center text-white font-bold text-lg">
                {index + 1}
              </div>
              <CardContent className="pl-14 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">#{p.codigo}</p>
                    <p className="text-xs text-gray-600">
                      {p.endereco || 'Sem endereco'}
                    </p>
                    {p.cliente && (
                      <p className="text-xs text-gray-500">{p.cliente.nome}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveDown(index)}
                      disabled={index === ordem.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Badge variant="outline" className="ml-2">
                      R$ {Number(p.total || 0).toFixed(2)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
