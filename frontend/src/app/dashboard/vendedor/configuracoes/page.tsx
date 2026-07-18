'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Store, Globe, Clock, Palette, Save, MessageCircle, QrCode, Power, PowerOff, RefreshCw, Upload, Truck, Smartphone, Key, Link2, MapPin, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ConfiguracoesPage() {
  const { user, refresh } = useAuth();
  const { setTheme } = useAppTheme();
  const [whatsStatus, setWhatsStatus] = useState<any>(null);
  const [qrcode, setQrcode] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [entregadorLoginUrl, setEntregadorLoginUrl] = useState('');

  const themeInitRef = useRef(false);
  useEffect(() => {
    if (themeInitRef.current) return;
    if (user?.vendedor) {
      themeInitRef.current = true;
      const modoEscuro = user.vendedor.modoEscuro;
      const horario = user.vendedor.horarioFuncionamento || {};
      setForm({
        nomeLoja: user.vendedor.nomeLoja || '',
        slug: user.vendedor.slug || '',
        descricao: user.vendedor.descricao || '',
        corPrimaria: user.vendedor.corPrimaria || '#6C63FF',
        modoEscuro: modoEscuro ? 'true' : 'false',
        logoUrl: user.vendedor.logoUrl || '',
        bannerUrl: user.vendedor.bannerUrl || '',
        tempoPreparoMin: user.vendedor.tempoPreparoMin || 30,
        entregaTipo: user.vendedor.entregaTipo || 'ENTREGA',
        taxaEntrega: user.vendedor.taxaEntrega || 0,
        whatsappNumero: user.vendedor.whatsappNumero || '',
        rua: user.vendedor.rua || '',
        numero: user.vendedor.numero || '',
        bairro: user.vendedor.bairro || '',
        cidade: user.vendedor.cidade || '',
        estado: user.vendedor.estado || '',
        cep: user.vendedor.cep || '',
        horarioAbertura: horario.abre || '08:00',
        horarioFechamento: horario.fecha || '22:00',
      });
      setTheme(modoEscuro ? 'dark' : 'light');
      setEntregadorLoginUrl(`${window.location.origin}/entregador/login`);
    }
  }, [user, setTheme]);

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
      const isDark = form.modoEscuro === 'true';
      const payload = {
        nomeLoja: form.nomeLoja,
        descricao: form.descricao,
        corPrimaria: form.corPrimaria,
        modoEscuro: isDark,
        logoUrl: form.logoUrl,
        bannerUrl: form.bannerUrl,
        tempoPreparoMin: Number(form.tempoPreparoMin),
        entregaTipo: form.entregaTipo,
        taxaEntrega: Number(form.taxaEntrega),
        whatsappNumero: form.whatsappNumero,
        rua: form.rua,
        numero: form.numero,
        bairro: form.bairro,
        cidade: form.cidade,
        estado: form.estado,
        cep: form.cep,
        horarioFuncionamento: {
          abre: form.horarioAbertura,
          fecha: form.horarioFechamento,
        },
      };
      await api.patch(`/api/vendedores/${user?.vendedor?.id}`, payload);
      setTheme(isDark ? 'dark' : 'light');
      await refresh();
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
                <textarea value={form.descricao} readOnly
                  className="flex w-full rounded-lg border border-input bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm mt-1" rows={3} />
                <p className="text-xs text-gray-400 mt-1">A descricao nao pode ser alterada</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Link do Cardapio</label>
                <div className="mt-1 flex items-center gap-2 p-3 rounded-lg border bg-gray-50 dark:bg-gray-800">
                  <Globe className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300 break-all">
                    {typeof window !== 'undefined' ? `${window.location.origin}/catalogo/${form.slug || '...'}` : ''}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><MapPin size={18} /> Endereco da Loja</h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-sm text-gray-500">Rua / Avenida</label>
                    <Input value={form.rua} onChange={(e) => setForm({ ...form, rua: e.target.value })} className="mt-1" placeholder="Rua Exemplo" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Numero</label>
                    <Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} className="mt-1" placeholder="123" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Bairro</label>
                  <Input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} className="mt-1" placeholder="Centro" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-sm text-gray-500">Cidade</label>
                    <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} className="mt-1" placeholder="Sao Paulo" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">UF</label>
                    <Input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className="mt-1" placeholder="SP" maxLength={2} />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">CEP</label>
                  <Input value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} className="mt-1" placeholder="01001-000" />
                </div>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-500">Horario de Abertura</label>
                  <Input type="time" value={form.horarioAbertura} onChange={(e) => setForm({ ...form, horarioAbertura: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Horario de Fechamento</label>
                  <Input type="time" value={form.horarioFechamento} onChange={(e) => setForm({ ...form, horarioFechamento: e.target.value })} className="mt-1" />
                </div>
              </div>
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
                  <label className="text-sm text-gray-500">Tema do Painel</label>
                  <Select value={form.modoEscuro} onValueChange={(v) => {
                    setForm({ ...form, modoEscuro: v });
                    setTheme(v === 'true' ? 'dark' : 'light');
                  }}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">Claro</SelectItem>
                      <SelectItem value="true">Escuro</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-gray-400 mt-1">Altera o tema do painel e do catalogo</p>
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

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Smartphone size={18} /> Login do Entregador</h3>
              <p className="text-sm text-gray-500">QR Code para o entregador acessar a area de trabalho</p>
              <div className="flex gap-2">
                <Input value={entregadorLoginUrl} readOnly className="flex-1" />
                <Button variant="outline" onClick={() => { navigator.clipboard.writeText(entregadorLoginUrl); toast.success('Link copiado!'); }}>
                  <Link2 className="mr-2 h-4 w-4" /> Copiar
                </Button>
              </div>
              <div className="bg-white p-4 rounded-xl inline-block mb-4">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(entregadorLoginUrl)}`} alt="QR Code Entregador" className="mx-auto w-48 h-48" />
              </div>
              <p className="text-xs text-gray-400">Entregador escaneia para acessar: /entregador/login</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
