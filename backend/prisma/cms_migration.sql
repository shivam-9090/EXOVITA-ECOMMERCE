-- Create banners table
CREATE TABLE IF NOT EXISTS banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image TEXT NOT NULL,
  link TEXT,
  "buttonText" TEXT,
  position INTEGER DEFAULT 0 NOT NULL,
  "isActive" BOOLEAN DEFAULT true NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create pages table
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  "metaTitle" TEXT,
  "metaDescription" TEXT,
  "isPublished" BOOLEAN DEFAULT true NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Insert default pages
INSERT INTO pages (id, slug, title, content, "metaTitle", "metaDescription", "isPublished", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid()::TEXT, 'about', 'About EXOVITA', '<h1>About EXOVITA</h1><p>Welcome to EXOVITA, your trusted source for premium natural beauty and wellness products.</p><p>We believe in harnessing the power of nature to bring you effective, sustainable, and ethically-sourced products that enhance your natural beauty.</p>', 'About Us - EXOVITA', 'Learn about EXOVITA''s mission to provide premium natural beauty products', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'privacy-policy', 'Privacy Policy', '<h1>Privacy Policy</h1><p>Last updated: February 3, 2026</p><p>Your privacy is important to us. This privacy policy explains how we collect, use, and protect your personal information.</p><h2>Information We Collect</h2><p>We collect information you provide directly to us when you create an account, place an order, or contact us.</p>', 'Privacy Policy - EXOVITA', 'Read our privacy policy and data protection practices', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::TEXT, 'terms-of-service', 'Terms of Service', '<h1>Terms of Service</h1><p>Last updated: February 3, 2026</p><p>By accessing and using EXOVITA, you accept and agree to be bound by the terms of this agreement.</p><h2>Use of Service</h2><p>You must be at least 18 years old to use our service.</p>', 'Terms of Service - EXOVITA', 'Read our terms and conditions', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (slug) DO NOTHING;
