-- Create SettingCategory enum
CREATE TYPE "SettingCategory" AS ENUM ('STORE', 'TAX', 'PAYMENT', 'EMAIL', 'SMS', 'NOTIFICATIONS', 'GENERAL');

-- Create settings table
CREATE TABLE "settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL UNIQUE,
    "value" TEXT NOT NULL,
    "category" "SettingCategory" NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX "settings_category_idx" ON "settings"("category");

-- Insert default settings
INSERT INTO "settings" ("id", "key", "value", "category", "description", "isPublic") VALUES
-- Store Settings
(gen_random_uuid(), 'store_name', 'EXOVITA', 'STORE', 'Store name displayed across the site', true),
(gen_random_uuid(), 'store_email', 'contact@exovita.com', 'STORE', 'Store contact email', true),
(gen_random_uuid(), 'store_phone', '+1234567890', 'STORE', 'Store contact phone number', true),
(gen_random_uuid(), 'store_address', '123 Business Street, City, Country', 'STORE', 'Store physical address', true),
(gen_random_uuid(), 'store_currency', 'USD', 'STORE', 'Store default currency', true),
(gen_random_uuid(), 'store_timezone', 'UTC', 'STORE', 'Store timezone', false),
(gen_random_uuid(), 'store_logo_url', '/logo.png', 'STORE', 'Store logo URL', true),
(gen_random_uuid(), 'store_description', 'Premium natural hair care products', 'STORE', 'Store description for SEO', true),

-- Tax Settings
(gen_random_uuid(), 'tax_enabled', 'true', 'TAX', 'Enable/disable tax calculation', false),
(gen_random_uuid(), 'tax_rate', '18', 'TAX', 'GST/Tax rate percentage', false),
(gen_random_uuid(), 'tax_label', 'GST', 'TAX', 'Tax label (GST, VAT, etc.)', false),
(gen_random_uuid(), 'tax_included_in_price', 'false', 'TAX', 'Whether tax is included in product prices', false),
(gen_random_uuid(), 'tax_registration_number', '', 'TAX', 'Business tax/GST registration number', false),

-- Payment Settings
(gen_random_uuid(), 'payment_cod_enabled', 'true', 'PAYMENT', 'Enable Cash on Delivery', false),
(gen_random_uuid(), 'payment_cod_max_amount', '10000', 'PAYMENT', 'Maximum COD order amount', false),
(gen_random_uuid(), 'payment_stripe_enabled', 'false', 'PAYMENT', 'Enable Stripe payments', false),
(gen_random_uuid(), 'payment_stripe_public_key', '', 'PAYMENT', 'Stripe publishable key', false),
(gen_random_uuid(), 'payment_stripe_secret_key', '', 'PAYMENT', 'Stripe secret key (encrypted)', false),
(gen_random_uuid(), 'payment_razorpay_enabled', 'false', 'PAYMENT', 'Enable Razorpay payments', false),
(gen_random_uuid(), 'payment_razorpay_key_id', '', 'PAYMENT', 'Razorpay Key ID', false),
(gen_random_uuid(), 'payment_razorpay_key_secret', '', 'PAYMENT', 'Razorpay Key Secret (encrypted)', false),

-- Email Settings
(gen_random_uuid(), 'email_enabled', 'false', 'EMAIL', 'Enable email notifications', false),
(gen_random_uuid(), 'email_smtp_host', 'smtp.gmail.com', 'EMAIL', 'SMTP server host', false),
(gen_random_uuid(), 'email_smtp_port', '587', 'EMAIL', 'SMTP server port', false),
(gen_random_uuid(), 'email_smtp_secure', 'true', 'EMAIL', 'Use TLS/SSL', false),
(gen_random_uuid(), 'email_smtp_user', '', 'EMAIL', 'SMTP username/email', false),
(gen_random_uuid(), 'email_smtp_password', '', 'EMAIL', 'SMTP password (encrypted)', false),
(gen_random_uuid(), 'email_from_name', 'EXOVITA', 'EMAIL', 'Email sender name', false),
(gen_random_uuid(), 'email_from_address', 'noreply@exovita.com', 'EMAIL', 'Email sender address', false),

-- SMS Settings
(gen_random_uuid(), 'sms_enabled', 'false', 'SMS', 'Enable SMS notifications', false),
(gen_random_uuid(), 'sms_provider', 'twilio', 'SMS', 'SMS provider (twilio, aws, etc.)', false),
(gen_random_uuid(), 'sms_twilio_account_sid', '', 'SMS', 'Twilio Account SID', false),
(gen_random_uuid(), 'sms_twilio_auth_token', '', 'SMS', 'Twilio Auth Token (encrypted)', false),
(gen_random_uuid(), 'sms_twilio_phone_number', '', 'SMS', 'Twilio phone number', false),

-- Notification Settings
(gen_random_uuid(), 'notify_order_created', 'true', 'NOTIFICATIONS', 'Notify admin on new order', false),
(gen_random_uuid(), 'notify_order_cancelled', 'true', 'NOTIFICATIONS', 'Notify admin on order cancellation', false),
(gen_random_uuid(), 'notify_low_stock', 'true', 'NOTIFICATIONS', 'Notify admin on low stock', false),
(gen_random_uuid(), 'notify_low_stock_threshold', '10', 'NOTIFICATIONS', 'Low stock threshold', false),
(gen_random_uuid(), 'notify_new_review', 'true', 'NOTIFICATIONS', 'Notify admin on new review', false),
(gen_random_uuid(), 'notify_customer_order_confirmed', 'true', 'NOTIFICATIONS', 'Notify customer on order confirmation', false),
(gen_random_uuid(), 'notify_customer_order_shipped', 'true', 'NOTIFICATIONS', 'Notify customer on order shipment', false),
(gen_random_uuid(), 'notify_customer_order_delivered', 'true', 'NOTIFICATIONS', 'Notify customer on delivery', false),

-- General Settings
(gen_random_uuid(), 'site_maintenance_mode', 'false', 'GENERAL', 'Enable maintenance mode', false),
(gen_random_uuid(), 'site_maintenance_message', 'Site under maintenance. We will be back soon!', 'GENERAL', 'Maintenance mode message', false),
(gen_random_uuid(), 'free_shipping_threshold', '1000', 'GENERAL', 'Minimum order amount for free shipping', false),
(gen_random_uuid(), 'default_shipping_cost', '50', 'GENERAL', 'Default shipping cost', false),
(gen_random_uuid(), 'order_auto_cancel_days', '7', 'GENERAL', 'Auto-cancel pending orders after days', false);
