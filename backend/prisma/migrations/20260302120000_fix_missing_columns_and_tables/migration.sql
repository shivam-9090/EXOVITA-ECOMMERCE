-- ============================================================
-- Fix 1: Add shortdescription column to products
-- ============================================================
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "shortdescription" TEXT;

-- ============================================================
-- Fix 2: Add coupon columns to cart_items
-- ============================================================
ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "couponid"       TEXT;
ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "couponcode"     TEXT;
ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "originalprice"  DOUBLE PRECISION;
ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "discountedprice" DOUBLE PRECISION;

-- ============================================================
-- Fix 3: Add category + description + isPublic to settings
-- ============================================================
DO $$ BEGIN
  CREATE TYPE "SettingCategory" AS ENUM ('STORE', 'TAX', 'PAYMENT', 'EMAIL', 'SMS', 'NOTIFICATIONS', 'GENERAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "category"    "SettingCategory";
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "isPublic"    BOOLEAN NOT NULL DEFAULT false;

-- Set default category for any existing rows before making it NOT NULL
UPDATE "settings" SET "category" = 'GENERAL' WHERE "category" IS NULL;

-- Now enforce NOT NULL
ALTER TABLE "settings" ALTER COLUMN "category" SET NOT NULL;

-- Add index on category
CREATE INDEX IF NOT EXISTS "settings_category_idx" ON "settings"("category");

-- ============================================================
-- Fix 4: Create banners table
-- ============================================================
CREATE TABLE IF NOT EXISTS "banners" (
    "id"         TEXT NOT NULL PRIMARY KEY,
    "title"      TEXT NOT NULL,
    "subtitle"   TEXT,
    "image"      TEXT NOT NULL,
    "link"       TEXT,
    "buttonText" TEXT,
    "position"   INTEGER NOT NULL DEFAULT 0,
    "isActive"   BOOLEAN NOT NULL DEFAULT true,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Fix 5: Create pages table (if missing)
-- ============================================================
CREATE TABLE IF NOT EXISTS "pages" (
    "id"              TEXT NOT NULL PRIMARY KEY,
    "slug"            TEXT NOT NULL,
    "title"           TEXT NOT NULL,
    "content"         TEXT NOT NULL,
    "metaTitle"       TEXT,
    "metaDescription" TEXT,
    "isPublished"     BOOLEAN NOT NULL DEFAULT true,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "pages_slug_key" ON "pages"("slug");

-- Insert default pages
INSERT INTO "pages" ("id", "slug", "title", "content", "metaTitle", "metaDescription", "isPublished", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::TEXT, 'about', 'About EXOVITA', '<h1>About EXOVITA</h1><p>Welcome to EXOVITA, your trusted source for premium natural beauty and wellness products.</p>', 'About Us - EXOVITA', 'Learn about EXOVITA mission to provide premium natural beauty products', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'privacy-policy', 'Privacy Policy', '<h1>Privacy Policy</h1><p>Last updated: March 2026</p><p>Your privacy is important to us.</p>', 'Privacy Policy - EXOVITA', 'Read our privacy policy and data protection practices', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'terms-of-service', 'Terms of Service', '<h1>Terms of Service</h1><p>Last updated: March 2026</p><p>By accessing EXOVITA, you agree to these terms.</p>', 'Terms of Service - EXOVITA', 'Read our terms and conditions', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (slug) DO NOTHING;
