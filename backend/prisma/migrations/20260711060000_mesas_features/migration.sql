-- AlterTable: rename ativo -> aberta on mesas
ALTER TABLE "mesas" DROP COLUMN "ativo",
ADD COLUMN "aberta" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: add mesaId to pedidos
ALTER TABLE "pedidos" ADD COLUMN "mesaId" UUID;

-- CreateIndex
CREATE INDEX "pedidos_mesaId_idx" ON "pedidos"("mesaId");

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "mesas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
