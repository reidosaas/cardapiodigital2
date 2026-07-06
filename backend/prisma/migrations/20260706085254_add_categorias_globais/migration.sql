-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "categoriaGlobalId" UUID;

-- CreateTable
CREATE TABLE "categorias_globais" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "icone" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_globais_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_categoriaGlobalId_fkey" FOREIGN KEY ("categoriaGlobalId") REFERENCES "categorias_globais"("id") ON DELETE SET NULL ON UPDATE CASCADE;
