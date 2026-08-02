export const up = `
-- Allowed consent purposes: MARKETING, PERSONALIZATION, TERMS
-- Allowed source channels: CHECKOUT, ONBOARDING, WEB
CREATE TABLE IF NOT EXISTS consent_record (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     TEXT NOT NULL REFERENCES customer_session(session_id) ON DELETE RESTRICT,
  customer_id    TEXT,
  purpose_code   VARCHAR(32) NOT NULL,
  granted        BOOLEAN NOT NULL,
  source_channel VARCHAR(32) NOT NULL DEFAULT 'WEB',
  recorded_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

export const down = `
DROP TABLE IF EXISTS consent_record;
`;
