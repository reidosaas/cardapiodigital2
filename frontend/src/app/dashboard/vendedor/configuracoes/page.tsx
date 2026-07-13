'use client';
import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Store, Globe, Clock, Palette, Save, MessageCircle, QrCode, Power, PowerOff, RefreshCw, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const [whatsStatus, setWhatsStatus] = useState<any>(null);
  const [qrcode, setQrcode] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.vendedor) {
      setForm({
        nomeLoja: user.vendedor.nomeLoja || '',
        slug: user.vendedor.slug || '',
        descricao: user.vendedor.descricao || '',
        corPrimaria: user.vendedor.corPrimaria || '#6C63FF',
        modoEscuro: user.vendedor.modoEscuro ? 'true' : 'false',
        logoUrl: user.vendedor.logoUrl || '',
        bannerUrl: user.vendedor.bannerUrl || '',
        tempoPreparoMin: user.vendedor.tempoPreparoMin || 30,
        entregaTipo: user.vendedor.entregaTipo || 'ENTREGA',
        taxaEntrega: user.vendedor.taxaEntrega || 0,
        whatsappNumero: user.vendedor.whatsappNumero || '',
      });
    }
  }, [user]);

  const checkWhatsStatus = useCallback(async () => {
    if (!user?.vendedor?.id) return;
    try {
      const res = await api.get('/api/whatsapp/status');
      setWhatsStatus(res.data);
      if (res.data?.conectado) setQrcode('');
    } catch {
      setWhatsStatus({ conectado: false });
    }
  }, [user]);

  useEffect(() => {
    checkWhatsStatus();
    const interval = setInterval(checkWhatsStatus, 5000);
    return () => clearInterval(interval);
  }, [checkWhatsStatus]);

  const conectarWhats = async () => {
    setConnecting(true);
    setQrcode('');
    try {
      const res = await api.post('/api/whatsapp/conectar');
      if (res.data.qrcode) setQrcode(res.data.qrcode);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao conectar');
    } finally {
      setConnecting(false);
    }
  };

  const desconectarWhats = async () => {
    try {
      await api.post('/api/whatsapp/desconectar');
      setWhatsStatus({ conectado: false });
      setQrcode('');
      toast.success('WhatsApp desconectado');
    } catch {
      toast.error('Erro ao desconectar');
    }
  };

  const uploadImagem = async (file: File, tipo: 'logo' | 'banner') => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post(`/api/upload/${tipo}`, fd);
    setForm((prev: any) => ({ ...prev, [`${tipo}Url`]: res.data.url }));
    toast.success(`${tipo === 'logo' ? 'Logo' : 'Banner'} salvo!`);
  };

  const salvar = async () => {
    setSaving(true);
    try {
      const payload = {
        nomeLoja: form.nomeLoja,
        slug: form.slug,
        descricao: form.descricao,
        corPrimaria: form.corPrimaria,
        modoEscuro: form.modoEscuro === 'true',
        logoUrl: form.logoUrl,
        bannerUrl: form.bannerUrl,
        tempoPreparoMin: Number(form.tempoPreparoMin),
        entregaTipo: form.entregaTipo,
        taxaEntrega: Number(form.taxaEntrega),
        whatsappNumero: form.whatsappNumero,
      };
      await api.patch(`/api/vendedores/${user?.vendedor?.id}`, payload);
      toast.success('Configuracoes salvas!');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (!user?.vendedor) return <DashboardLayout><p className="text-gray-500">Carregando...</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold">Configuracoes</h2>
            <p className="text-gray-500">Personalize sua loja</p>
          </div>
          <Button onClick={salvar} disabled={saving}><Save className="mr-2 h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar'}</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Store size={18} /> Dados da Loja</h3>
              <div>
                <label className="text-sm text-gray-500">Nome da Loja</label>
                <Input value={form.nomeLoja} onChange={(e) => setForm({ ...form, nomeLoja: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-sm text-gray-500">WhatsApp (numero)</label>
                <Input value={form.whatsappNumero} onChange={(e) => setForm({ ...form, whatsappNumero: e.target.value })} className="mt-1" placeholder="5511999999999" />
              </div>
              <div>
                <label className="text-sm text-gray-500">Descricao</label>
                <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm mt-1" rows={3} />
              </div>
              <div>
                <label className="text-sm text-gray-500">Slug (link do cardapio)</label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="mt-1" placeholder="minha-loja" />
                <p className="text-xs text-gray-400 mt-1">
                  Link: {typeof window !== 'undefined' ? `${window.location.origin}/catalogo/${form.slug || '...'}` : ''}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Upload size={18} /> Logo & Banner</h3>
              <div>
                <label className="text-sm text-gray-500">Logo</label>
                <Input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) try { await uploadImagem(f, 'logo'); } catch { toast.error('Erro ao fazer upload'); } }} className="mt-1 text-sm" />
                {form.logoUrl && <img src={form.logoUrl} alt="logo" className="h-12 mt-2 rounded-lg object-contain border" />}
              </div>
              <div>
                <label className="text-sm text-gray-500">Banner</label>
                <Input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) try { await uploadImagem(f, 'banner'); } catch { toast.error('Erro ao fazer upload'); } }} className="mt-1 text-sm" />
                {form.bannerUrl && <img src={form.bannerUrl} alt="banner" className="h-20 mt-2 rounded-lg object-cover w-full border" />}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Clock size={18} /> Horarios & Entrega</h3>
              <div>
                <label className="text-sm text-gray-500">Tempo de preparo (min)</label>
                <Input type="number" value={form.tempoPreparoMin} onChange={(e) => setForm({ ...form, tempoPreparoMin: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-sm text-gray-500">Tipo de entrega padrao</label>
                <Select value={form.entregaTipo} onValueChange={(v) => setForm({ ...form, entregaTipo: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTREGA">Entrega</SelectItem>
                    <SelectItem value="RETIRADA">Retirada</SelectItem>
                    <SelectItem value="LOCAL">Consumo no Local</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-500">Taxa de entrega (R$)</label>
                <Input type="number" step="0.01" value={form.taxaEntrega} onChange={(e) => setForm({ ...form, taxaEntrega: e.target.value })} className="mt-1" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><MessageCircle size={18} /> WhatsApp</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <Badge variant={whatsStatus?.conectado ? 'success' : 'danger'}>
                  {whatsStatus?.conectado ? 'Conectado' : 'Desconectado'}
                </Badge>
              </div>
              <p className="text-xs text-gray-400">Conecte seu WhatsApp para receber pedidos via IA</p>
              {!whatsStatus?.conectado ? (
                <Button onClick={conectarWhats} variant="gradient" className="w-full" disabled={connecting}>
                  {connecting ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Gerando...</> : <><QrCode className="mr-2 h-4 w-4" /> Conectar WhatsApp</>}
                </Button>
              ) : (
                <Button onClick={desconectarWhats} variant="destructive" className="w-full">
                  <PowerOff className="mr-2 h-4 w-4" /> Desconectar
                </Button>
              )}
              {qrcode && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center pt-2">
                  <div className="bg-white p-3 rounded-xl inline-block shadow-md">
                    <img src={qrcode.startsWith('data:') ? qrcode : `data:image/png;base64,${qrcode}`} alt="QR Code WhatsApp" className="mx-auto w-48 h-48" />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Abra o WhatsApp &gt; Menu &gt; Dispositivos Conectados &gt; Conectar</p>
                </motion.div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Palette size={18} /> Aparencia</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Cor Primaria</label>
                  <input type="color" value={form.corPrimaria} onChange={(e) => setForm({ ...form, corPrimaria: e.target.value })} className="h-10 w-full rounded mt-1 cursor-pointer" />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Modo Escuro</label>
                  <Select value={form.modoEscuro} onValueChange={(v) => setForm({ ...form, modoEscuro: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">Claro</SelectItem>
                      <SelectItem value="true">Escuro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-8 h-8 rounded-full border-2" style={{ backgroundColor: form.corPrimaria }} />
                <span className="text-sm text-gray-500">{form.corPrimaria}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Globe size={18} /> Dominio</h3>
              <div>
                <label className="text-sm text-gray-500">Dominio Personalizado</label>
                <Input placeholder="meusalgados.com.br" className="mt-1" />
                <p className="text-xs text-gray-400 mt-1">Faca o apontamento do DNS para o IP do servidor</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
