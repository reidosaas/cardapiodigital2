'use client';
import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loading } from '@/components/shared/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Store, QrCode, Link2, Palette, Image, Globe, Upload, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

export default function CatalogoPage() {
  const { user } = useAuth();
  const [vendedor, setVendedor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const bannerRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const fetchVendedor = () => {
    if (user?.vendedor?.id) {
      api.get(`/api/vendedores/${user.vendedor.id}`)
        .then((res) => setVendedor(res.data))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => { fetchVendedor(); }, [user]);

  const catalogoUrl = vendedor?.slug
    ? `${window.location.origin}/catalogo/${vendedor.slug}`
    : '';

  const copyLink = () => {
    navigator.clipboard.writeText(catalogoUrl);
    toast.success('Link copiado!');
  };

  const uploadFile = async (file: File, tipo: 'banner' | 'logo') => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post(`/api/upload/${tipo}`, fd);
    await api.patch(`/api/vendedores/${user?.vendedor?.id}`, { [`${tipo}Url`]: res.data.url });
    fetchVendedor();
    toast.success(`${tipo === 'logo' ? 'Logo' : 'Banner'} atualizado!`);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadingBanner(true);
    try { await uploadFile(f, 'banner'); } catch { toast.error('Erro ao fazer upload do banner'); }
    finally { setUploadingBanner(false); if (bannerRef.current) bannerRef.current.value = ''; }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadingLogo(true);
    try { await uploadFile(f, 'logo'); } catch { toast.error('Erro ao fazer upload da logo'); }
    finally { setUploadingLogo(false); if (logoRef.current) logoRef.current.value = ''; }
  };

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Catalogo</h2>
          <p className="text-gray-500">Personalize a aparencia do seu catalogo</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Globe size={18} /> Link do Catalogo</h3>
                <div className="flex gap-2">
                  <Input value={catalogoUrl} readOnly className="flex-1" />
                  <Button variant="outline" onClick={copyLink}><Link2 className="mr-2 h-4 w-4" /> Copiar</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Palette size={18} /> Personalizacao</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Cor Primaria</label>
                    <div className="flex gap-2 mt-1">
                      <input type="color" value={vendedor?.corPrimaria || '#6C63FF'} className="h-10 w-10 rounded cursor-pointer" />
                      <Input value={vendedor?.corPrimaria || '#6C63FF'} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Nome da Loja</label>
                    <Input value={vendedor?.nomeLoja || ''} className="mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Image size={18} /> Banner & Logo</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Banner (1920x480px recomendado)</p>
                    <input ref={bannerRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                    <div onClick={() => bannerRef.current?.click()}
                      className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 text-sm cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700">
                      {uploadingBanner ? (
                        <div className="flex flex-col items-center gap-2"><Loader2 size={24} className="animate-spin text-primary" /><span>Enviando...</span></div>
                      ) : vendedor?.bannerUrl ? (
                        <img src={vendedor.bannerUrl} alt="Banner" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <div className="flex flex-col items-center gap-2"><Upload size={24} /><span>Adicionar Banner</span></div>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Logo (quadrado recomendado)</p>
                    <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    <div onClick={() => logoRef.current?.click()}
                      className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 text-sm cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700">
                      {uploadingLogo ? (
                        <div className="flex flex-col items-center gap-2"><Loader2 size={24} className="animate-spin text-primary" /><span>Enviando...</span></div>
                      ) : vendedor?.logoUrl ? (
                        <img src={vendedor.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <div className="flex flex-col items-center gap-2"><Upload size={24} /><span>Adicionar Logo</span></div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold mb-4">QR Code</h3>
                <div className="bg-white p-4 rounded-xl inline-block mb-4">
                  {catalogoUrl && <QRCodeSVG value={catalogoUrl} size={200} />}
                </div>
                <p className="text-sm text-gray-500 mb-4">Escaneie para acessar o catalogo</p>
                <Button className="w-full" variant="outline" onClick={() => {}}>
                  <QrCode className="mr-2 h-4 w-4" /> Baixar QR Code
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
