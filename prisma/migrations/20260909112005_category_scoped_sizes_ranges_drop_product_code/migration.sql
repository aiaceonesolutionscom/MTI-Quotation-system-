-- DropIndex
DROP INDEX "products_code_key";

-- DropIndex
DROP INDEX "range_types_name_key";

-- DropIndex
DROP INDEX "sizes_name_key";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "code";

-- AlterTable
ALTER TABLE "range_types" ADD COLUMN     "categoryId" TEXT;

-- AlterTable
ALTER TABLE "sizes" ADD COLUMN     "categoryId" TEXT;

-- CreateIndex
CREATE INDEX "range_types_categoryId_idx" ON "range_types"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "range_types_categoryId_name_key" ON "range_types"("categoryId", "name");

-- CreateIndex
CREATE INDEX "sizes_categoryId_idx" ON "sizes"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "sizes_categoryId_name_key" ON "sizes"("categoryId", "name");

-- AddForeignKey
ALTER TABLE "sizes" ADD CONSTRAINT "sizes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "range_types" ADD CONSTRAINT "range_types_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

