'use client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Database, Shield, Wifi } from 'lucide-react';

export default function AdminSistema() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Configuracao do Sistema</h2>
        <div className="grid md:grid-cols-2 gap-6">
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
