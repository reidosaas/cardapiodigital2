-- CreateTable
CREATE TABLE "notificacoes_loja" (
    "id" UUID NOT NULL,
    "vendedorId" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "notificado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_loja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notificacoes_loja_vendedorId_idx" ON "notificacoes_loja"("vendedorId");

-- AddForeignKey
ALTER TABLE "notificacoes_loja" ADD CONSTRAINT "notificacoes_loja_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "vendedores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
