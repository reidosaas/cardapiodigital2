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
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import { Plus, Package, Edit2, Trash2, Star, Eye, EyeOff, X, Loader2, ImagePlus, Trash } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ProdutosPage() {
  const { user } = useAuth();
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduto, setEditingProduto] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [form, setForm] = useState({ nome: '', descricao: '', preco: '', precoPromocional: '', estoque: '0', categoriaGlobalId: '' });
  const [imagens, setImagens] = useState<string[]>([]);
  const [categoriasGlobais, setCategoriasGlobais] = useState<any[]>([]);

  const carregarProdutos = async () => {
    if (!user?.vendedor?.id) return;
    try {
      const res = await api.get(`/api/produtos/vendedor/${user.vendedor.id}`);
      setProdutos(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarProdutos();
    api.get('/api/categorias-globais').then(r => setCategoriasGlobais(r.data)).catch(() => {});
  }, [user]);

  const toggleDestaque = async (id: string) => {
    await api.patch(`/api/produtos/${id}/toggle-destaque`);
    setProdutos(produtos.map((p: any) => p.id === id ? { ...p, destaque: !p.destaque } : p));
  };

  const toggleAtivo = async (id: string) => {
    await api.patch(`/api/produtos/${id}/toggle-ativo`);
    setProdutos(produtos.map((p: any) => p.id === id ? { ...p, ativo: !p.ativo } : p));
  };

  const abrirCriar = () => {
    setEditingProduto(null);
    setForm({ nome: '', descricao: '', preco: '', precoPromocional: '', estoque: '0', categoriaGlobalId: '' });
    setImagens([]);
    setShowModal(true);
  };

  const abrirEdicao = (produto: any) => {
    setEditingProduto(produto);
    setForm({
      nome: produto.nome,
      descricao: produto.descricao || '',
      preco: String(produto.preco),
      precoPromocional: produto.precoPromocional ? String(produto.precoPromocional) : '',
      estoque: String(produto.estoque || 0),
      categoriaGlobalId: produto.categoriaGlobalId || '',
    });
    setImagens(produto.imagens || []);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nome: form.nome,
        descricao: form.descricao,
        preco: parseFloat(form.preco),
        precoPromocional: form.precoPromocional ? parseFloat(form.precoPromocional) : null,
        estoque: parseInt(form.estoque) || 0,
        imagens: imagens.length > 0 ? imagens : null,
        categoriaGlobalId: form.categoriaGlobalId || null,
      };

      if (editingProduto) {
        await api.patch(`/api/produtos/${editingProduto.id}`, payload);
        toast.success('Produto atualizado com sucesso!');
      } else {
        await api.post('/api/produtos', payload);
        toast.success('Produto criado com sucesso!');
      }

      setShowModal(false);
      setEditingProduto(null);
      carregarProdutos();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      await api.delete(`/api/produtos/${id}`);
      toast.success('Produto excluido');
      carregarProdutos();
    } catch {
      toast.error('Erro ao excluir produto');
    }
  };

  const handleUploadImagem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/upload/produto', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImagens([...imagens, res.data.url]);
      toast.success('Imagem enviada');
    } catch {
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploadingImg(false);
      e.target.value = '';
    }
  };

  const removerImagem = (index: number) => {
    setImagens(imagens.filter((_, i) => i !== index));
  };

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold">Produtos</h2>
            <p className="text-gray-500">Gerencie seu catalogo de produtos</p>
          </div>
          <Button onClick={abrirCriar}><Plus className="mr-2 h-4 w-4" /> Novo Produto</Button>
        </div>

        {produtos.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhum produto cadastrado"
            description="Adicione seu primeiro produto para comecar a vender"
            action={{ label: "Adicionar Produto", onClick: abrirCriar }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {produtos.map((produto: any) => (
              <motion.div key={produto.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
                    {produto.imagens?.[0] ? (
                      <img src={produto.imagens[0]} alt={produto.nome} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <Package size={40} />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button onClick={() => toggleDestaque(produto.id)} className={`p-1.5 rounded-lg bg-white/90 ${produto.destaque ? 'text-yellow-500' : 'text-gray-400'}`}>
                        <Star size={14} />
                      </button>
                      <button onClick={() => toggleAtivo(produto.id)} className={`p-1.5 rounded-lg bg-white/90 ${produto.ativo ? 'text-green-500' : 'text-gray-400'}`}>
                        {produto.ativo ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-sm">{produto.nome}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{produto.categoria?.nome}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{formatCurrency(produto.preco)}</p>
                        {produto.precoPromocional && (
                          <p className="text-xs text-green-600">{formatCurrency(produto.precoPromocional)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <Badge variant={produto.ativo ? 'success' : 'danger'} className="text-xs">
                        {produto.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <div className="flex gap-1">
                        <button onClick={() => abrirEdicao(produto)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(produto.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editingProduto ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-sm font-medium">Nome*</label>
                <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required placeholder="Ex: Pizza Calabresa" />
              </div>
              <div>
                <label className="text-sm font-medium">Descricao</label>
                <textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Descricao detalhada do produto..." rows={3} className="flex w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-sm font-medium">Categoria</label>
                <Select value={form.categoriaGlobalId} onValueChange={v => setForm({ ...form, categoriaGlobalId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasGlobais.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icone} {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Preco*</label>
                  <Input type="number" step="0.01" min="0" value={form.preco} onChange={e => setForm({ ...form, preco: e.target.value })} required placeholder="39.90" />
                </div>
                <div>
                  <label className="text-sm font-medium">Preco Promocional</label>
                  <Input type="number" step="0.01" min="0" value={form.precoPromocional} onChange={e => setForm({ ...form, precoPromocional: e.target.value })} placeholder="29.90" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Imagens</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {imagens.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removerImagem(i)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash size={16} className="text-white" />
                      </button>
                    </div>
                  ))}
                  <label className={`w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center cursor-pointer hover:border-primary transition-colors ${uploadingImg ? 'opacity-50 pointer-events-none' : ''}`}>
                    {uploadingImg ? <Loader2 size={20} className="animate-spin text-gray-400" /> : <ImagePlus size={20} className="text-gray-400" />}
                    <input type="file" accept="image/*" onChange={handleUploadImagem} className="hidden" />
                  </label>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Estoque</label>
                <Input type="number" min="0" value={form.estoque} onChange={e => setForm({ ...form, estoque: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {saving ? 'Salvando...' : editingProduto ? 'Atualizar Produto' : 'Criar Produto'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
