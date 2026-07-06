-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "vendedorId" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "origem" TEXT NOT NULL DEFAULT 'whatsapp',
    "mensagemInicial" TEXT,
    "ultimaMensagem" TEXT,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "convertedAt" TIMESTAMP(3),
    "conversaId" UUID,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_vendedorId_idx" ON "leads"("vendedorId");

-- CreateIndex
CREATE INDEX "leads_telefone_idx" ON "leads"("telefone");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "vendedores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
