-- AlterTable: add Shiprocket integration fields to shipments
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "shiprocketOrderId" TEXT;
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "shiprocketShipmentId" TEXT;
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "awbCode" TEXT;
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "courierName" TEXT;
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "shiprocketStatus" TEXT;
