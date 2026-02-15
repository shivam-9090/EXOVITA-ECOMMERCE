-- Create LoginStatus enum
CREATE TYPE "LoginStatus" AS ENUM ('SUCCESS', 'FAILED');

-- Create admin_logs table
CREATE TABLE "admin_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "admin_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create indexes for admin_logs
CREATE INDEX "admin_logs_userId_idx" ON "admin_logs"("userId");
CREATE INDEX "admin_logs_action_idx" ON "admin_logs"("action");
CREATE INDEX "admin_logs_entity_idx" ON "admin_logs"("entity");
CREATE INDEX "admin_logs_createdAt_idx" ON "admin_logs"("createdAt");

-- Create login_history table
CREATE TABLE "login_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "status" "LoginStatus" NOT NULL,
    "failReason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "login_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create indexes for login_history
CREATE INDEX "login_history_userId_idx" ON "login_history"("userId");
CREATE INDEX "login_history_email_idx" ON "login_history"("email");
CREATE INDEX "login_history_status_idx" ON "login_history"("status");
CREATE INDEX "login_history_createdAt_idx" ON "login_history"("createdAt");
