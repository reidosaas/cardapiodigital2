-- CreateTable
CREATE TABLE "despesas" (
    "id" UUID NOT NULL,
    "vendedorId" UUID NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "categoria" TEXT,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "despesas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "despesas_vendedorId_idx" ON "despesas"("vendedorId");

-- CreateIndex
CREATE INDEX "despesas_vendedorId_data_idx" ON "despesas"("vendedorId", "data");

-- CreateIndex
CREATE INDEX "despesas_vendedorId_categoria_idx" ON "despesas"("vendedorId", "categoria");

-- AddForeignKey
ALTER TABLE "despesas" ADD CONSTRAINT "despesas_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "vendedores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
