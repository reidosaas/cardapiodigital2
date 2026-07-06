'use client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function AdminPlanos() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Gerenciar Planos</h2>
        <p className="text-gray-500">Configure os planos de assinatura do sistema</p>
        
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { nome: 'Gratuito', preco: 'R$ 0', features: ['10 produtos', 'Catalogo basico'], cor: 'gray' },
            { nome: 'Basico', preco: 'R$ 29,90', features: ['50 produtos', 'Catalogo premium', 'Chatbot'], cor: 'primary' },
            { nome: 'Profissional', preco: 'R$ 79,90', features: ['Ilimitado', 'Dominio propio', 'IA'], cor: 'purple' },
          ].map((plano, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border p-6">
              <h3 className="text-lg font-bold">{plano.nome}</h3>
              <p className="text-3xl font-bold mt-2">{plano.preco}<span className="text-sm text-gray-500">/mes</span></p>
              <ul className="mt-4 space-y-2">
                {plano.features.map((f, j) => (
                  <li key={j} className="text-sm text-gray-600 dark:text-gray-400">- {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
