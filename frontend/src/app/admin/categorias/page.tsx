'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loading } from '@/components/shared/loading';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { Tags, Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

const ICONES = ['🥩', '🥤', '🍰', '🍕', '🥗', '🌮', '🍦', '🍟', '🥟', '🍜', '🍣', '🥪', '🧁', '🍩', '🍪', '🥨', '🧀', '🥓', '🍗', '🥩'];

export default function AdminCategoriasPage() {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: '', descricao: '', icone: '' });

  const carregar = async () => {
    try {
      const { data } = await api.get('/api/admin/categorias-globais');
      setCategorias(data);
    } catch {
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const salvar = async () => {
    if (!form.nome.trim()) { toast.error('Nome e obrigatorio'); return; }
    try {
      if (editId) {
        await api.patch(`/api/admin/categorias-globais/${editId}`, form);
        toast.success('Categoria atualizada');
      } else {
        await api.post('/api/admin/categorias-globais', form);
        toast.success('Categoria criada');
      }
      setForm({ nome: '', descricao: '', icone: '' });
      setEditId(null);
      carregar();
    } catch {
      toast.error('Erro ao salvar');
    }
  };

  const editar = (cat: any) => {
    setEditId(cat.id);
    setForm({ nome: cat.nome, descricao: cat.descricao || '', icone: cat.icone || '' });
  };

  const remover = async (id: string) => {
    if (!confirm('Remover esta categoria?')) return;
    try {
      await api.delete(`/api/admin/categorias-globais/${id}`);
      setCategorias((prev) => prev.filter((c) => c.id !== id));
      toast.success('Categoria removida');
    } catch {
      toast.error('Erro ao remover');
    }
  };

  const cancelar = () => {
    setEditId(null);
    setForm({ nome: '', descricao: '', icone: '' });
  };

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Categorias Globais</h2>
            <p className="text-gray-500">{categorias.length} categorias cadastradas</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
          <h3 className="font-medium mb-3">{editId ? 'Editar' : 'Nova'} Categoria</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-gray-500 mb-1 block">Nome</label>
              <Input
                placeholder="Ex: Lanches Artesanais"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-gray-500 mb-1 block">Descricao</label>
              <Input
                placeholder="Descricao opcional"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Icone</label>
              <Select
                value={form.icone}
                onValueChange={(v) => setForm({ ...form, icone: v })}
              >
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="🔄" />
                </SelectTrigger>
                <SelectContent>
                  {ICONES.map((ic) => (
                    <SelectItem key={ic} value={ic}>{ic}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={salvar}>
                <Plus className="h-4 w-4 mr-1" />
                {editId ? 'Atualizar' : 'Adicionar'}
              </Button>
              {editId && (
                <Button variant="ghost" onClick={cancelar}>Cancelar</Button>
              )}
            </div>
          </div>
        </div>

        {categorias.length === 0 ? (
          <EmptyState icon={Tags} title="Nenhuma categoria" description="Crie a primeira categoria acima" />
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="w-12 p-4"></th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">Nome</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-500">Descricao</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-500">Produtos</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-500">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {categorias.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-4 text-center text-xl">{cat.icone || '📁'}</td>
                    <td className="p-4 text-sm font-medium">{cat.nome}</td>
                    <td className="p-4 text-sm text-gray-500">{cat.descricao || '-'}</td>
                    <td className="p-4 text-sm text-center">{cat._count?.produtos || 0}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editar(cat)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => remover(cat.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
