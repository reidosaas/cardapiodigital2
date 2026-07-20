'use client';
import { useState, useEffect } from 'react';
import { Send, Loader2, CreditCard, MapPin, User, Phone, X } from 'lucide-react';
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
    lojaAberta?: boolean;
  };
  corPrimaria?: string;
  onSuccess: () => void;
}

export function CheckoutPanel({ cartItems, total, vendedor, corPrimaria, onSuccess }: CheckoutPanelProps) {
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [clienteLogado, setClienteLogado] = useState<any>(null);
  const [enderecos, setEnderecos] = useState<any[]>([]);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState<string>('');
  const [form, setForm] = useState({ 
    nome: '', 
    telefone: '', 
    observacao: '', 
    tipoEntrega: vendedor.entregaTipo || 'ENTREGA', 
    enderecoEntrega: '',
    rua: '',
    numero: '',
    bairro: '',
    cep: '',
    complemento: ''
  });
  const [avisoOpen, setAvisoOpen] = useState(false);
  const [cupomCode, setCupomCode] = useState('');
  const [cupomAtivo, setCupomAtivo] = useState<any>(null);
  const [cupomLoading, setCupomLoading] = useState(false);
  const [avisoNome, setAvisoNome] = useState('');
  const [avisoTel, setAvisoTel] = useState('');
  const [avisoSent, setAvisoSent] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token_cliente');
    const clienteStr = localStorage.getItem('cliente');
    if (token && clienteStr) {
      const c = JSON.parse(clienteStr);
      setClienteLogado(c);
      setForm((prev) => ({ ...prev, nome: c.nome || '', telefone: c.telefone || '' }));
      api.get('/api/cliente-global/enderecos', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          setEnderecos(res.data);
          const principal = res.data.find((e: any) => e.principal);
          if (principal) {
            setEnderecoSelecionado(principal.id);
            setForm((prev) => ({
              ...prev,
              rua: principal.logradouro,
              numero: principal.numero,
              bairro: principal.bairro,
              cep: principal.cep,
              complemento: principal.complemento || '',
            }));
          }
        })
        .catch(() => {});
    }
  }, []);

  const selecionarEndereco = (enderecoId: string) => {
    setEnderecoSelecionado(enderecoId);
    const e = enderecos.find((end: any) => end.id === enderecoId);
    if (e) {
      setForm((prev) => ({
        ...prev,
        rua: e.logradouro,
        numero: e.numero,
        bairro: e.bairro,
        cep: e.cep,
        complemento: e.complemento || '',
      }));
    }
  };

  const handleSubmit = async () => {
    if (!form.nome || !form.telefone) {
      toast.error('Preencha nome e telefone');
      return;
    }
    if (form.tipoEntrega === 'ENTREGA' && (!form.rua || !form.numero || !form.bairro)) {
      toast.error('Preencha rua, número e bairro para entrega');
      return;
    }
    setSubmitting(true);
    try {
      const desconto = cupomAtivo ? total * cupomAtivo.valor / 100 : 0;
      const enderecoCompleto = form.tipoEntrega === 'ENTREGA' 
        ? `${form.rua}, ${form.numero} - ${form.bairro}${form.cep ? `, CEP ${form.cep}` : ''}${form.complemento ? `, ${form.complemento}` : ''}`
        : '';
      const pedido = await api.post('/api/pedidos', {
        vendedorId: vendedor.id,
        clienteGlobalId: clienteLogado?.id || undefined,
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
        total: total - desconto,
        taxaEntrega: form.tipoEntrega === 'ENTREGA' ? (vendedor.taxaEntrega || 0) : 0,
        observacao: form.observacao,
        tipoEntrega: form.tipoEntrega,
        enderecoEntrega: enderecoCompleto,
        rua: form.rua,
        numero: form.numero,
        bairro: form.bairro,
        cep: form.cep,
        complemento: form.complemento,
        origem: 'catalogo',
        cupomId: cupomAtivo?.id,
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
          <div className="space-y-3">
            {clienteLogado && enderecos.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500">Seus enderecos salvos:</p>
                {enderecos.map((e: any) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => selecionarEndereco(e.id)}
                    className={`w-full text-left p-3 rounded-xl border text-sm transition-colors ${
                      enderecoSelecionado === e.id
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium text-gray-900">{e.rotulo}</span>
                    <span className="text-gray-500 ml-2">{e.logradouro}, {e.numero} - {e.bairro}</span>
                  </button>
                ))}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                  <div className="relative flex justify-center"><span className="bg-white px-2 text-xs text-gray-400">ou preencha manualmente</span></div>
                </div>
              </div>
            )}
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text" placeholder="Rua/Avenida *" value={form.rua}
                onChange={(e) => setForm({ ...form, rua: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="relative">
                <input
                  type="text" placeholder="Número *" value={form.numero}
                  onChange={(e) => setForm({ ...form, numero: e.target.value })}
                  className="w-full pl-3 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
              </div>
              <div className="col-span-2 relative">
                <input
                  type="text" placeholder="Bairro *" value={form.bairro}
                  onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                  className="w-full pl-3 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="text" placeholder="CEP (opcional)" value={form.cep}
                  onChange={(e) => setForm({ ...form, cep: e.target.value })}
                  className="w-full pl-3 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
              </div>
              <div className="relative">
                <input
                  type="text" placeholder="Complemento (opcional)" value={form.complemento}
                  onChange={(e) => setForm({ ...form, complemento: e.target.value })}
                  className="w-full pl-3 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text" placeholder="Cupom de desconto" value={cupomCode}
            onChange={(e) => { setCupomCode(e.target.value.toUpperCase()); setCupomAtivo(null); }}
            className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
          <button
            onClick={async () => {
              if (!cupomCode) { toast.error('Digite um codigo de cupom'); return; }
              setCupomLoading(true);
              try {
                const res = await api.get(`/api/cupons/validar/${vendedor.id}/${cupomCode}`);
                setCupomAtivo(res.data);
                toast.success(`Cupom aplicado: ${res.data.valor}% OFF`);
              } catch (err: any) {
                setCupomAtivo(null);
                toast.error(err.response?.data?.message?.[0] || 'Cupom invalido');
              } finally {
                setCupomLoading(false);
              }
            }}
            disabled={cupomLoading}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
            style={{ backgroundColor: corPrimaria || '#2563eb' }}
          >
            {cupomLoading ? <Loader2 size={16} className="animate-spin" /> : 'Aplicar'}
          </button>
        </div>
        {cupomAtivo && (
          <div className="flex items-center justify-between text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-2 rounded-xl">
            <span className="font-medium">{cupomAtivo.codigo} - {cupomAtivo.valor}% OFF</span>
            <button onClick={() => { setCupomAtivo(null); setCupomCode(''); }} className="text-green-500 hover:text-green-700">
              <X size={16} />
            </button>
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
        {cupomAtivo && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Desconto ({cupomAtivo.valor}%)</span>
            <span>-R$ {(total * cupomAtivo.valor / 100).toFixed(2)}</span>
          </div>
        )}
        {form.tipoEntrega === 'ENTREGA' && vendedor.taxaEntrega && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Taxa de entrega</span>
            <span className="font-medium">R$ {Number(vendedor.taxaEntrega).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
          <span>Total</span>
          <span className={cupomAtivo ? 'text-green-600' : ''}>
            R$ {(total - (cupomAtivo ? total * cupomAtivo.valor / 100 : 0) + (form.tipoEntrega === 'ENTREGA' ? Number(vendedor.taxaEntrega || 0) : 0)).toFixed(2)}
          </span>
        </div>
      </div>

      {vendedor.lojaAberta === false ? (
        <div className="space-y-3">
          <div className="w-full py-3 rounded-xl bg-gray-300 text-gray-600 font-semibold text-center">
            Loja fechada no momento
          </div>
          {avisoSent ? (
            <div className="text-sm text-green-600 text-center font-medium py-2">
              Avisaremos quando a loja abrir!
            </div>
          ) : avisoOpen ? (
            <div className="space-y-2 border rounded-xl p-3 bg-white dark:bg-gray-800">
              <input
                type="text" placeholder="Seu nome *" value={avisoNome}
                onChange={(e) => setAvisoNome(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="tel" placeholder="WhatsApp *" value={avisoTel}
                onChange={(e) => setAvisoTel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                onClick={async () => {
                  if (!avisoNome || !avisoTel) { toast.error('Preencha nome e telefone'); return; }
                  try {
                    await api.post(`/api/vendedores/${vendedor.id}/avisar-abertura`, { nome: avisoNome, telefone: avisoTel });
                    setAvisoSent(true);
                    toast.success('Avisaremos quando a loja abrir!');
                  } catch {
                    toast.error('Erro ao salvar aviso');
                  }
                }}
                className="w-full py-2 rounded-lg text-white font-medium text-sm"
                style={{ backgroundColor: corPrimaria || '#2563eb' }}
              >
                Salvar aviso
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAvisoOpen(true)}
              className="w-full py-2.5 rounded-xl text-white font-medium text-sm transition-all hover:opacity-90"
              style={{ backgroundColor: corPrimaria || '#2563eb' }}
            >
              Avisar quando a loja abrir
            </button>
          )}
        </div>
      ) : (
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: corPrimaria || '#2563eb' }}
      >
        {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        {submitting ? 'Enviando...' : 'Fazer Pedido'}
      </button>
      )}
    </div>
  );
}

function formatWhatsAppMessage(pedido: any, form: any): string {
  const itens = pedido.itens?.map((i: any) => `${i.quantidade}x ${i.nome} - R$ ${Number(i.total).toFixed(2)}`).join('\n') || '';
  const endereco = form.tipoEntrega === 'ENTREGA' 
    ? `${form.rua}, ${form.numero} - ${form.bairro}${form.cep ? `, CEP ${form.cep}` : ''}${form.complemento ? `, ${form.complemento}` : ''}`
    : '';
  return [
    `*Novo Pedido - My Love Delivery*`,
    ``,
    `*Cliente:* ${form.nome}`,
    `*Telefone:* ${form.telefone}`,
    `*Tipo:* ${form.tipoEntrega === 'ENTREGA' ? 'Entrega' : 'Retirada'}`,
    endereco ? `*Endereco:* ${endereco}` : '',
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
