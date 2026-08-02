-- CreateTable
-- Allowed consent purposes: MARKETING, PERSONALIZATION, TERMS
-- Allowed source channels: CHECKOUT, ONBOARDING, WEB
CREATE TABLE "consent_record" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "purpose_code" VARCHAR(32) NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "source_channel" VARCHAR(32) NOT NULL DEFAULT 'WEB',
    "recorded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_record_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "consent_record" ADD CONSTRAINT "consent_record_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "customer_session"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE;
