'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loading } from '@/components/shared/loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, QrCode, Settings, Power, PowerOff, Bot, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function WhatsAppPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<any>(null);
  const [qrcode, setQrcode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.vendedor?.id) {
      api.get(`/api/whatsapp/status/${user.vendedor.id}`)
        .then((res) => setStatus(res.data))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const conectar = async () => {
    try {
      const res = await api.post(`/api/whatsapp/conectar/${user?.vendedor?.id}`);
      setQrcode(res.data.qrcode);
      toast.success('QR Code gerado! Escaneie com o WhatsApp');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao conectar');
    }
  };

  const desconectar = async () => {
    await api.post(`/api/whatsapp/desconectar/${user?.vendedor?.id}`);
    setStatus({ conectado: false });
    setQrcode('');
    toast.success('WhatsApp desconectado');
  };

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">WhatsApp</h2>
          <p className="text-gray-500">Conecte seu WhatsApp para automatizar atendimentos</p>
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
                    <p className="text-sm text-gray-500">Conecte seu WhatsApp para receber pedidos automaticamente</p>
                    <Button onClick={conectar} variant="gradient">
                      <QrCode className="mr-2 h-4 w-4" /> Conectar WhatsApp
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto">
                      <Power className="h-10 w-10 text-green-600" />
                    </div>
                    <p className="text-sm text-green-600 font-medium">WhatsApp conectado e funcional!</p>
                    <Button onClick={desconectar} variant="destructive">
                      <PowerOff className="mr-2 h-4 w-4" /> Desconectar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {qrcode && (
              <Card className="mt-4">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold mb-4">Escaneie o QR Code</h3>
                  <img src={qrcode} alt="QR Code WhatsApp" className="mx-auto w-48 h-48" />
                  <p className="text-sm text-gray-500 mt-4">
                    Abra o WhatsApp &gt; Menu &gt; Dispositivos Conectados &gt; Conectar um dispositivo
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-6 flex items-center gap-2">
                  <Bot size={18} /> Automacao & IA
                </h3>
                <div className="space-y-4">
                  {['Boas Vindas', 'Cardapio Digital', 'Encerramento'].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-sm font-medium">{item}</span>
                      <Badge variant="success">Ativo</Badge>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full"><Settings className="mr-2 h-4 w-4" /> Configurar Mensagens</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Configuracoes</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Resposta automatica', value: 'Ativado' },
                    { label: 'Chatbot IA', value: 'Configurar' },
                    { label: 'Mensagens programadas', value: '0 ativas' },
                    { label: 'Disparo em massa', value: 'Indisponivel' },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-500">{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
