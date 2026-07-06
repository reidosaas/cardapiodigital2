'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loading } from '@/components/shared/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Store, QrCode, Link2, Palette, Image, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

export default function CatalogoPage() {
  const { user } = useAuth();
  const [vendedor, setVendedor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.vendedor?.id) {
      api.get(`/api/vendedores/${user.vendedor.id}`)
        .then((res) => setVendedor(res.data))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const catalogoUrl = vendedor?.slug
    ? `${window.location.origin}/catalogo/${vendedor.slug}`
    : '';

  const copyLink = () => {
    navigator.clipboard.writeText(catalogoUrl);
    toast.success('Link copiado!');
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
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 text-sm cursor-pointer hover:bg-gray-200 transition-colors">
                    {vendedor?.bannerUrl ? (
                      <img src={vendedor.bannerUrl} alt="Banner" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      'Adicionar Banner'
                    )}
                  </div>
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 text-sm cursor-pointer hover:bg-gray-200 transition-colors">
                    {vendedor?.logoUrl ? (
                      <img src={vendedor.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      'Adicionar Logo'
                    )}
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
