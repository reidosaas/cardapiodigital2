-- CreateTable
CREATE TABLE "mesas" (
    "id" UUID NOT NULL,
    "vendedorId" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mesas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mesas_vendedorId_idx" ON "mesas"("vendedorId");

-- CreateIndex
CREATE UNIQUE INDEX "mesas_vendedorId_nome_key" ON "mesas"("vendedorId", "nome");

-- AddForeignKey
ALTER TABLE "mesas" ADD CONSTRAINT "mesas_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "vendedores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
