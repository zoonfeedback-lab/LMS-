-- AlterTable
ALTER TABLE "AdminRequest" ADD COLUMN     "password" TEXT,
ALTER COLUMN "batchName" DROP NOT NULL;
