'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loading } from '@/components/shared/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import api from '@/lib/api';
import { MessageSquare, Send, ArrowLeft, ShoppingCart, Calendar, Check, CheckCheck, Image, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Conversa {
  id: string;
  contatoNome: string;
  contatoTelefone: string;
  ultimaMensagem: string | null;
  ultimaAtividade: string;
  naoLido: number;
  status: string;
  origem: string;
  _count: { mensagens: number };
  cliente: { id: string; nome: string } | null;
}

interface Mensagem {
  id: string;
  conversaId: string;
  remetente: string;
  conteudo: string | null;
  tipo: string;
  midiaUrl?: string | null;
  lida: boolean;
  createdAt: string;
}

export default function ConversasPage() {
  const { user } = useAuth();
  const vendedorId = user?.vendedor?.id;
  const { joinConversa, sendMessage, onNewMessage, onConversaUpdated, onPedidoCriado, onAgendamentoCriado } = useSocket(user?.id);

  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaAtiva, setConversaAtiva] = useState<Conversa | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const carregarConversas = useCallback(async () => {
    if (!vendedorId) return;
    try {
      const { data } = await api.get(`/api/chat/conversas/${vendedorId}`);
      setConversas(data);
    } catch {
      const { data } = await api.get(`/api/conversas/vendedor/${vendedorId}`);
      setConversas(data || []);
    }
  }, [vendedorId]);

  useEffect(() => {
    if (vendedorId) {
      carregarConversas().finally(() => setLoading(false));
    }
  }, [vendedorId, carregarConversas]);

  const carregarMensagens = async (conversaId: string) => {
    setLoadingMsgs(true);
    try {
      const { data } = await api.get(`/api/chat/mensagens/${conversaId}`);
      setMensagens(data.mensagens || data || []);
    } catch {
      setMensagens([]);
    }
    setLoadingMsgs(false);
  };

  const abrirConversa = (conversa: Conversa) => {
    setConversaAtiva(conversa);
    setShowMobileList(false);
    joinConversa(conversa.id);
    carregarMensagens(conversa.id);
    marcarLidas(conversa.id);
  };

  const marcarLidas = async (conversaId: string) => {
    try {
      await api.patch(`/api/chat/mensagens/${conversaId}/ler`);
      setConversas((prev) =>
        prev.map((c) => (c.id === conversaId ? { ...c, naoLido: 0 } : c))
      );
    } catch {}
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const handleSend = () => {
    if (!texto.trim() || !conversaAtiva) return;
    sendMessage(conversaAtiva.id, texto.trim());
    setTexto('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversaAtiva) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/api/upload/chat', formData);
      sendMessage(conversaAtiva.id, '', data.url, 'image');
    } catch {
      toast.error('Erro ao enviar imagem');
    }
    setUploading(false);
    if (e.target) e.target.value = '';
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversaAtiva) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/api/upload/chat', formData);
      sendMessage(conversaAtiva.id, '', data.url, 'audio');
    } catch {
      toast.error('Erro ao enviar audio');
    }
    setUploading(false);
    if (e.target) e.target.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const unsubNewMsg = onNewMessage((data: any) => {
      if (conversaAtiva && data.conversaId === conversaAtiva.id) {
        setMensagens((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
      }
      carregarConversas();
    });

    const unsubUpd = onConversaUpdated((data: any) => {
      setConversas((prev) =>
        prev.map((c) =>
          c.id === data.conversaId ? { ...c, ultimaMensagem: data.ultimaMensagem } : c
        )
      );
    });

    const unsubPedido = onPedidoCriado((data: any) => {
      toast.success(`Pedido #${data.pedidoId.slice(0, 8)} criado via WhatsApp!`);
    });

    const unsubAgendamento = onAgendamentoCriado((data: any) => {
      toast.success(`Agendamento criado via WhatsApp!`);
    });

    return () => {
      unsubNewMsg();
      unsubUpd();
      unsubPedido();
      unsubAgendamento();
    };
  }, [conversaAtiva, onNewMessage, onConversaUpdated, onPedidoCriado, onAgendamentoCriado, carregarConversas]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (diff < 172800000) return 'Ontem';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className={`${showMobileList ? 'flex' : 'hidden'} lg:flex w-full lg:w-80 xl:w-96 flex-col border-r border-gray-200 dark:border-gray-800`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-bold">Conversas</h2>
            <p className="text-xs text-gray-500">{conversas.length} conversas</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversas.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
                <MessageSquare size={40} className="mb-2" />
                <p className="text-sm">Nenhuma conversa ainda</p>
                <p className="text-xs">As conversas do WhatsApp aparecerão aqui</p>
              </div>
            ) : (
              conversas.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => abrirConversa(conv)}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left border-b border-gray-100 dark:border-gray-800/50 ${
                    conversaAtiva?.id === conv.id ? 'bg-primary-50 dark:bg-primary-900/10' : ''
                  }`}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary-100 text-primary-700">
                      {conv.contatoNome.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{conv.contatoNome}</span>
                      <span className="text-xs text-gray-400 shrink-0">{formatDate(conv.ultimaAtividade)}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{conv.ultimaMensagem || 'Sem mensagens'}</p>
                  </div>
                  {conv.naoLido > 0 && (
                    <Badge className="h-5 min-w-5 flex items-center justify-center rounded-full text-xs px-1">
                      {conv.naoLido}
                    </Badge>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <div className={`${!showMobileList ? 'flex' : 'hidden'} lg:flex flex-1 flex-col`}>
          {conversaAtiva ? (
            <>
              <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
                <button className="lg:hidden p-1" onClick={() => setShowMobileList(true)}>
                  <ArrowLeft size={20} />
                </button>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary-100 text-primary-700 text-xs">
                    {conversaAtiva.contatoNome.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{conversaAtiva.contatoNome}</p>
                  <p className="text-xs text-gray-500">{conversaAtiva.contatoTelefone}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver pedidos">
                    <ShoppingCart size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver agendamentos">
                    <Calendar size={16} />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-gray-950/50">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center h-full">
                    <Loading />
                  </div>
                ) : mensagens.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <MessageSquare size={32} className="mb-2" />
                    <p className="text-sm">Nenhuma mensagem ainda</p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {mensagens.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.remetente === 'vendedor' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] lg:max-w-[60%] p-3 rounded-2xl ${
                            msg.remetente === 'vendedor'
                              ? 'bg-primary text-white rounded-br-sm'
                              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-sm'
                          }`}
                        >
                          {msg.tipo === 'image' && msg.midiaUrl && (
                            <img src={msg.midiaUrl} alt="Imagem" className="max-w-full rounded-lg mb-1 max-h-64 object-contain" />
                          )}
                          {msg.tipo === 'audio' && msg.midiaUrl && (
                            <audio src={msg.midiaUrl} controls className="max-w-full mb-1" />
                          )}
                          {msg.conteudo && (
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.conteudo}</p>
                          )}
                          <div className={`flex items-center justify-end gap-1 mt-1 ${
                            msg.remetente === 'vendedor' ? 'text-white/70' : 'text-gray-400'
                          }`}>
                            <span className="text-[10px]">
                              {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {msg.remetente === 'vendedor' && (
                              msg.lida ? <CheckCheck size={12} /> : <Check size={12} />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t border-gray-200 dark:border-gray-800">
                <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={handleImageUpload} />
                <input type="file" ref={audioInputRef} accept="audio/*" className="hidden" onChange={handleAudioUpload} />
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => imageInputRef.current?.click()} disabled={uploading} title="Enviar imagem">
                    <Image size={18} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => audioInputRef.current?.click()} disabled={uploading} title="Enviar audio">
                    <Mic size={18} />
                  </Button>
                  <Input
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua mensagem..."
                    className="flex-1"
                  />
                  <Button onClick={handleSend} disabled={!texto.trim() || uploading} size="icon" className="h-10 w-10 shrink-0 rounded-full">
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageSquare size={48} className="mb-3" />
              <p className="text-sm font-medium">Selecione uma conversa</p>
              <p className="text-xs">Escolha uma conversa ao lado para começar</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
