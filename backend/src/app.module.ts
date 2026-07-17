import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VendedoresModule } from './modules/vendedores/vendedores.module';
import { ProdutosModule } from './modules/produtos/produtos.module';
import { CategoriasModule } from './modules/categorias/categorias.module';
import { PedidosModule } from './modules/pedidos/pedidos.module';
import { PagamentosModule } from './modules/pagamentos/pagamentos.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { AgendamentosModule } from './modules/agendamentos/agendamentos.module';
import { FinanceiroModule } from './modules/financeiro/financeiro.module';
import { NotificacoesModule } from './modules/notificacoes/notificacoes.module';
import { CuponsModule } from './modules/cupons/cupons.module';
import { EntregasModule } from './modules/entregas/entregas.module';
import { BannersModule } from './modules/banners/banners.module';
import { AvaliacoesModule } from './modules/avaliacoes/avaliacoes.module';
import { AssinaturasModule } from './modules/assinaturas/assinaturas.module';
import { RelatoriosModule } from './modules/relatorios/relatorios.module';
import { UploadModule } from './modules/upload/upload.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { ChatModule } from './modules/chat/chat.module';
import { LogsModule } from './modules/logs/logs.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { AiModule } from './modules/ai/ai.module';
import { LeadsModule } from './modules/leads/leads.module';
import { CategoriasGlobaisModule } from './modules/categorias-globais/categorias-globais.module';
import { DespesasModule } from './modules/despesas/despesas.module';
import { MesasModule } from './modules/mesas/mesas.module';
import { GarconsModule } from './modules/garcons/garcons.module';
import { EntregadoresModule } from './modules/entregadores/entregadores.module';
import { EntregadorAuthModule } from './modules/entregador-auth/entregador-auth.module';
import { EntregadorDashboardModule } from './modules/entregador-dashboard/entregador-dashboard.module';
import { AdminEntregadoresModule } from './modules/admin-entregadores/admin-entregadores.module';
import { CaixaModule } from './modules/caixa/caixa.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    ThrottlerModule.forRoot({
      throttlers: [{ limit: 10000, ttl: 60000 }],
    }),
    AuthModule,
    UsersModule,
    VendedoresModule,
    ProdutosModule,
    CategoriasModule,
    PedidosModule,
    PagamentosModule,
    ClientesModule,
    WhatsAppModule,
    AgendamentosModule,
    FinanceiroModule,
    NotificacoesModule,
    CuponsModule,
    EntregasModule,
    BannersModule,
    AvaliacoesModule,
    AssinaturasModule,
    RelatoriosModule,
    UploadModule,
    WebhooksModule,
    ChatModule,
    LogsModule,
    ApiKeysModule,
    AiModule,
    LeadsModule,
    CategoriasGlobaisModule,
    DespesasModule,
    MesasModule,
    GarconsModule,
    EntregadoresModule,
    EntregadorAuthModule,
    EntregadorDashboardModule,
    AdminEntregadoresModule,
    CaixaModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
