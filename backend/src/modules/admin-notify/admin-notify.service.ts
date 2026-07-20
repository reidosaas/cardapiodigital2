import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '../../config/config.service';
import { execSync } from 'child_process';

@Injectable()
export class AdminNotifyService {
  private readonly logger = new Logger(AdminNotifyService.name);
  private uazapi: any = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const url = this.configService.uazapiUrl;
    const token = this.configService.uazapiAdminToken;
    if (url && token) {
      try {
        const { UazapiClient } = require('@eziocm/uazapi');
        this.uazapi = new UazapiClient({ baseUrl: url, adminToken: token });
      } catch (e) {
        this.logger.warn('UazapiClient nao disponivel para admin notify');
      }
    }
  }

  private async getConfig() {
    let config = await this.prisma.configSistema.findFirst();
    if (!config) {
      config = await this.prisma.configSistema.create({
        data: { nomeSistema: 'My Love Delivery', corTema: '#ef4444' },
      });
    }
    return config;
  }

  async getWhatsAppStatus() {
    const config = await this.getConfig();
    return {
      conectado: config.whatsappAdminConectado || false,
      numero: config.whatsappAdminNumero || null,
      instancia: config.whatsappAdminInstancia || null,
    };
  }

  async conectar() {
    if (!this.uazapi) {
      throw new Error('UAZAPI nao configurada no servidor');
    }

    const config = await this.getConfig();
    const instanceName = 'admin_mylovedelivery';

    try {
      let instanceToken = config.whatsappAdminToken;

      if (!instanceToken) {
        const allInstances: any[] = await this.uazapi.instance.listAll();
        const existing = allInstances.find((i: any) => i.name === instanceName);
        if (existing) {
          instanceToken = existing.token;
        } else {
          const novaInstancia: any = await this.uazapi.instance.create({ name: instanceName });
          instanceToken = novaInstancia?.token || instanceName;
        }
      }

      await this.prisma.configSistema.update({
        where: { id: config.id },
        data: { whatsappAdminInstancia: instanceName, whatsappAdminToken: instanceToken },
      });

      const connection = await this.uazapi.instance.connect(instanceToken);
      const conn: any = connection;
      const qrcode = conn?.instance?.qrcode || conn?.qrcode?.base64 || conn?.qrcode || conn?.base64 || conn?.qr || conn;

      return { qrcode, instanceName };
    } catch (error) {
      this.logger.error(`Erro ao conectar WhatsApp admin: ${error.message}`);
      throw new Error('Erro ao conectar WhatsApp admin');
    }
  }

  async desconectar() {
    const config = await this.getConfig();

    if (config.whatsappAdminInstancia && this.uazapi) {
      try {
        await this.uazapi.instance.delete(config.whatsappAdminInstancia);
      } catch (error) {
        this.logger.warn(`Erro ao deletar instancia admin: ${error.message}`);
      }
    }

    return this.prisma.configSistema.update({
      where: { id: config.id },
      data: {
        whatsappAdminConectado: false,
        whatsappAdminInstancia: null,
        whatsappAdminToken: null,
      },
    });
  }

  async status() {
    const config = await this.getConfig();

    if (!config.whatsappAdminToken || !this.uazapi) {
      return { conectado: false };
    }

    try {
      const info: any = await this.uazapi.instance.getStatus(config.whatsappAdminToken);
      const conectado = info?.state === 'connected' || info?.status === 'connected';

      if (conectado !== config.whatsappAdminConectado) {
        await this.prisma.configSistema.update({
          where: { id: config.id },
          data: { whatsappAdminConectado: conectado },
        });
      }

      return { conectado, ...info };
    } catch {
      return { conectado: config.whatsappAdminConectado || false };
    }
  }

  async enviarMensagem(telefone: string, mensagem: string) {
    const config = await this.getConfig();

    if (!config.whatsappAdminToken || !this.uazapi) {
      this.logger.warn('WhatsApp admin nao conectado - mensagem nao enviada');
      return null;
    }

    try {
      return await this.uazapi.send.text(config.whatsappAdminToken, {
        number: telefone,
        text: mensagem,
      });
    } catch (error) {
      this.logger.error(`Erro ao enviar msg WhatsApp admin: ${error.message}`);
      return null;
    }
  }

  async notificarCadastro(tipo: 'vendedor' | 'entregador' | 'cliente', dados: { nome: string; email: string; telefone?: string }) {
    const config = await this.getConfig();
    const numeroAdmin = config.whatsappAdminNumero;

    if (!numeroAdmin) {
      this.logger.debug('Numero WhatsApp admin nao configurado - notificacao ignorada');
      return;
    }

    const labels: Record<string, string> = {
      vendedor: '🏪 Novo Vendedor',
      entregador: '🛵 Novo Entregador',
      cliente: '👤 Novo Cliente',
    };

    const mensagem = `${labels[tipo]}\n\nNome: ${dados.nome}\nEmail: ${dados.email}${dados.telefone ? `\nTelefone: ${dados.telefone}` : ''}\n\nCadastro realizado no My Love Delivery.`;

    await this.enviarMensagem(numeroAdmin, mensagem);
  }

  async enviarRelatorioDiario() {
    const config = await this.getConfig();
    const numeroAdmin = config.whatsappAdminNumero;

    if (!numeroAdmin) return;

    let info: any = {};
    try {
      info = this.getServerInfo();
    } catch (error) {
      this.logger.error(`Erro ao coletar info do servidor: ${error.message}`);
      return;
    }

    const mensagem = `📊 *Relatório Diário - My Love Delivery*\n\n` +
      `🖥️ *Servidor:* ${info.hostname}\n` +
      `⏱️ *Uptime:* ${info.uptimeFormatted}\n\n` +
      `💻 *CPU:* ${info.cpu.model} (${info.cpu.cores} cores)\n` +
      `Uso: ${info.cpu.usage}%\n\n` +
      `🧠 *RAM:* ${info.memory.used} / ${info.memory.total} (${info.memory.percent}%)\n\n` +
      `💾 *Disco:* ${info.disk.used} / ${info.disk.total} (${info.disk.percent})\n\n` +
      `🐳 *Docker:* ${info.dockerContainers.length} containers\n` +
      info.dockerContainers.map((c: any) => `  • ${c.name}: ${c.status}`).join('\n') + '\n\n' +
      `📅 ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;

    await this.enviarMensagem(numeroAdmin, mensagem);
  }

  async verificarDiscoAlerta() {
    const config = await this.getConfig();
    const numeroAdmin = config.whatsappAdminNumero;

    if (!numeroAdmin) return;

    let diskInfo: any = {};
    try {
      const df = execSync('df -h / 2>/dev/null | tail -1', { encoding: 'utf-8' }).trim();
      const parts = df.split(/\s+/);
      diskInfo = {
        total: parts[1] || 'N/A',
        used: parts[2] || 'N/A',
        available: parts[3] || 'N/A',
        percent: parseInt(parts[4] || '0'),
      };
    } catch {
      return;
    }

    if (diskInfo.percent >= 80) {
      const urgencia = diskInfo.percent >= 90 ? '🚨 URGENTE' : '⚠️ ALERTA';
      const mensagem = `${urgencia} - Disco Almost Full!\n\n` +
        `💾 *Disco:* ${diskInfo.used} / ${diskInfo.total} (${diskInfo.percent}%)\n` +
        `📌 *Disponível:* ${diskInfo.available}\n\n` +
        `Acesse o painel admin para fazer limpeza.`;

      await this.enviarMensagem(numeroAdmin, mensagem);
    }
  }

  private getServerInfo() {
    const os = require('os');
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const uptime = os.uptime();

    let diskInfo: any = { total: 'N/A', used: 'N/A', available: 'N/A', percent: '0' };
    try {
      const df = execSync('df -h / 2>/dev/null | tail -1', { encoding: 'utf-8' }).trim();
      const parts = df.split(/\s+/);
      diskInfo = { total: parts[1], used: parts[2], available: parts[3], percent: parts[4] };
    } catch {}

    let dockerInfo: any[] = [];
    try {
      const ps = execSync('docker ps --format "{{.Names}}|{{.Status}}" 2>/dev/null', { encoding: 'utf-8' }).trim();
      dockerInfo = ps.split('\n').filter(Boolean).map((line) => {
        const [name, status] = line.split('|');
        return { name, status };
      });
    } catch {}

    const d = Math.floor(uptime / 86400);
    const h = Math.floor((uptime % 86400) / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const uptimeFormatted = d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m` : `${m}m`;

    return {
      hostname: os.hostname(),
      uptimeFormatted,
      cpu: {
        model: cpus[0]?.model || 'N/A',
        cores: cpus.length,
        usage: Math.min(100, Math.round((os.loadavg()[0] / cpus.length) * 100)),
      },
      memory: {
        total: `${(totalMem / (1024**3)).toFixed(1)} GB`,
        used: `${((totalMem - freeMem) / (1024**3)).toFixed(1)} GB`,
        percent: Math.round(((totalMem - freeMem) / totalMem) * 100),
      },
      disk: diskInfo,
      dockerContainers: dockerInfo,
    };
  }
}
