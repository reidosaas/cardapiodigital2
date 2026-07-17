-- CreateIndex: Composite indexes for Pedido (dashboard & order queries)
CREATE INDEX "pedidos_vendedorId_status_idx" ON "pedidos"("vendedorId", "status");
CREATE INDEX "pedidos_vendedorId_createdAt_idx" ON "pedidos"("vendedorId", "createdAt");
CREATE INDEX "pedidos_clienteId_createdAt_idx" ON "pedidos"("clienteId", "createdAt");

-- CreateIndex: Entrega indexes (delivery queries, N+1 fix)
CREATE INDEX "entregas_pedidoId_idx" ON "entregas"("pedidoId");
CREATE INDEX "entregas_entregadorId_createdAt_idx" ON "entregas"("entregadorId", "createdAt");
CREATE INDEX "entregas_entregadorId_status_idx" ON "entregas"("entregadorId", "status");
CREATE INDEX "entregas_status_idx" ON "entregas"("status");

-- CreateIndex: Mensagem composite indexes (chat ordering & read status)
CREATE INDEX "mensagens_conversaId_createdAt_idx" ON "mensagens"("conversaId", "createdAt");
CREATE INDEX "mensagens_conversaId_remetente_lida_idx" ON "mensagens"("conversaId", "remetente", "lida");

-- CreateIndex: Conversa activity ordering
CREATE INDEX "conversas_vendedorId_ultimaAtividade_idx" ON "conversas"("vendedorId", "ultimaAtividade");

-- CreateIndex: Lead upsert by vendor+phone
CREATE INDEX "leads_vendedorId_telefone_idx" ON "leads"("vendedorId", "telefone");

-- CreateIndex: Notificacao history
CREATE INDEX "notificacoes_userId_createdAt_idx" ON "notificacoes"("userId", "createdAt");
