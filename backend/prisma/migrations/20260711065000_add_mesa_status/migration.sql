-- AlterTable
ALTER TABLE "mesas" ADD COLUMN "status" "MesaStatus" NOT NULL DEFAULT 'DISPONIVEL';
ALTER TABLE "mesas" DROP COLUMN "aberta";
