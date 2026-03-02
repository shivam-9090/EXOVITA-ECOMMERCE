-- ============================================================
-- Fix 1: Add missing 'benefits' column to products
-- ============================================================
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "benefits" TEXT;

-- ============================================================
-- Fix 2: Create CouponType enum
-- ============================================================
DO $$ BEGIN
  CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FLAT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- Fix 3: Create coupons table
-- ============================================================
CREATE TABLE IF NOT EXISTS "coupons" (
    "id"                    TEXT NOT NULL PRIMARY KEY,
    "code"                  TEXT NOT NULL,
    "type"                  "CouponType" NOT NULL,
    "discount"              DOUBLE PRECISION NOT NULL,
    "minPurchase"           DOUBLE PRECISION,
    "maxDiscount"           DOUBLE PRECISION,
    "expiresAt"             TIMESTAMP(3),
    "usageLimit"            INTEGER,
    "usedCount"             INTEGER NOT NULL DEFAULT 0,
    "isActive"              BOOLEAN NOT NULL DEFAULT true,
    "applicableProducts"    TEXT[],
    "applicableCategories"  TEXT[],
    "specificUsers"         TEXT[],
    "description"           TEXT,
    "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "coupons_code_key" ON "coupons"("code");

-- ============================================================
-- Fix 4: Create coupon_usages table
-- ============================================================
CREATE TABLE IF NOT EXISTS "coupon_usages" (
    "id"        TEXT NOT NULL PRIMARY KEY,
    "coupon_id" TEXT NOT NULL,
    "user_id"   TEXT NOT NULL,
    "order_id"  TEXT,
    "used_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_usages_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "coupon_usages_user_id_fkey"   FOREIGN KEY ("user_id")   REFERENCES "users"("id")   ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "coupon_usages_order_id_fkey"  FOREIGN KEY ("order_id")  REFERENCES "orders"("id")  ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "coupon_usages_coupon_id_user_id_key" ON "coupon_usages"("coupon_id", "user_id");
