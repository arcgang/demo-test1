/**
 * Acceptance tests: consent_record database migration
 *
 * Validates the Prisma-generated migration SQL that actually runs against
 * the database. The SQL is imported directly from the migration file so
 * these tests cover the authoritative source, not a parallel hand-written copy.
 *
 * Acceptance criteria (from task spec):
 *   - table: consent_record
 *   - columns: id (PK), purpose_code (varchar, NOT NULL), granted (boolean),
 *              source_channel (varchar, NOT NULL), recorded_at (timestamptz)
 *   - foreign key to orders or session/customer
 *   - purpose_code and source_channel are NOT NULL
 */

import * as fs from "fs";
import * as path from "path";

const MIGRATION_PATH = path.resolve(
  __dirname,
  "../../prisma/migrations/20260802000000_add_consent_record/migration.sql"
);

const sql = fs.readFileSync(MIGRATION_PATH, "utf8");

// ── Table creation ────────────────────────────────────────────────────────────

describe("consent_record migration – table creation", () => {
  it("creates the consent_record table", () => {
    expect(sql.toUpperCase()).toMatch(/CREATE\s+TABLE\s+("consent_record"|consent_record)/i);
  });
});

// ── Column presence ───────────────────────────────────────────────────────────

describe("consent_record migration – column definitions", () => {
  it("defines an id column", () => {
    expect(sql).toMatch(/\bid\b/i);
  });

  it("defines a purpose_code column", () => {
    expect(sql).toMatch(/\bpurpose_code\b/i);
  });

  it("defines a granted column", () => {
    expect(sql).toMatch(/\bgranted\b/i);
  });

  it("defines a source_channel column", () => {
    expect(sql).toMatch(/\bsource_channel\b/i);
  });

  it("defines a recorded_at column", () => {
    expect(sql).toMatch(/\brecorded_at\b/i);
  });
});

// ── Primary key ───────────────────────────────────────────────────────────────

describe("consent_record migration – primary key", () => {
  it("id is declared as the primary key", () => {
    const hasPrimaryKey =
      /\bid\b[^,)]*PRIMARY\s+KEY/i.test(sql) ||
      /PRIMARY\s+KEY\s*\(\s*"?id"?\s*\)/i.test(sql) ||
      /CONSTRAINT\s+\S+\s+PRIMARY\s+KEY\s*\(\s*"?id"?\s*\)/i.test(sql);
    expect(hasPrimaryKey).toBe(true);
  });
});

// ── NOT NULL constraints ──────────────────────────────────────────────────────

describe("consent_record migration – NOT NULL constraints", () => {
  it("purpose_code column is NOT NULL", () => {
    const match = sql.match(/["']?purpose_code["']?[^\n]+/i);
    expect(match).not.toBeNull();
    expect(match![0].toUpperCase()).toContain("NOT NULL");
  });

  it("source_channel column is NOT NULL", () => {
    const match = sql.match(/["']?source_channel["']?[^\n]+/i);
    expect(match).not.toBeNull();
    expect(match![0].toUpperCase()).toContain("NOT NULL");
  });
});

// ── Data types ────────────────────────────────────────────────────────────────

describe("consent_record migration – column data types", () => {
  it("purpose_code uses a VARCHAR or TEXT type", () => {
    const match = sql.match(/["']?purpose_code["']?[^\n]+/i);
    expect(match).not.toBeNull();
    expect(/VARCHAR|TEXT/.test(match![0].toUpperCase())).toBe(true);
  });

  it("source_channel uses a VARCHAR or TEXT type", () => {
    const match = sql.match(/["']?source_channel["']?[^\n]+/i);
    expect(match).not.toBeNull();
    expect(/VARCHAR|TEXT/.test(match![0].toUpperCase())).toBe(true);
  });

  it("granted uses a BOOLEAN type", () => {
    const match = sql.match(/["']?granted["']?[^\n]+/i);
    expect(match).not.toBeNull();
    expect(match![0].toUpperCase()).toContain("BOOLEAN");
  });

  it("recorded_at uses a TIMESTAMPTZ or TIMESTAMP WITH TIME ZONE type", () => {
    const match = sql.match(/["']?recorded_at["']?[^\n]+/i);
    expect(match).not.toBeNull();
    const line = match![0].toUpperCase();
    const hasTimestamptz =
      /TIMESTAMPTZ/.test(line) || /TIMESTAMP\s+WITH\s+TIME\s+ZONE/.test(line);
    expect(hasTimestamptz).toBe(true);
  });
});

// ── Foreign key ───────────────────────────────────────────────────────────────

describe("consent_record migration – foreign key constraint", () => {
  it("contains a REFERENCES clause (foreign key to another table)", () => {
    expect(sql.toUpperCase()).toMatch(/REFERENCES\s+\S+/);
  });

  it("foreign key references an orders, customer, or session table", () => {
    const match = sql.match(/REFERENCES\s+"?(\w+)"?/i);
    expect(match).not.toBeNull();
    const referencedTable = match![1].toLowerCase();
    const validTargets = ["orders", "customers", "sessions", "order", "customer", "session"];
    expect(validTargets.some((t) => referencedTable.includes(t))).toBe(true);
  });
});

// ── Known purpose_code values ─────────────────────────────────────────────────

describe("consent_record migration – purpose_code enum/comment documentation", () => {
  it("migration source documents MARKETING as a valid purpose_code value", () => {
    expect(sql).toContain("MARKETING");
  });

  it("migration source documents PERSONALIZATION as a valid purpose_code value", () => {
    expect(sql).toContain("PERSONALIZATION");
  });

  it("migration source documents TERMS as a valid purpose_code value", () => {
    expect(sql).toContain("TERMS");
  });
});

// ── Known source_channel values ───────────────────────────────────────────────

describe("consent_record migration – source_channel enum/comment documentation", () => {
  it("migration source documents CHECKOUT as a valid source_channel value", () => {
    expect(sql).toContain("CHECKOUT");
  });

  it("migration source documents ONBOARDING as a valid source_channel value", () => {
    expect(sql).toContain("ONBOARDING");
  });
});
