-- AlterTable: Add endereco fields to vendedores
ALTER TABLE "vendedores" ADD COLUMN "rua" TEXT,
ADD COLUMN "numero" TEXT,
ADD COLUMN "bairro" TEXT;
