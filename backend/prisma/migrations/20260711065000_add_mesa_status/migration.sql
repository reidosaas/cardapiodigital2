-- CreateEnum
CREATE TYPE "MesaStatus" AS ENUM ('DISPONIVEL', 'EM_CONSUMO', 'PEDIU_CONTA');

-- AlterTable
ALTER TABLE "mesas" ADD COLUMN "status" "MesaStatus" NOT NULL DEFAULT 'DISPONIVEL';
ALTER TABLE "mesas" DROP COLUMN "aberta";
