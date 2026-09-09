-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_defaultRangeTypeId_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_defaultSizeId_fkey";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "defaultRangeTypeId",
DROP COLUMN "defaultSizeId";

