import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
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

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private pedidosService: PedidosService,
    private agendamentosService: AgendamentosService,
    private chatGateway: ChatGateway,
    private aiAtendimentoService: AiAtendimentoService,
    private leadsService: LeadsService,
  ) {}

  async conectar(vendedorId: string) {
    const apiUrl = this.configService.whatsappApiUrl;
    const apiKey = this.configService.whatsappApiKey;

    try {
      const response = await axios.post(`${apiUrl}/instance/create`, {
        instanceName: `vendedor_${vendedorId}`,
        token: apiKey,
        qrcode: true,
      });

      const qrcode = response.data?.qrcode?.base64 || response.data?.qrcode;

      await this.prisma.vendedor.update({
        where: { id: vendedorId },
        data: {
          whatsappSessionId: response.data?.instance?.instanceId || `vendedor_${vendedorId}`,
        },
      });

      return { qrcode, instanceId: response.data?.instance?.instanceId };
    } catch (error) {
      this.logger.error(`Erro ao conectar WhatsApp: ${error.message}`);
      throw new Error('Erro ao conectar WhatsApp. Verifique se a Evolution API esta rodando.');
    }
  }

  async desconectar(vendedorId: string) {
    const vendedor = await this.prisma.vendedor.findUnique({ where: { id: vendedorId } });

    if (vendedor?.whatsappSessionId) {
      try {
        const apiUrl = this.configService.whatsappApiUrl;
        await axios.delete(`${apiUrl}/instance/delete/${vendedor.whatsappSessionId}`);
      } catch (error) {
        this.logger.warn(`Erro ao deletar instancia: ${error.message}`);
      }
    }

    return this.prisma.vendedor.update({
      where: { id: vendedorId },
      data: {
        whatsappConectado: false,
        whatsappSessionId: null,
      },
    });
  }

  async status(vendedorId: string) {
    const vendedor = await this.prisma.vendedor.findUnique({
      where: { id: vendedorId },
      select: { whatsappConectado: true, whatsappSessionId: true },
    });

    if (!vendedor?.whatsappSessionId) {
      return { conectado: false };
    }

    try {
      const apiUrl = this.configService.whatsappApiUrl;
      const response = await axios.get(`${apiUrl}/instance/connectionState/${vendedor.whatsappSessionId}`);
      const conectado = response.data?.instance?.state === 'open';

      if (conectado !== vendedor.whatsappConectado) {
        await this.prisma.vendedor.update({
          where: { id: vendedorId },
          data: { whatsappConectado: conectado },
        });
      }

      return { conectado, ...response.data };
    } catch {
      return { conectado: vendedor.whatsappConectado };
    }
  }

  async enviarMensagem(telefone: string, mensagem: string) {
    const apiUrl = this.configService.whatsappApiUrl;

    try {
      const response = await axios.post(`${apiUrl}/message/sendText`, {
        number: telefone,
        text: mensagem,
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem WhatsApp: ${error.message}`);
      throw error;
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
      boas_vindas: `Ola ${conversa.contatoNome}! Bem-vindo(a) ao ${nomeLoja || 'CardapioDigital'}! 🎉\n\nEnvie "cardapio" para ver nossos produtos, "pedido" para fazer um pedido, ou "agendar" para marcar um horario.`,
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

    await this.enviarMensagem(conversa.contatoTelefone, resposta);

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

  private async emitirEventosSocket(vendedorId: string, conversaId: string, evento: string, dados: any) {
    try {
      this.chatGateway.server.to(`user_${vendedorId}`).emit(evento, dados);
      this.chatGateway.server.to(`conversa_${conversaId}`).emit('new-message', dados);
    } catch (error) {
      this.logger.warn(`Erro ao emitir evento Socket.IO: ${error.message}`);
    }
  }

  async processarWebhook(payload: any) {
    this.logger.log('Webhook WhatsApp recebido');

    const { instanceName, data } = payload;
    const telefone = data?.key?.remoteJid?.replace('@s.whatsapp.net', '');
    const mensagem = data?.message?.conversation || data?.message?.extendedTextMessage?.text || '';
    const fromMe = data?.key?.fromMe;

    if (fromMe || !telefone) return { received: true };

    const vendedor = await this.prisma.vendedor.findFirst({
      where: { whatsappSessionId: instanceName },
      select: { id: true, userId: true, nomeLoja: true },
    });

    if (!vendedor) return { received: true };

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
            nome: data?.pushName || telefone,
            telefone,
          },
        });
      }

      conversa = await this.prisma.conversa.create({
        data: {
          vendedorId: vendedor.id,
          clienteId: cliente.id,
          contatoNome: data?.pushName || cliente.nome,
          contatoTelefone: telefone,
        },
        include: { cliente: true },
      });
    }

    await this.leadsService.upsert({
      vendedorId: vendedor.id,
      nome: data?.pushName || conversa.contatoNome,
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
      if (resposta) {
        this.emitirEventosSocket(vendedor.id, conversa.id, 'new-message', resposta);
      }
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
          await this.enviarMensagem(telefone, confirma);
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
        await this.enviarMensagem(telefone, erroMsg);
        const msgErro = await this.prisma.mensagem.create({
          data: { conversaId: conversa.id, remetente: 'vendedor', conteudo: erroMsg, tipo: 'texto' },
        });
        this.emitirEventosSocket(vendedor.id, conversa.id, 'new-message', msgErro);
      }
    } else if (saida.resposta) {
      await this.enviarMensagem(telefone, saida.resposta);
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
