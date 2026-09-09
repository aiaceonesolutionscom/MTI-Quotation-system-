-- AlterTable: Drop unused columns from customers
ALTER TABLE "customers" DROP COLUMN IF EXISTS "contactPerson";
ALTER TABLE "customers" DROP COLUMN IF EXISTS "address";
ALTER TABLE "customers" DROP COLUMN IF EXISTS "phone";
ALTER TABLE "customers" DROP COLUMN IF EXISTS "email";
ALTER TABLE "customers" DROP COLUMN IF EXISTS "ntn";
ALTER TABLE "customers" DROP COLUMN IF EXISTS "strn";
ALTER TABLE "customers" DROP COLUMN IF EXISTS "notes";

-- AlterTable: Add country column to customers if not exists
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "country" TEXT;

-- AlterTable: Drop description column from products
ALTER TABLE "products" DROP COLUMN IF EXISTS "description";

-- AlterTable: Drop the redundant base UOM column from products (FK constraint first, then column)
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_uomId_fkey";
ALTER TABLE "products" DROP COLUMN IF EXISTS "uomId";