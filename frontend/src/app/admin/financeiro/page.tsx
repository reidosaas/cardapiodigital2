'use client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function AdminFinanceiro() {
  return (
    <DashboardLayout>
      <div>
        <h2 className="text-2xl font-bold">Financeiro</h2>
        <p className="text-gray-500">Gerenciamento financeiro do sistema</p>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {[
            { label: 'Faturamento Total', value: 'R$ 0,00' },
            { label: 'Comissoes', value: 'R$ 0,00' },
            { label: 'Assinantes', value: '0' },
          ].map((item, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border p-6">
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="text-2xl font-bold mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
