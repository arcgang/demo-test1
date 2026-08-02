-- CreateTable
CREATE TABLE "market_config" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "market_code" VARCHAR(8) NOT NULL,
    "market_name" VARCHAR(100) NOT NULL,
    "locale_code" VARCHAR(16) NOT NULL,
    "currency_code" VARCHAR(8) NOT NULL,
    "tax_label" VARCHAR(32) NOT NULL,
    "mobile_money_enabled" BOOLEAN NOT NULL DEFAULT false,
    "card_payment_enabled" BOOLEAN NOT NULL DEFAULT true,
    "lite_mode_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "market_config_market_code_key" ON "market_config"("market_code");

-- CreateTable
CREATE TABLE "product_cache" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" VARCHAR(64) NOT NULL,
    "market_code" VARCHAR(8) NOT NULL,
    "product_type" VARCHAR(32) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "price_once_off" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "price_recurring" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "availability_status" VARCHAR(32) NOT NULL,
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_cache_product_id_key" ON "product_cache"("product_id");

-- CreateTable
CREATE TABLE "customer_session" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "line_id" TEXT,
    "is_authenticated" BOOLEAN NOT NULL DEFAULT false,
    "market_code" VARCHAR(8) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_session_session_id_key" ON "customer_session"("session_id");

-- CreateTable
CREATE TABLE "cart" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" TEXT NOT NULL,
    "market_code" VARCHAR(8) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "currency_code" VARCHAR(8) NOT NULL,
    "once_off_subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "recurring_subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "credit_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "payable_now" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_item" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cart_id" UUID NOT NULL,
    "line_type" VARCHAR(32) NOT NULL,
    "reference_id" VARCHAR(64),
    "product_id" VARCHAR(64),
    "display_name" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "once_off_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "recurring_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eligibility_result" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "line_id" TEXT NOT NULL,
    "target_product_id" TEXT NOT NULL,
    "eligibility_status" VARCHAR(32) NOT NULL,
    "reason_code" VARCHAR(64),
    "compatible_plans_json" JSONB NOT NULL DEFAULT '[]',
    "inventory_status" VARCHAR(32),
    "evaluated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eligibility_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_quote" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "market_code" VARCHAR(8) NOT NULL,
    "quote_status" VARCHAR(32) NOT NULL,
    "options_json" JSONB NOT NULL,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_in_quote" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "market_code" VARCHAR(8) NOT NULL,
    "device_payload_json" JSONB NOT NULL,
    "quote_status" VARCHAR(32) NOT NULL,
    "estimated_credit" DECIMAL(12,2) NOT NULL,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_in_quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_case" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" TEXT NOT NULL,
    "market_code" VARCHAR(8) NOT NULL,
    "product_type" VARCHAR(32) NOT NULL,
    "customer_payload_json" JSONB NOT NULL,
    "porting_payload_json" JSONB,
    "verification_status" VARCHAR(32) NOT NULL,
    "activation_eligible" BOOLEAN NOT NULL DEFAULT false,
    "verification_reference" VARCHAR(128),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_attempt" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cart_id" UUID NOT NULL,
    "payment_method" VARCHAR(32) NOT NULL,
    "provider_name" VARCHAR(64) NOT NULL,
    "provider_reference" VARCHAR(128),
    "token_reference" VARCHAR(128),
    "payment_status" VARCHAR(32) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency_code" VARCHAR(8) NOT NULL,
    "callback_payload_json" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_order" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cart_id" UUID NOT NULL,
    "session_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "market_code" VARCHAR(8) NOT NULL,
    "external_order_reference" VARCHAR(128),
    "order_status" VARCHAR(32) NOT NULL,
    "payment_status" VARCHAR(32) NOT NULL,
    "verification_status" VARCHAR(32),
    "activation_status" VARCHAR(32),
    "total_amount" DECIMAL(12,2) NOT NULL,
    "currency_code" VARCHAR(8) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "line_type" VARCHAR(32) NOT NULL,
    "product_id" VARCHAR(64),
    "display_name" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "once_off_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "recurring_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activation_status" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "activation_state" VARCHAR(32) NOT NULL,
    "esim_reference" VARCHAR(128),
    "esim_qr_payload" TEXT,
    "milestone_payload_json" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activation_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activation_status_order_id_key" ON "activation_status"("order_id");

-- CreateTable
CREATE TABLE "audit_event" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" TEXT,
    "order_id" UUID,
    "event_type" VARCHAR(64) NOT NULL,
    "event_category" VARCHAR(64) NOT NULL,
    "actor_type" VARCHAR(32) NOT NULL,
    "actor_id" VARCHAR(64),
    "payload_json" JSONB NOT NULL DEFAULT '{}',
    "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_event_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "product_cache" ADD CONSTRAINT "product_cache_market_code_fkey" FOREIGN KEY ("market_code") REFERENCES "market_config"("market_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_session" ADD CONSTRAINT "customer_session_market_code_fkey" FOREIGN KEY ("market_code") REFERENCES "market_config"("market_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart" ADD CONSTRAINT "cart_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "customer_session"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart" ADD CONSTRAINT "cart_market_code_fkey" FOREIGN KEY ("market_code") REFERENCES "market_config"("market_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eligibility_result" ADD CONSTRAINT "eligibility_result_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "customer_session"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_quote" ADD CONSTRAINT "finance_quote_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "customer_session"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_quote" ADD CONSTRAINT "finance_quote_market_code_fkey" FOREIGN KEY ("market_code") REFERENCES "market_config"("market_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_in_quote" ADD CONSTRAINT "trade_in_quote_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "customer_session"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_in_quote" ADD CONSTRAINT "trade_in_quote_market_code_fkey" FOREIGN KEY ("market_code") REFERENCES "market_config"("market_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_case" ADD CONSTRAINT "verification_case_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "customer_session"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_case" ADD CONSTRAINT "verification_case_market_code_fkey" FOREIGN KEY ("market_code") REFERENCES "market_config"("market_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_attempt" ADD CONSTRAINT "payment_attempt_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "cart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_order" ADD CONSTRAINT "shop_order_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "cart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_order" ADD CONSTRAINT "shop_order_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "customer_session"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_order" ADD CONSTRAINT "shop_order_market_code_fkey" FOREIGN KEY ("market_code") REFERENCES "market_config"("market_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "shop_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activation_status" ADD CONSTRAINT "activation_status_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "shop_order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "customer_session"("session_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "shop_order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
