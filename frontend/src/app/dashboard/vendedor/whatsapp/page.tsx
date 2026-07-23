'use client';
import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loading } from '@/components/shared/loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, QrCode, Power, PowerOff, Bot, MessageCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function WhatsAppPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<any>(null);
  const [qrcode, setQrcode] = useState('');
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!user?.vendedor?.id) return;
    try {
      const res = await api.get('/api/whatsapp/status');
      setStatus(res.data);
    } catch {
      setStatus({ conectado: false });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  useEffect(() => {
    if (status?.conectado) setQrcode('');
  }, [status?.conectado]);

  const conectar = async () => {
    setConnecting(true);
    setQrcode('');
    try {
      const res = await api.post('/api/whatsapp/conectar');
      if (res.data.connected) {
        toast.success('WhatsApp ja esta conectado!');
      } else if (res.data.qrcode) {
        setQrcode(res.data.qrcode);
        toast.success('QR Code gerado! Escaneie com o WhatsApp');
      } else {
        toast.info(res.data.message || 'QR Code indisponivel. Tente novamente.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao conectar');
    } finally {
      setConnecting(false);
    }
  };

  const desconectar = async () => {
    try {
      await api.post('/api/whatsapp/desconectar');
      setStatus({ conectado: false });
      setQrcode('');
      toast.success('WhatsApp desconectado');
    } catch {
      toast.error('Erro ao desconectar');
    }
  };

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">WhatsApp</h2>
          <p className="text-gray-500">Conecte seu WhatsApp para automatizar atendimentos com IA</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MessageCircle size={18} /> Conexao
                  </h3>
                  <Badge variant={status?.conectado ? 'success' : 'danger'}>
                    {status?.conectado ? 'Conectado' : 'Desconectado'}
                  </Badge>
                </div>

                {!status?.conectado ? (
                  <div className="text-center space-y-4">
                    <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto">
                      <MessageSquare className="h-10 w-10 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-500">
                      Conecte seu WhatsApp para receber pedidos automaticamente via IA
                    </p>
                    <Button onClick={conectar} variant="gradient" disabled={connecting}>
                      {connecting ? (
                        <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Gerando QR Code...</>
                      ) : (
                        <><QrCode className="mr-2 h-4 w-4" /> Conectar WhatsApp</>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto">
                      <Power className="h-10 w-10 text-green-600" />
                    </div>
                    <p className="text-sm text-green-600 font-medium">WhatsApp conectado</p>
                    <p className="text-xs text-gray-400">Pedidos via WhatsApp serao processados pela IA</p>
                    <Button onClick={desconectar} variant="destructive">
                      <PowerOff className="mr-2 h-4 w-4" /> Desconectar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {qrcode && typeof qrcode === 'string' && qrcode.length > 10 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="mt-4 border-2 border-green-200 dark:border-green-800">
                  <CardContent className="p-6 text-center">
                    <h3 className="font-semibold mb-2 text-lg">Escaneie o QR Code</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Abra o WhatsApp no celular &gt; Menu &gt; Dispositivos Conectados &gt; Conectar
                    </p>
                    <div className="bg-white p-4 rounded-xl inline-block shadow-md">
                      <img
                        src={qrcode.startsWith('data:') ? qrcode : `data:image/png;base64,${qrcode}`}
                        alt="QR Code WhatsApp"
                        className="mx-auto w-56 h-56"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-4">
                      O status sera atualizado automaticamente apos a conexao
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-6 flex items-center gap-2">
                  <Bot size={18} /> Automacao com IA
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="text-sm font-medium mb-1">Atendimento Inteligente</h4>
                    <p className="text-xs text-gray-500">
                      A IA recebe pedidos, calcula valores e atualiza o kanban automaticamente
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="text-sm font-medium mb-1">Fluxo do Pedido</h4>
                    <p className="text-xs text-gray-500">
                      Cliente envia msg {'>'} IA identifica produto {'>'} pergunta variação {'>'} 
                      quantidade {'>'} confirma {'>'} pedido criado no kanban
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Informacoes</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status da IA</span>
                    <Badge variant="success">Ativo</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">QR Code no painel</span>
                    <Badge variant={status?.conectado ? 'success' : 'warning'}>
                      {status?.conectado ? 'Conectado' : 'Pendente'}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Integracao</span>
                    <span className="font-medium">Uazapi</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
