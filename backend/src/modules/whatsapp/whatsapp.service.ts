import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '../../config/config.service';
import { PedidosService } from '../pedidos/pedidos.service';
import { AgendamentosService } from '../agendamentos/agendamentos.service';
import { ChatGateway } from '../chat/chat.gateway';
import { AiAtendimentoService } from '../ai/ai-atendimento.service';
import { LeadsService } from '../leads/leads.service';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private uazapi: any = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Inject(forwardRef(() => PedidosService)) private pedidosService: PedidosService,
    private agendamentosService: AgendamentosService,
    private chatGateway: ChatGateway,
    private aiAtendimentoService: AiAtendimentoService,
    private leadsService: LeadsService,
  ) {
    const url = this.configService.uazapiUrl;
    const token = this.configService.uazapiAdminToken;
    if (url) {
      const { UazapiClient } = require('@eziocm/uazapi');
      this.uazapi = new UazapiClient({ baseUrl: url, adminToken: token });
    }
  }

  private getClient() {
    if (!this.uazapi) {
      throw new Error('UAZAPI_URL nao configurada. Defina a URL da API Uazapi no .env');
    }
    return this.uazapi;
  }

  async conectar(vendedorId: string) {
    const client = this.getClient();

    let vendedor = await this.prisma.vendedor.findUnique({
      where: { id: vendedorId },
      select: { uazapiToken: true, uazapiInstanceName: true, nomeLoja: true, slug: true },
    });

    const baseNome = vendedor?.slug || vendedor?.nomeLoja || `vendedor_${vendedorId}`;
    const instanceName = baseNome.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').substring(0, 40);

    try {
      let instanceToken = vendedor?.uazapiToken;

      if (!instanceToken) {
        const allInstances: any[] = await client.instance.listAll();
        const existing = allInstances.find((i: any) => i.name === instanceName);
        if (existing) {
          instanceToken = existing.token;
        } else {
          const novaInstancia: any = await client.instance.create({ name: instanceName });
          instanceToken = novaInstancia?.token || instanceName;
        }
      }

      await this.prisma.vendedor.update({
        where: { id: vendedorId },
        data: {
          uazapiInstanceName: instanceName,
          uazapiToken: instanceToken,
          whatsappSessionId: instanceName,
        },
      });

      const connection = await client.instance.connect(instanceToken);
      const conn: any = connection;
      const qrcode = conn?.instance?.qrcode || conn?.qrcode?.base64 || conn?.qrcode || conn?.base64 || conn?.qr || conn;

      const backendUrl = this.configService.get('BACKEND_URL', 'http://localhost:3001');
      const webhookUrl = `${backendUrl.replace(/\/$/, '')}/api/whatsapp/webhook`;
      await this.configurarWebhook(vendedorId, webhookUrl).catch(e =>
        this.logger.warn(`Erro ao configurar webhook: ${e.message}`)
      );

      return { qrcode, instanceName, instanceToken };
    } catch (error) {
      this.logger.error(`Erro ao conectar WhatsApp: ${error.message}`);
      throw new Error('Erro ao conectar WhatsApp. Verifique a URL e token da Uazapi.');
    }
  }

  async desconectar(vendedorId: string) {
    const client = this.getClient();
    const vendedor = await this.prisma.vendedor.findUnique({ where: { id: vendedorId } });

    if (vendedor?.uazapiInstanceName) {
      try {
        await client.instance.delete(vendedor.uazapiInstanceName);
      } catch (error) {
        this.logger.warn(`Erro ao deletar instancia: ${error.message}`);
      }
    }

    return this.prisma.vendedor.update({
      where: { id: vendedorId },
      data: {
        whatsappConectado: false,
        uazapiInstanceName: null,
        uazapiToken: null,
      },
    });
  }

  async status(vendedorId: string) {
    const vendedor = await this.prisma.vendedor.findUnique({
      where: { id: vendedorId },
      select: { whatsappConectado: true, uazapiToken: true },
    });

    if (!vendedor?.uazapiToken) {
      return { conectado: false };
    }

    try {
      const client = this.getClient();
      const info: any = await client.instance.getStatus(vendedor.uazapiToken);
      const conectado = info?.state === 'connected' || info?.status === 'connected';

      if (conectado !== vendedor.whatsappConectado) {
        await this.prisma.vendedor.update({
          where: { id: vendedorId },
          data: { whatsappConectado: conectado },
        });
      }

      return { conectado, ...info };
    } catch {
      return { conectado: vendedor.whatsappConectado };
    }
  }

  async enviarMensagem(telefone: string, mensagem: string, vendedorId?: string) {
    const client = this.getClient();
    let instanceToken: string | null = null;

    if (vendedorId) {
      const v = await this.prisma.vendedor.findUnique({
        where: { id: vendedorId },
        select: { uazapiToken: true },
      });
      instanceToken = v?.uazapiToken || null;
    } else {
      const v = await this.prisma.vendedor.findFirst({
        where: { whatsappConectado: true },
        select: { uazapiToken: true },
      });
      instanceToken = v?.uazapiToken || null;
    }

    if (!instanceToken) {
      throw new Error('Nenhum vendedor com WhatsApp conectado');
    }

    try {
      return await client.send.text(instanceToken, {
        number: telefone,
        text: mensagem,
      });
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem WhatsApp: ${error.message}`);
      throw error;
    }
  }

  async enviarImagem(telefone: string, mediaUrl: string, vendedorId?: string, caption?: string) {
    const client = this.getClient();
    let instanceToken: string | null = null;

    if (vendedorId) {
      const v = await this.prisma.vendedor.findUnique({
        where: { id: vendedorId },
        select: { uazapiToken: true },
      });
      instanceToken = v?.uazapiToken || null;
    } else {
      const v = await this.prisma.vendedor.findFirst({
        where: { whatsappConectado: true },
        select: { uazapiToken: true },
      });
      instanceToken = v?.uazapiToken || null;
    }

    if (!instanceToken) {
      throw new Error('Nenhum vendedor com WhatsApp conectado');
    }

    try {
      return await client.send.image(instanceToken, {
        number: telefone,
        path: mediaUrl,
        caption,
      });
    } catch (error) {
      this.logger.error(`Erro ao enviar imagem WhatsApp: ${error.message}`);
      throw error;
    }
  }

  async enviarAudio(telefone: string, audioUrl: string, vendedorId?: string) {
    const client = this.getClient();
    let instanceToken: string | null = null;

    if (vendedorId) {
      const v = await this.prisma.vendedor.findUnique({
        where: { id: vendedorId },
        select: { uazapiToken: true },
      });
      instanceToken = v?.uazapiToken || null;
    } else {
      const v = await this.prisma.vendedor.findFirst({
        where: { whatsappConectado: true },
        select: { uazapiToken: true },
      });
      instanceToken = v?.uazapiToken || null;
    }

    if (!instanceToken) {
      throw new Error('Nenhum vendedor com WhatsApp conectado');
    }

    try {
      return await client.send.audio(instanceToken, {
        number: telefone,
        path: audioUrl,
      });
    } catch (error) {
      this.logger.error(`Erro ao enviar audio WhatsApp: ${error.message}`);
      throw error;
    }
  }

  async configurarWebhook(vendedorId: string, webhookUrl: string) {
    const client = this.getClient();
    const vendedor = await this.prisma.vendedor.findUnique({
      where: { id: vendedorId },
      select: { uazapiToken: true },
    });

    if (!vendedor?.uazapiToken) return;

    try {
      await client.webhook.set(vendedor.uazapiToken, {
        url: webhookUrl,
        events: ['messages'],
      });
    } catch (error) {
      this.logger.warn(`Erro ao configurar webhook Uazapi: ${error.message}`);
    }
  }

  private detectarIntencao(mensagem: string): string {
    const msg = mensagem.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const padraoPedido = /\b(quero\s+pedir|quero\s+comprar|gostaria\s+de\s+pedir|fazer\s+um\s+pedido|cardapio|menu|produtos|catalogo|quero\s+comer|quero\s+encomendar|pedido)\b/;
    const padraoAgendamento = /\b(quero\s+agendar|marcar|agendar\s+horario|horario\s+disponivel|quero\s+marcar|reservar|agendamento|tem\s+vaga|agenda)\b/;
    const padraoCardapio = /\b(cardapio|menu|catalogo|produtos|o\s+que\s+voce\s+tem)\b/;
    const padraoInfo = /\b(oi|ola|bom\s+dia|boa\s+tarde|boa\s+noite|olá|bom dia|obrigado|obrigada)\b/;

    if (padraoPedido.test(msg)) return 'pedido';
    if (padraoAgendamento.test(msg)) return 'agendamento';
    if (padraoCardapio.test(msg)) return 'cardapio';
    if (padraoInfo.test(msg)) return 'saudacao';

    return 'desconhecida';
  }

  private async enviarRespostaAutomatica(vendedorId: string, gatilho: string, conversa: any, nomeLoja?: string) {
    const autoMsg = await this.prisma.mensagemAutomatica.findFirst({
      where: { vendedorId, gatilho, ativo: true },
      orderBy: { delaySegundos: 'asc' },
    });

    const mensagensPadrao: Record<string, string> = {
      boas_vindas: `Ola ${conversa.contatoNome}! Bem-vindo(a) ao ${nomeLoja || 'My Love Delivery'}! 🎉\n\nEnvie "cardapio" para ver nossos produtos, "pedido" para fazer um pedido, ou "agendar" para marcar um horario.`,
      cardapio: `Confira nosso cardapio completo em:\nhttps://cardapio.digital/${nomeLoja || 'catalogo'}\n\nOu digite o nome do produto que deseja saber mais.`,
      pedido_recebido: `Pedido recebido com sucesso! ✅\nEm breve entraremos em contato para confirmar.\n\nDigite "status" para acompanhar seu pedido.`,
      agendamento_confirmado: `Agendamento confirmado! ✅\nEntraremos em contato para confirmar o horario.\n\nDigite "agenda" para ver seus agendamentos.`,
      encerramento: `Obrigado pelo contato, ${conversa.contatoNome}! 😊\n\nSe precisar de algo, e so chamar.`,
    };

    const resposta = autoMsg
      ? autoMsg.mensagem.replace('{{nome}}', conversa.contatoNome)
      : (mensagensPadrao[gatilho] || mensagensPadrao.encerramento);

    if (!resposta) return null;

    if (!autoMsg && gatilho === 'encerramento') return null;

    await this.enviarMensagem(conversa.contatoTelefone, resposta, vendedorId);

    const msgSalva = await this.prisma.mensagem.create({
      data: {
        conversaId: conversa.id,
        remetente: 'vendedor',
        conteudo: resposta,
        tipo: autoMsg?.tipo || 'texto',
      },
    });

    await this.prisma.conversa.update({
      where: { id: conversa.id },
      data: { ultimaMensagem: resposta, ultimaAtividade: new Date() },
    });

    return msgSalva;
  }

  private emitirEventosSocket(vendedorId: string, conversaId: string, evento: string, dados: any) {
    try {
      if (evento === 'new-message') {
        this.chatGateway.server.to(`user_${vendedorId}`).emit(evento, dados);
        this.chatGateway.server.to(`conversa_${conversaId}`).emit(evento, dados);
      } else {
        this.chatGateway.server.to(`user_${vendedorId}`).emit(evento, dados);
      }
    } catch (error) {
      this.logger.warn(`Erro ao emitir evento Socket.IO: ${error.message}`);
    }
  }

  async processarWebhook(payload: any) {
    this.logger.log('Webhook Uazapi recebido');

    const telefone = payload?.sender?.replace('@s.whatsapp.net', '') || payload?.from?.replace('@s.whatsapp.net', '');
    const mensagem = payload?.message || payload?.text || payload?.body || '';
    const pushName = payload?.pushName || payload?.senderName || payload?.notifyName || '';
    const instanceToken = payload?.instanceToken || payload?.instance || '';

    if (!telefone) return { received: true };

    let vendedor = await this.prisma.vendedor.findFirst({
      where: { uazapiToken: instanceToken },
      select: { id: true, userId: true, nomeLoja: true },
    });

    if (!vendedor) {
      vendedor = await this.prisma.vendedor.findFirst({
        where: { uazapiInstanceName: instanceToken },
        select: { id: true, userId: true, nomeLoja: true },
      });
      if (!vendedor) return { received: true };
    }

    let conversa = await this.prisma.conversa.findFirst({
      where: { vendedorId: vendedor.id, contatoTelefone: telefone },
      include: { cliente: true },
    });

    const isPrimeiraMensagem = !conversa;

    if (!conversa) {
      let cliente = await this.prisma.cliente.findFirst({
        where: { vendedorId: vendedor.id, telefone },
      });

      if (!cliente) {
        cliente = await this.prisma.cliente.create({
          data: {
            vendedorId: vendedor.id,
            nome: pushName || telefone,
            telefone,
          },
        });
      }

      conversa = await this.prisma.conversa.create({
        data: {
          vendedorId: vendedor.id,
          clienteId: cliente.id,
          contatoNome: pushName || cliente.nome,
          contatoTelefone: telefone,
        },
        include: { cliente: true },
      });
    }

    await this.leadsService.upsert({
      vendedorId: vendedor.id,
      nome: pushName || conversa.contatoNome,
      telefone,
      origem: 'whatsapp',
      mensagemInicial: isPrimeiraMensagem ? mensagem : undefined,
      ultimaMensagem: mensagem,
      conversaId: conversa.id,
    });

    const msgSalva = await this.prisma.mensagem.create({
      data: {
        conversaId: conversa.id,
        remetente: 'cliente',
        conteudo: mensagem,
        tipo: 'texto',
      },
    });

    await this.prisma.conversa.update({
      where: { id: conversa.id },
      data: {
        ultimaMensagem: mensagem,
        ultimaAtividade: new Date(),
        naoLido: { increment: 1 },
      },
    });

    this.emitirEventosSocket(vendedor.id, conversa.id, 'new-message', msgSalva);
    this.emitirEventosSocket(vendedor.id, conversa.id, 'conversa-updated', {
      conversaId: conversa.id,
      ultimaMensagem: mensagem,
      naoLido: conversa.naoLido + 1,
    });

    const intencao = this.detectarIntencao(mensagem);

    if (intencao === 'cardapio') {
      const resposta = await this.enviarRespostaAutomatica(vendedor.id, 'cardapio', conversa, vendedor.nomeLoja);
      if (resposta) this.emitirEventosSocket(vendedor.id, conversa.id, 'new-message', resposta);
      return { received: true, conversaId: conversa.id, intencao };
    }

    if (intencao === 'agendamento') {
      try {
        const dataAgendamento = new Date();
        dataAgendamento.setDate(dataAgendamento.getDate() + 1);
        const agendamentoCriado = await this.agendamentosService.create({
          vendedorId: vendedor.id,
          clienteNome: conversa.contatoNome,
          clienteTelefone: conversa.contatoTelefone,
          clienteId: conversa.clienteId || undefined,
          data: dataAgendamento,
          hora: '10:00',
          tipo: 'reserva',
          observacao: `Agendamento via WhatsApp. Mensagem: "${mensagem}"`,
        });
        this.logger.log(`Agendamento ${agendamentoCriado.id} criado automaticamente via WhatsApp`);
        const resposta = await this.enviarRespostaAutomatica(vendedor.id, 'agendamento_confirmado', conversa, vendedor.nomeLoja);
        if (resposta) this.emitirEventosSocket(vendedor.id, conversa.id, 'new-message', resposta);
      } catch (error) {
        this.logger.error(`Erro ao criar agendamento: ${error.message}`);
      }
      return { received: true, conversaId: conversa.id, intencao };
    }

    const saida = await this.aiAtendimentoService.processarMensagem(mensagem, conversa.id, vendedor.id);

    if (saida.pedidoCriado) {
      const estado = this.aiAtendimentoService.getEstado(conversa.id);
      try {
        const pedido = await this.aiAtendimentoService.criarPedidoDoEstado(estado, vendedor.id, conversa);
        if (pedido) {
          await this.leadsService.marcarConvertido(
            (await this.leadsService.buscarPorTelefone(vendedor.id, telefone))?.id || ''
          );
          const total = Number(pedido.total).toFixed(2);
          const confirma = `Pedido confirmado!\n\n${pedido.itens.map((i: any) => `${i.quantidade}x ${i.nome}${i.variacao ? ` (${i.variacao})` : ''}`).join('\n')}\nTotal: R$ ${total}\n\nObrigado pelo pedido, ${conversa.contatoNome}!`;
          await this.enviarMensagem(telefone, confirma, vendedor.id);
          const msgConfirma = await this.prisma.mensagem.create({
            data: { conversaId: conversa.id, remetente: 'vendedor', conteudo: confirma, tipo: 'texto' },
          });
          this.emitirEventosSocket(vendedor.id, conversa.id, 'new-message', msgConfirma);
          this.emitirEventosSocket(vendedor.id, conversa.id, 'pedido-criado', { pedidoId: pedido.id, conversaId: conversa.id });
          this.aiAtendimentoService.resetEstado(conversa.id);
        }
      } catch (error) {
        this.logger.error(`Erro ao criar pedido do estado AI: ${error.message}`);
        const erroMsg = `Desculpe, tive um problema ao criar seu pedido. Fale com um atendente.`;
        await this.enviarMensagem(telefone, erroMsg, vendedor.id);
        const msgErro = await this.prisma.mensagem.create({
          data: { conversaId: conversa.id, remetente: 'vendedor', conteudo: erroMsg, tipo: 'texto' },
        });
        this.emitirEventosSocket(vendedor.id, conversa.id, 'new-message', msgErro);
      }
    } else if (saida.resposta) {
      await this.enviarMensagem(telefone, saida.resposta, vendedor.id);
      const msgResposta = await this.prisma.mensagem.create({
        data: { conversaId: conversa.id, remetente: 'vendedor', conteudo: saida.resposta, tipo: 'texto' },
      });
      await this.prisma.conversa.update({
        where: { id: conversa.id },
        data: { ultimaMensagem: saida.resposta, ultimaAtividade: new Date() },
      });
      this.emitirEventosSocket(vendedor.id, conversa.id, 'new-message', msgResposta);
    }

    try {
      await this.prisma.log.create({
        data: {
          userId: vendedor.userId,
          acao: 'whatsapp_msg_recebida',
          entidade: 'conversa',
          entidadeId: conversa.id,
          dados: { telefone, intencao, mensagem: mensagem.substring(0, 100), acao: saida.acao || null },
        },
      });
    } catch (error) {
      this.logger.warn(`Erro ao criar log: ${error.message}`);
    }

    return { received: true, conversaId: conversa.id, intencao, acao: saida.acao };
  }
}
