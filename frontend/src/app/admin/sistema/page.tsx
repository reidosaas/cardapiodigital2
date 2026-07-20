'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Upload, Save, Database, Shield, Wifi, Settings, Palette, Globe, Phone, Mail, MessageCircle, QrCode, Unplug, Plug } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminSistema() {
  const [config, setConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'geral' | 'whatsapp'>('geral');
  const [waStatus, setWaStatus] = useState<any>(null);
  const [waConnecting, setWaConnecting] = useState(false);
  const [waQrCode, setWaQrCode] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
    loadWhatsAppStatus();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await api.get('/api/admin/config-sistema');
      setConfig(res.data);
    } catch {
      setConfig({
        nomeSistema: 'My Love Delivery',
        corTema: '#ef4444',
        logoUrl: '',
        faviconUrl: '',
        telefone: '',
        emailContato: '',
        whatsappAdminNumero: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadWhatsAppStatus = async () => {
    try {
      const res = await api.get('/api/admin/whatsapp-admin/status');
      setWaStatus(res.data);
    } catch {
      setWaStatus({ conectado: false });
    }
  };

  const uploadLogo = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/api/upload/logo', fd);
      setConfig((prev: any) => ({ ...prev, logoUrl: res.data.url }));
      toast.success('Logo atualizada!');
    } catch {
      toast.error('Erro ao fazer upload da logo');
    }
  };

  const uploadFavicon = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/api/upload/logo', fd);
      setConfig((prev: any) => ({ ...prev, faviconUrl: res.data.url }));
      toast.success('Favicon atualizado!');
    } catch {
      toast.error('Erro ao fazer upload do favicon');
    }
  };

  const salvar = async () => {
    setSaving(true);
    try {
      await api.patch('/api/admin/config-sistema', {
        nomeSistema: config.nomeSistema,
        corTema: config.corTema,
        logoUrl: config.logoUrl,
        faviconUrl: config.faviconUrl,
        telefone: config.telefone,
        emailContato: config.emailContato,
        whatsappAdminNumero: config.whatsappAdminNumero,
      });
      toast.success('Configuracoes salvas!');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const conectarWhatsApp = async () => {
    setWaConnecting(true);
    setWaQrCode(null);
    try {
      const res = await api.post('/api/admin/whatsapp-admin/conectar');
      if (res.data.qrcode) {
        setWaQrCode(res.data.qrcode);
        toast.success('Escaneie o QR Code com seu WhatsApp');
      }
      loadWhatsAppStatus();
    } catch {
      toast.error('Erro ao conectar WhatsApp');
    } finally {
      setWaConnecting(false);
    }
  };

  const desconectarWhatsApp = async () => {
    try {
      await api.post('/api/admin/whatsapp-admin/desconectar');
      setWaStatus({ conectado: false });
      setWaQrCode(null);
      toast.success('WhatsApp desconectado');
    } catch {
      toast.error('Erro ao desconectar');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="h-10 w-10 animate-spin text-primary border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-gray-500">Carregando...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold">Configuracao do Sistema</h2>
            <p className="text-gray-500">Gerencie as configuracoes gerais da plataforma</p>
          </div>
          <Button onClick={salvar} disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-0">
          {[
            { id: 'geral', label: 'Geral', icon: Settings },
            { id: 'whatsapp', label: 'WhatsApp Admin', icon: MessageCircle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Geral */}
        {activeTab === 'geral' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><Palette size={18} /> Logo & Aparencia</h3>
                
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                    {config.logoUrl ? (
                      <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Upload className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Logo do Sistema</p>
                    <p className="text-xs text-gray-400 mb-2">PNG ou JPG, recomendado 512x512px</p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors cursor-pointer">
                      <Upload size={14} /> Escolher arquivo
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }} />
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                    {config.faviconUrl ? (
                      <img src={config.faviconUrl} alt="Favicon" className="w-full h-full object-contain" />
                    ) : (
                      <Upload className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Favicon</p>
                    <p className="text-xs text-gray-400 mb-2">ICO ou PNG, recomendado 64x64px ou 128x128px</p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors cursor-pointer">
                      <Upload size={14} /> Escolher arquivo
                      <input type="file" accept="image/*,.ico" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFavicon(f); }} />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-500">Nome do Sistema</label>
                  <Input value={config.nomeSistema || ''} onChange={(e) => setConfig({ ...config, nomeSistema: e.target.value })} className="mt-1" placeholder="My Love Delivery" />
                </div>

                <div>
                  <label className="text-sm text-gray-500">Cor do Tema</label>
                  <div className="flex items-center gap-3 mt-1">
                    <input type="color" value={config.corTema || '#ef4444'} onChange={(e) => setConfig({ ...config, corTema: e.target.value })} className="h-10 w-14 rounded cursor-pointer" />
                    <span className="text-sm text-gray-600">{config.corTema}</span>
                  </div>
                </div>

                {(config.logoUrl || config.faviconUrl) && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-400 mb-2">Preview</p>
                    <div className="flex items-center gap-3">
                      {config.logoUrl && <img src={config.logoUrl} alt="Preview Logo" className="h-10 w-10 rounded-lg object-contain" />}
                      <span className="text-lg font-bold" style={{ color: config.corTema }}>{config.nomeSistema}</span>
                      {config.faviconUrl && <img src={config.faviconUrl} alt="Preview Favicon" className="h-6 w-6 rounded object-contain" />}
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><Globe size={18} /> Informacoes de Contato</h3>
                <div>
                  <label className="text-sm text-gray-500">Telefone</label>
                  <Input value={config.telefone || ''} onChange={(e) => setConfig({ ...config, telefone: e.target.value })} className="mt-1" placeholder="(11) 99999-9999" />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email de Contato</label>
                  <Input type="email" value={config.emailContato || ''} onChange={(e) => setConfig({ ...config, emailContato: e.target.value })} className="mt-1" placeholder="contato@mylovedelivery.com" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab: WhatsApp Admin */}
        {activeTab === 'whatsapp' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><MessageCircle size={18} /> WhatsApp do Admin</h3>
                <p className="text-sm text-gray-500">
                  Conecte o WhatsApp do admin para receber notificacoes de cadastros, relatorios diarios e alertas de disco.
                </p>

                <div>
                  <label className="text-sm text-gray-500">Numero WhatsApp do Admin (destino das notificacoes)</label>
                  <Input
                    value={config.whatsappAdminNumero || ''}
                    onChange={(e) => setConfig({ ...config, whatsappAdminNumero: e.target.value })}
                    className="mt-1"
                    placeholder="5511999999999"
                  />
                  <p className="text-xs text-gray-400 mt-1">Formato: codigo do pais + DDD + numero (ex: 5511999999999)</p>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className={`h-3 w-3 rounded-full ${waStatus?.conectado ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-medium">
                    {waStatus?.conectado ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}
                  </span>
                </div>

                <div className="flex gap-2">
                  {!waStatus?.conectado ? (
                    <Button onClick={conectarWhatsApp} disabled={waConnecting} className="bg-green-600 hover:bg-green-700">
                      <Plug className="mr-2 h-4 w-4" />
                      {waConnecting ? 'Conectando...' : 'Conectar WhatsApp'}
                    </Button>
                  ) : (
                    <Button onClick={desconectarWhatsApp} variant="destructive">
                      <Unplug className="mr-2 h-4 w-4" />
                      Desconectar
                    </Button>
                  )}
                </div>

                {waQrCode && (
                  <div className="mt-4 p-4 bg-white rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center gap-3">
                    <QrCode size={24} className="text-gray-400" />
                    <p className="text-sm text-gray-500">Escaneie com seu WhatsApp</p>
                    <img src={waQrCode} alt="QR Code" className="w-64 h-64 object-contain" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><MessageCircle size={18} /> Notificacoes</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span className="text-lg">🏪</span>
                    <div>
                      <p className="text-sm font-medium">Novo Vendedor</p>
                      <p className="text-xs text-gray-500">Notificado quando um vendedor se cadastra</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span className="text-lg">🛵</span>
                    <div>
                      <p className="text-sm font-medium">Novo Entregador</p>
                      <p className="text-xs text-gray-500">Notificado quando um entregador se cadastra</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span className="text-lg">👤</span>
                    <div>
                      <p className="text-sm font-medium">Novo Cliente</p>
                      <p className="text-xs text-gray-500">Notificado quando um cliente se cadastra</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span className="text-lg">📊</span>
                    <div>
                      <p className="text-sm font-medium">Relatorio Diario (8h)</p>
                      <p className="text-xs text-gray-500">CPU, RAM, Disco, Docker - todo dia as 8h</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span className="text-lg">⚠️</span>
                    <div>
                      <p className="text-sm font-medium">Alerta Disco {'>'}80%</p>
                      <p className="text-xs text-gray-500">Verificado a cada hora</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Status Cards */}
        {activeTab === 'geral' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Database, title: 'Banco de Dados', desc: 'Status: Conectado', action: 'Verificar' },
              { icon: Shield, title: 'Seguranca', desc: 'Firewall ativo, SSL configurado', action: 'Configurar' },
              { icon: Wifi, title: 'APIs Externas', desc: 'WhatsApp, OpenAI, Mercado Pago', action: 'Testar' },
              { icon: Settings, title: 'Cache e Performance', desc: 'Redis configurado', action: 'Otimizar' },
            ].map((item, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{item.title}</h3>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">{item.action}</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
