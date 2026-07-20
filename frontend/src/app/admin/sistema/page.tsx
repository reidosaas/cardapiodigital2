'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Upload, Save, Database, Shield, Wifi, Settings, Palette, Globe, Phone, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminSistema() {
  const [config, setConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
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
        telefone: '',
        emailContato: '',
      });
    } finally {
      setLoading(false);
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

  const salvar = async () => {
    setSaving(true);
    try {
      await api.patch('/api/admin/config-sistema', {
        nomeSistema: config.nomeSistema,
        corTema: config.corTema,
        logoUrl: config.logoUrl,
        telefone: config.telefone,
        emailContato: config.emailContato,
      });
      toast.success('Configuracoes salvas!');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Logo & Aparencia */}
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
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadLogo(f);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500">Nome do Sistema</label>
                <Input
                  value={config.nomeSistema || ''}
                  onChange={(e) => setConfig({ ...config, nomeSistema: e.target.value })}
                  className="mt-1"
                  placeholder="My Love Delivery"
                />
              </div>

              <div>
                <label className="text-sm text-gray-500">Cor do Tema</label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="color"
                    value={config.corTema || '#ef4444'}
                    onChange={(e) => setConfig({ ...config, corTema: e.target.value })}
                    className="h-10 w-14 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">{config.corTema}</span>
                </div>
              </div>

              {config.logoUrl && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-2">Preview</p>
                  <div className="flex items-center gap-3">
                    <img src={config.logoUrl} alt="Preview" className="h-10 w-10 rounded-lg object-contain" />
                    <span className="text-lg font-bold" style={{ color: config.corTema }}>{config.nomeSistema}</span>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Globe size={18} /> Informacoes de Contato</h3>
              <div>
                <label className="text-sm text-gray-500">Telefone</label>
                <Input
                  value={config.telefone || ''}
                  onChange={(e) => setConfig({ ...config, telefone: e.target.value })}
                  className="mt-1"
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500">Email de Contato</label>
                <Input
                  type="email"
                  value={config.emailContato || ''}
                  onChange={(e) => setConfig({ ...config, emailContato: e.target.value })}
                  className="mt-1"
                  placeholder="contato@mylovedelivery.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Status Cards */}
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
      </div>
    </DashboardLayout>
  );
}
