-- AlterTable: add documento to vendedores
ALTER TABLE "vendedores" ADD COLUMN IF NOT EXISTS "documento" TEXT;

-- AlterTable: add cpf and chavePix to entregadores
ALTER TABLE "entregadores" ADD COLUMN IF NOT EXISTS "cpf" TEXT;
ALTER TABLE "entregadores" ADD COLUMN IF NOT EXISTS "chavePix" TEXT;
