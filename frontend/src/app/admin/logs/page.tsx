'use client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function AdminLogs() {
  return (
    <DashboardLayout>
      <div>
        <h2 className="text-2xl font-bold">Logs do Sistema</h2>
        <p className="text-gray-500">Auditoria e registros de atividades</p>
        <div className="mt-6 bg-white dark:bg-gray-900 rounded-xl border p-8 text-center text-gray-400">
          <p>Logs serao exibidos aqui a medida que o sistema for utilizado</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
