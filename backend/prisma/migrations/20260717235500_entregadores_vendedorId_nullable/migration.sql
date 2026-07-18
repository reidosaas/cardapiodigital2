-- Allow entregador self-cadastro without a loja (vendedorId nullable)
ALTER TABLE "entregadores" ALTER COLUMN "vendedorId" DROP NOT NULL;
