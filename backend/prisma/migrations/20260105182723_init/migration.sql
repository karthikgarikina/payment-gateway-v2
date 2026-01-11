-- CreateTable
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "api_secret" TEXT NOT NULL,
    "webhook_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "receipt" TEXT,
    "notes" JSONB,
    "status" TEXT NOT NULL DEFAULT 'created',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "vpa" TEXT,
    "card_network" TEXT,
    "card_last4" TEXT,
    "error_code" TEXT,
    "error_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_email_key" ON "Merchant"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_api_key_key" ON "Merchant"("api_key");

-- CreateIndex
CREATE INDEX "Order_merchant_id_idx" ON "Order"("merchant_id");

-- CreateIndex
CREATE INDEX "Payment_order_id_idx" ON "Payment"("order_id");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
