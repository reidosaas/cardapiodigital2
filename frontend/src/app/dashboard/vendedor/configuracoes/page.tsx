'use client';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Store, Globe, Clock, Palette, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function ConfiguracoesPage() {
  const { user } = useAuth();

  const salvar = async () => {
    try {
      await api.patch(`/api/vendedores/${user?.vendedor?.id}`, {});
      toast.success('Configuracoes salvas!');
    } catch {
      toast.error('Erro ao salvar');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Configuracoes</h2>
            <p className="text-gray-500">Personalize sua loja</p>
          </div>
          <Button onClick={salvar}><Save className="mr-2 h-4 w-4" /> Salvar</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Store size={18} /> Dados da Loja</h3>
              <div>
                <label className="text-sm text-gray-500">Nome da Loja</label>
                <Input defaultValue={user?.vendedor?.nomeLoja} className="mt-1" />
              </div>
              <div>
                <label className="text-sm text-gray-500">Slug (URL)</label>
                <Input defaultValue={user?.vendedor?.slug} className="mt-1" />
              </div>
              <div>
                <label className="text-sm text-gray-500">Descricao</label>
                <textarea className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm mt-1" rows={3} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Clock size={18} /> Horarios</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Abertura</label>
                  <Input type="time" defaultValue="08:00" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Fechamento</label>
                  <Input type="time" defaultValue="22:00" className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Tempo de preparo (min)</label>
                <Input type="number" defaultValue={30} className="mt-1" />
              </div>
              <div>
                <label className="text-sm text-gray-500">Tipo de entrega</label>
                <Select defaultValue="ENTREGA">
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTREGA">Entrega</SelectItem>
                    <SelectItem value="RETIRADA">Retirada</SelectItem>
                    <SelectItem value="LOCAL">Consumo no Local</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Palette size={18} /> Aparencia</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Cor Primaria</label>
                  <input type="color" defaultValue="#6C63FF" className="h-10 w-full rounded mt-1 cursor-pointer" />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Modo Escuro</label>
                  <div className="mt-1">
                    <Select defaultValue="false">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">Claro</SelectItem>
                        <SelectItem value="true">Escuro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
