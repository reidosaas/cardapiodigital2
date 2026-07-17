-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'ENTREGADOR';

-- AlterTable: Add email and senha to entregadores
ALTER TABLE "entregadores" ADD COLUMN "email" TEXT,
ADD COLUMN "senha" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "entregadores_email_key" ON "entregadores"("email");
CREATE INDEX "entregadores_email_idx" ON "entregadores"("email");

-- CreateTable
CREATE TABLE "entregador_lojas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entregadorId" UUID NOT NULL,
    "vendedorId" UUID NOT NULL,
    "diaria" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valorPorEntrega" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entregador_lojas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "entregador_lojas_entregadorId_vendedorId_key" ON "entregador_lojas"("entregadorId", "vendedorId");
CREATE INDEX "entregador_lojas_vendedorId_idx" ON "entregador_lojas"("vendedorId");

-- AddForeignKey
ALTER TABLE "entregador_lojas" ADD CONSTRAINT "entregador_lojas_entregadorId_fkey" FOREIGN KEY ("entregadorId") REFERENCES "entregadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregador_lojas" ADD CONSTRAINT "entregador_lojas_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "vendedores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: Create EntregadorLoja for existing entregadores
INSERT INTO "entregador_lojas" ("id", "entregadorId", "vendedorId", "diaria", "valorPorEntrega", "ativo", "createdAt")
SELECT gen_random_uuid(), "id", "vendedorId", "diaria", "valorPorEntrega", true, NOW()
FROM "entregadores"
WHERE NOT EXISTS (
  SELECT 1 FROM "entregador_lojas" WHERE "entregador_lojas"."entregadorId" = "entregadores"."id" AND "entregador_lojas"."vendedorId" = "entregadores"."vendedorId"
);
