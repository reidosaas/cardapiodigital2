'use client';
import { useState } from 'react';
import { Send, Loader2, CreditCard, MapPin, User, Phone } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface CheckoutPanelProps {
  cartItems: { produtoId: string; nome: string; preco: number; quantidade: number; observacao?: string }[];
  total: number;
  vendedor: {
    id: string;
    whatsappNumero?: string | null;
    taxaEntrega?: number | null;
    entregaTipo?: string | null;
  };
  corPrimaria?: string;
  onSuccess: () => void;
}

export function CheckoutPanel({ cartItems, total, vendedor, corPrimaria, onSuccess }: CheckoutPanelProps) {
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ nome: '', telefone: '', observacao: '', tipoEntrega: 'RETIRADA', enderecoEntrega: '' });

  const handleSubmit = async () => {
    if (!form.nome || !form.telefone) {
      toast.error('Preencha nome e telefone');
      return;
    }
    setSubmitting(true);
    try {
      const pedido = await api.post('/api/pedidos', {
        vendedorId: vendedor.id,
        clienteNome: form.nome,
        clienteTelefone: form.telefone,
        items: cartItems.map((i) => ({
          produtoId: i.produtoId,
          nome: i.nome,
          quantidade: i.quantidade,
          precoUnitario: i.preco,
          total: i.preco * i.quantidade,
          observacao: i.observacao,
        })),
        total,
        taxaEntrega: form.tipoEntrega === 'ENTREGA' ? (vendedor.taxaEntrega || 0) : 0,
        observacao: form.observacao,
        tipoEntrega: form.tipoEntrega,
        enderecoEntrega: form.tipoEntrega === 'ENTREGA' ? form.enderecoEntrega : undefined,
        origem: 'catalogo',
      });

      if (vendedor.whatsappNumero) {
        const msg = formatWhatsAppMessage(pedido.data, form);
        window.open(`https://wa.me/${vendedor.whatsappNumero.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
      }

      toast.success('Pedido realizado com sucesso!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message?.[0] || 'Erro ao criar pedido');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="relative">
          <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Seu nome *" value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>
        <div className="relative">
          <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="tel" placeholder="Telefone / WhatsApp *" value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {['RETIRADA', 'ENTREGA'].map((tipo) => (
            <button
              key={tipo}
              onClick={() => setForm({ ...form, tipoEntrega: tipo })}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                form.tipoEntrega === tipo
                  ? 'text-white border-transparent'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400'
              }`}
              style={form.tipoEntrega === tipo ? { backgroundColor: corPrimaria || '#2563eb' } : {}}
            >
              {tipo === 'RETIRADA' ? 'Retirar' : 'Entrega'}
            </button>
          ))}
        </div>
        {form.tipoEntrega === 'ENTREGA' && (
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Endereco de entrega *" value={form.enderecoEntrega}
              onChange={(e) => setForm({ ...form, enderecoEntrega: e.target.value })}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>
        )}
        <textarea
          placeholder="Observacao (opcional)"
          value={form.observacao}
          onChange={(e) => setForm({ ...form, observacao: e.target.value })}
          rows={2}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
        />
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-medium">R$ {total.toFixed(2)}</span>
        </div>
        {form.tipoEntrega === 'ENTREGA' && vendedor.taxaEntrega && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Taxa de entrega</span>
            <span className="font-medium">R$ {Number(vendedor.taxaEntrega).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
          <span>Total</span>
          <span>R$ {(total + (form.tipoEntrega === 'ENTREGA' ? Number(vendedor.taxaEntrega || 0) : 0)).toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: corPrimaria || '#2563eb' }}
      >
        {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        {submitting ? 'Enviando...' : 'Fazer Pedido'}
      </button>
    </div>
  );
}

function formatWhatsAppMessage(pedido: any, form: any): string {
  const itens = pedido.itens?.map((i: any) => `${i.quantidade}x ${i.nome} - R$ ${Number(i.total).toFixed(2)}`).join('\n') || '';
  return [
    `*Novo Pedido - Cardapio Digital*`,
    ``,
    `*Cliente:* ${form.nome}`,
    `*Telefone:* ${form.telefone}`,
    `*Tipo:* ${form.tipoEntrega === 'ENTREGA' ? 'Entrega' : 'Retirada'}`,
    form.tipoEntrega === 'ENTREGA' ? `*Endereco:* ${form.enderecoEntrega}` : '',
    form.observacao ? `*Obs:* ${form.observacao}` : '',
    ``,
    `*Itens:*`,
    itens,
    ``,
    `*Total:* R$ ${Number(pedido.total).toFixed(2)}`,
    ``,
    `*Pedido #${pedido.id.slice(0, 8)}*`,
  ].filter(Boolean).join('\n');
}
