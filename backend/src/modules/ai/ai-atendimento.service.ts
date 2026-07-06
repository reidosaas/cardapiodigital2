import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '../../config/config.service';
import OpenAI from 'openai';

interface ConversationState {
  etapa: 'saudacao' | 'coletando_produto' | 'coletando_variacao' | 'coletando_quantidade' | 'coletando_observacao' | 'confirmando' | 'finalizado';
  produtoSelecionado?: { id?: string; nome: string; preco?: number };
  variacao?: string;
  quantidade?: number;
  observacao?: string;
  produtoId?: string;
  tentativas?: number;
}

@Injectable()
export class AiAtendimentoService {
  private readonly logger = new Logger(AiAtendimentoService.name);
  private openai: OpenAI | null = null;
  private estados = new Map<string, ConversationState>();

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.openaiApiKey;
    if (apiKey && apiKey !== 'your-openai-api-key') {
      this.openai = new OpenAI({ apiKey });
    }
  }

  getEstado(conversaId: string): ConversationState {
    if (!this.estados.has(conversaId)) {
      this.estados.set(conversaId, { etapa: 'saudacao' });
    }
    return this.estados.get(conversaId)!;
  }

  resetEstado(conversaId: string) {
    this.estados.delete(conversaId);
  }

  async processarMensagem(mensagem: string, conversaId: string, vendedorId: string): Promise<{ resposta: string; pedidoCriado?: boolean; acao?: string }> {
    const estado = this.getEstado(conversaId);
    const msg = mensagem.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (msg.match(/\b(cancelar|voltar|nada|nao obrigado)\b/)) {
      this.resetEstado(conversaId);
      return { resposta: 'Tudo bem! Quando precisar de algo, e so chamar. 😊', acao: 'cancelado' };
    }

    if (this.openai) {
      return this.processarComOpenAI(mensagem, estado, vendedorId, conversaId);
    }

    return this.processarSemOpenAI(mensagem, estado, vendedorId, conversaId);
  }

  private async processarComOpenAI(mensagem: string, estado: ConversationState, vendedorId: string, conversaId: string): Promise<{ resposta: string; pedidoCriado?: boolean }> {
    try {
      const produtos = await this.prisma.produto.findMany({
        where: { vendedorId, ativo: true },
        select: { id: true, nome: true, preco: true, variacoes: true, descricao: true },
        take: 50,
      });

      const listaProdutos = produtos.map(p => `${p.nome}${p.variacoes ? ` (versoes: ${Array.isArray(p.variacoes) ? (p.variacoes as any[]).map(v => v.nome || v).join(', ') : p.variacoes})` : ''} - R$ ${Number(p.preco).toFixed(2)}`).join('\n');

      const systemPrompt = `Voce e um atendente de vendas via WhatsApp. Seu objetivo é ajudar o cliente a fazer um pedido.

Contexto atual:
- Etapa: ${estado.etapa}
- Produto selecionado: ${estado.produtoSelecionado?.nome || 'nenhum'}
- Variacao: ${estado.variacao || 'nenhuma'}
- Quantidade: ${estado.quantidade || 'nenhuma'}

Produtos disponiveis:
${listaProdutos || 'Nenhum produto cadastrado'}

Regras:
1. Se o cliente mencionar um produto, identifique qual produto da lista ele quer
2. Se o produto tiver variacoes (sabores, tamanhos), pergunte qual ele quer
3. Pergunte a quantidade
4. Antes de finalizar, mostre o resumo do pedido e confirme
5. Se o cliente confirmar, responda APENAS com o JSON: {"acao":"finalizar","produto":"NOME","quantidade":NUMERO,"variacao":"VARIACAO","observacao":"OBS"}
6. Seja natural e amigavel, como um atendente de balcao
7. Nao invente produtos que nao estao na lista`;

      const response = await this.openai!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: mensagem },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      const resposta = response.choices[0]?.message?.content || 'Desculpe, nao entendi. Pode repetir?';

      const jsonMatch = resposta.match(/\{.*"acao".*\}/);
      if (jsonMatch) {
        try {
          const cmd = JSON.parse(jsonMatch[0]);
          if (cmd.acao === 'finalizar') {
            this.estados.set(conversaId, { ...estado, etapa: 'finalizado' });
            return { resposta: '', pedidoCriado: true };
          }
        } catch { }
      }

      if (resposta.includes('variacao') || resposta.includes('sabor') || resposta.includes('tamanho')) {
        this.estados.set(conversaId, { ...estado, etapa: 'coletando_variacao' });
      } else if (resposta.includes('quant')) {
        this.estados.set(conversaId, { ...estado, etapa: 'coletando_quantidade' });
      }

      return { resposta };
    } catch (error) {
      this.logger.error(`Erro OpenAI: ${error.message}`);
      return this.processarSemOpenAI(mensagem, estado, vendedorId, conversaId);
    }
  }

  private async processarSemOpenAI(mensagem: string, estado: ConversationState, vendedorId: string, conversaId: string): Promise<{ resposta: string; pedidoCriado?: boolean }> {
    const msg = mensagem.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (estado.etapa === 'saudacao' || estado.etapa === 'coletando_produto') {
      const produtos = await this.prisma.produto.findMany({
        where: { vendedorId, ativo: true },
        select: { id: true, nome: true, preco: true, variacoes: true },
      });

      const produtoEncontrado = produtos.find(p =>
        msg.includes(p.nome.toLowerCase()) ||
        p.nome.toLowerCase().split(' ').some(palavra => msg.includes(palavra))
      );

      if (produtoEncontrado) {
        estado.produtoSelecionado = { id: produtoEncontrado.id, nome: produtoEncontrado.nome, preco: Number(produtoEncontrado.preco) };
        estado.produtoId = produtoEncontrado.id;

        if (produtoEncontrado.variacoes && Array.isArray(produtoEncontrado.variacoes) && produtoEncontrado.variacoes.length > 0) {
          const opcoes = (produtoEncontrado.variacoes as any[]).map(v => v.nome || v).join(', ');
          estado.etapa = 'coletando_variacao';
          return { resposta: `Legal! Temos ${produtoEncontrado.nome} nas opcoes: ${opcoes}. Qual voce prefere?` };
        }

        estado.etapa = 'coletando_quantidade';
        return { resposta: `Quantos ${produtoEncontrado.nome} voce quer?` };
      }

      if (estado.etapa === 'saudacao') {
        estado.etapa = 'coletando_produto';
        const lista = produtos.map(p => `- ${p.nome}`).join('\n');
        return {
          resposta: `Ola! 😊 Bem-vindo(a)!\n\nAqui estao nossos produtos:\n${lista}\n\nQual deles voce gostaria de pedir?`
        };
      }

      estado.tentativas = (estado.tentativas || 0) + 1;
      if (estado.tentativas >= 3) {
        this.resetEstado(conversaId);
        return { resposta: `Desculpe, nao encontrei esse produto. Fale com um atendente ou digite "cardapio" para ver as opcoes novamente.` };
      }
      return { resposta: `Nao encontrei esse produto. Temos: ${(await produtos).map(p => p.nome).join(', ')}. Qual voce quer?` };
    }

    if (estado.etapa === 'coletando_variacao') {
      estado.variacao = mensagem;
      estado.etapa = 'coletando_quantidade';
      return { resposta: `${estado.variacao}, otima escolha! Quantos ${estado.produtoSelecionado?.nome} voce quer?` };
    }

    if (estado.etapa === 'coletando_quantidade') {
      const qtd = parseInt(msg.match(/\d+/)?.[0] || '');
      if (qtd > 0) {
        estado.quantidade = qtd;
        estado.etapa = 'coletando_observacao';
        return { resposta: `Ok, ${qtd}x ${estado.produtoSelecionado?.nome}${estado.variacao ? ` (${estado.variacao})` : ''}. Algo mais? (observacao ou "nao")` };
      }
      return { resposta: `Quantos voce quer? Digite um numero.` };
    }

    if (estado.etapa === 'coletando_observacao') {
      if (!msg.match(/\b(nao|não|so|só|tudo|ok|pode ser)\b/)) {
        estado.observacao = mensagem;
      }
      estado.etapa = 'confirmando';
      const total = (estado.produtoSelecionado?.preco || 0) * (estado.quantidade || 1);
      return {
        resposta: `Resumo do pedido:\n\n📋 ${estado.quantidade}x ${estado.produtoSelecionado?.nome}${estado.variacao ? ` (${estado.variacao})` : ''}${estado.observacao ? `\n📝 Obs: ${estado.observacao}` : ''}\n💰 Total: R$ ${total.toFixed(2)}\n\nConfirma o pedido? (sim/nao)`
      };
    }

    if (estado.etapa === 'confirmando') {
      if (msg.match(/\b(sim|ss|pode|ok|confirm|claro)\b/)) {
        this.estados.set(conversaId, { ...estado, etapa: 'finalizado' });
        return { resposta: '', pedidoCriado: true };
      }
      this.resetEstado(conversaId);
      return { resposta: 'Pedido cancelado. Quando quiser, e so chamar! 😊' };
    }

    return { resposta: 'Como posso ajudar? Digite o nome do produto que deseja.' };
  }

  async criarPedidoDoEstado(estado: ConversationState, vendedorId: string, conversa: any): Promise<any> {
    if (estado.etapa !== 'finalizado' || !estado.produtoSelecionado) return null;

    const pedido = await this.prisma.pedido.create({
      data: {
        vendedorId,
        clienteId: conversa.clienteId,
        clienteNome: conversa.contatoNome,
        clienteTelefone: conversa.contatoTelefone,
        total: (estado.produtoSelecionado.preco || 0) * (estado.quantidade || 1),
        taxaEntrega: 0,
        origem: 'whatsapp',
        conversationId: conversa.id,
        observacao: estado.observacao,
        itens: {
          create: [{
            produtoId: estado.produtoId,
            nome: estado.produtoSelecionado.nome,
            quantidade: estado.quantidade || 1,
            precoUnitario: estado.produtoSelecionado.preco || 0,
            total: (estado.produtoSelecionado.preco || 0) * (estado.quantidade || 1),
            variacao: estado.variacao,
            observacao: estado.observacao,
          }],
        },
      },
      include: { itens: true },
    });

    this.resetEstado(conversa.id);
    return pedido;
  }
}