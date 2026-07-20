import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AdminNotifyService } from '../admin-notify/admin-notify.service';

@Injectable()
export class ServerMonitorService {
  private readonly logger = new Logger(ServerMonitorService.name);

  constructor(private adminNotify: AdminNotifyService) {}

  @Cron('0 8 * * *', { timeZone: 'America/Sao_Paulo' })
  async handleDailyReport() {
    this.logger.log('Enviando relatório diário via WhatsApp...');
    try {
      await this.adminNotify.enviarRelatorioDiario();
    } catch (error) {
      this.logger.error(`Erro ao enviar relatório diário: ${error.message}`);
    }
  }

  @Cron('0 * * * *')
  async handleDiskCheck() {
    try {
      await this.adminNotify.verificarDiscoAlerta();
    } catch (error) {
      this.logger.error(`Erro ao verificar disco: ${error.message}`);
    }
  }
}
