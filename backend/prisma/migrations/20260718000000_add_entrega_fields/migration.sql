-- Adiciona colunas faltantes na tabela entregas que existem no schema Prisma
-- mas nao foram criadas pelas migrations anteriores.

ALTER TABLE "entregas" ADD COLUMN IF NOT EXISTS "valorEntrega" DECIMAL(10, 2);
ALTER TABLE "entregas" ADD COLUMN IF NOT EXISTS "valorCobrado" DECIMAL(10, 2);
ALTER TABLE "entregas" ADD COLUMN IF NOT EXISTS "aceitoEm" TIMESTAMP(3);
ALTER TABLE "entregas" ADD COLUMN IF NOT EXISTS "saiuEm" TIMESTAMP(3);
