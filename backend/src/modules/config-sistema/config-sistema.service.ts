import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ConfigSistemaService {
  constructor(private prisma: PrismaService) {}

  async getConfig() {
    let config = await this.prisma.configSistema.findFirst();
    if (!config) {
      config = await this.prisma.configSistema.create({
        data: { nomeSistema: 'My Love Delivery', corTema: '#ef4444' },
      });
    }
    return config;
  }

  async updateConfig(data: {
    logoUrl?: string;
    nomeSistema?: string;
    corTema?: string;
    telefone?: string;
    emailContato?: string;
    redesSociais?: any;
  }) {
    const config = await this.getConfig();
    return this.prisma.configSistema.update({
      where: { id: config.id },
      data,
    });
  }
}
