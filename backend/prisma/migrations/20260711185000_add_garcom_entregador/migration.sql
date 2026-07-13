-- CreateTable Garcom
CREATE TABLE "garcons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendedorId" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "diaria" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "garcons_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "garcons_vendedorId_idx" ON "garcons"("vendedorId");

ALTER TABLE "garcons" ADD CONSTRAINT "garcons_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "vendedores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable Entregador
CREATE TABLE "entregadores" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendedorId" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "diaria" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valorPorEntrega" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entregadores_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "entregadores_vendedorId_idx" ON "entregadores"("vendedorId");

ALTER TABLE "entregadores" ADD CONSTRAINT "entregadores_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "vendedores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
