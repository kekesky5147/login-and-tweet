-- AlterTable
ALTER TABLE "Tweet" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT;
