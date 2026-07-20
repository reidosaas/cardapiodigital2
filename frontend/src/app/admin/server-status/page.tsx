'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import {
  Activity,
  HardDrive,
  Cpu,
  MemoryStick,
  Clock,
  Server,
  RefreshCw,
  Database,
  Globe,
  Container,
} from 'lucide-react';

export default function ServerStatusPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadStatus = async () => {
    try {
      const res = await api.get('/api/admin/server-status');
      setStatus(res.data);
      setError('');
    } catch {
      setError('Erro ao carregar status do servidor');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadStatus();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="h-10 w-10 animate-spin text-primary border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-gray-500">Carregando status...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <p className="text-red-500">{error}</p>
            <Button onClick={handleRefresh}>Tentar novamente</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const s = status;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold">Status do Servidor</h2>
            <p className="text-gray-500">Monitoramento em tempo real do servidor</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Atualiza a cada 30s</span>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Info geral */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Server className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Hostname</p>
                  <p className="font-medium text-sm">{s.hostname}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Uptime</p>
                  <p className="font-medium text-sm">{s.uptimeFormatted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Node.js</p>
                  <p className="font-medium text-sm">{s.nodeVersion}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Load Average</p>
                  <p className="font-medium text-sm">{s.loadAvg?.join(' / ')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CPU & RAM */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Cpu size={18} /> CPU</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Modelo</span>
                  <span className="font-medium">{s.cpu?.model}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Nucleos</span>
                  <span className="font-medium">{s.cpu?.cores}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Uso estimado</span>
                  <span className="font-medium">{s.cpu?.usage}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, s.cpu?.usage || 0)}%`,
                      backgroundColor: (s.cpu?.usage || 0) > 80 ? '#ef4444' : (s.cpu?.usage || 0) > 50 ? '#f59e0b' : '#22c55e',
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><MemoryStick size={18} /> Memoria RAM</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total</span>
                  <span className="font-medium">{s.memory?.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Usado</span>
                  <span className="font-medium">{s.memory?.used}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Livre</span>
                  <span className="font-medium">{s.memory?.free}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Uso</span>
                  <span className="font-medium">{s.memory?.percent}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${s.memory?.percent || 0}%`,
                      backgroundColor: (s.memory?.percent || 0) > 80 ? '#ef4444' : (s.memory?.percent || 0) > 50 ? '#f59e0b' : '#22c55e',
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Disco */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><HardDrive size={18} /> Disco</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="font-medium">{s.disk?.total}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Usado</p>
                <p className="font-medium">{s.disk?.used}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Disponivel</p>
                <p className="font-medium">{s.disk?.available}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Uso</p>
                <p className="font-medium">{s.disk?.percent}</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-500"
                style={{
                  width: s.disk?.percent || '0%',
                  backgroundColor: parseInt(s.disk?.percent || '0') > 80 ? '#ef4444' : parseInt(s.disk?.percent || '0') > 60 ? '#f59e0b' : '#22c55e',
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Docker + Services */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Container size={18} /> Servicos Docker</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <Database size={16} className="text-blue-500" />
                <span className="text-sm font-medium flex-1">PostgreSQL</span>
                <span className="text-xs text-gray-500">{s.postgresVersion?.substring(0, 50)}...</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <Activity size={16} className="text-red-500" />
                <span className="text-sm font-medium flex-1">Redis</span>
                <span className={`text-xs font-medium ${s.redisStatus === 'Conectado' ? 'text-green-500' : 'text-red-500'}`}>
                  {s.redisStatus}
                </span>
              </div>
              {s.dockerContainers?.map((c: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <Container size={16} className="text-gray-400" />
                  <span className="text-sm font-medium flex-1">{c.name}</span>
                  <span className="text-xs text-gray-500">{c.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
