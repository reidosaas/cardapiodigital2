-- Add missing columns to pedidos (endereco detalhado)
ALTER TABLE "pedidos" ADD COLUMN "rua" TEXT,
ADD COLUMN "numero" TEXT,
ADD COLUMN "bairro" TEXT,
ADD COLUMN "complemento" TEXT;

-- Add status column to entregador_lojas
ALTER TABLE "entregador_lojas" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDENTE';

-- Create entregador_checkins table
CREATE TABLE "entregador_checkins" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entregadorId" UUID NOT NULL,
    "vendedorId" UUID NOT NULL,
    "lojaId" UUID NOT NULL,
    "data" DATE NOT NULL,
    "checkinEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valorDiaria" DECIMAL(10,2) NOT NULL,
    "valorEntregas" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valorTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalEntregas" INTEGER NOT NULL DEFAULT 0,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "pagoEm" TIMESTAMP(3),
    "observacao" TEXT,

    CONSTRAINT "entregador_checkins_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "entregador_checkins_entregadorId_vendedorId_data_key" ON "entregador_checkins"("entregadorId", "vendedorId", "data");
CREATE INDEX "entregador_checkins_vendedorId_idx" ON "entregador_checkins"("vendedorId");
CREATE INDEX "entregador_checkins_entregadorId_idx" ON "entregador_checkins"("entregadorId");
CREATE INDEX "entregador_checkins_vendedorId_data_idx" ON "entregador_checkins"("vendedorId", "data");

ALTER TABLE "entregador_checkins" ADD CONSTRAINT "entregador_checkins_entregadorId_fkey" FOREIGN KEY ("entregadorId") REFERENCES "entregadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
