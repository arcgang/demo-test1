export const up = `
-- Allowed consent purposes: MARKETING, PERSONALIZATION, TERMS
-- Allowed source channels: CHECKOUT, ONBOARDING
CREATE TABLE IF NOT EXISTS consent_record (
  id             SERIAL PRIMARY KEY,
  order_id       INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  purpose_code   TEXT NOT NULL,
  granted        BOOLEAN NOT NULL,
  source_channel TEXT NOT NULL,
  recorded_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

export const down = `
DROP TABLE IF EXISTS consent_record;
`;
