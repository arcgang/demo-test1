/**
 * Acceptance tests: consent_record database migration
 *
 * These tests MUST FAIL until the migration is implemented at
 * @/lib/db/migrations/001_create_consent_record
 *
 * Acceptance criteria (from task spec):
 *   - migration runs cleanly (up/down exported)
 *   - table: consent_record
 *   - columns: id (PK), purpose_code (varchar, NOT NULL), granted (boolean),
 *              source_channel (varchar, NOT NULL), recorded_at (timestamptz)
 *   - foreign key to orders or session/customer
 *   - purpose_code and source_channel are NOT NULL
 */

import { up, down } from "@/lib/db/migrations/001_create_consent_record";

// ── Module contract ───────────────────────────────────────────────────────────

describe("consent_record migration – module contract", () => {
  it("exports a non-empty up string", () => {
    expect(typeof up).toBe("string");
    expect(up.trim().length).toBeGreaterThan(0);
  });

  it("exports a non-empty down string", () => {
    expect(typeof down).toBe("string");
    expect(down.trim().length).toBeGreaterThan(0);
  });

  it("up SQL creates the consent_record table", () => {
    expect(up.toUpperCase()).toMatch(/CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?consent_record/i);
  });

  it("down SQL drops the consent_record table", () => {
    expect(down.toUpperCase()).toMatch(/DROP\s+TABLE\s+(IF\s+EXISTS\s+)?consent_record/i);
  });
});

// ── Column presence ───────────────────────────────────────────────────────────

describe("consent_record migration – column definitions", () => {
  it("defines an id column", () => {
    expect(up).toMatch(/\bid\b/i);
  });

  it("defines a purpose_code column", () => {
    expect(up).toMatch(/\bpurpose_code\b/i);
  });

  it("defines a granted column", () => {
    expect(up).toMatch(/\bgranted\b/i);
  });

  it("defines a source_channel column", () => {
    expect(up).toMatch(/\bsource_channel\b/i);
  });

  it("defines a recorded_at column", () => {
    expect(up).toMatch(/\brecorded_at\b/i);
  });
});

// ── Primary key ───────────────────────────────────────────────────────────────

describe("consent_record migration – primary key", () => {
  it("id is declared as the primary key", () => {
    // Matches both inline "id ... PRIMARY KEY" and table-level "PRIMARY KEY (id)"
    const hasPrimaryKey =
      /\bid\b[^,)]*PRIMARY\s+KEY/i.test(up) ||
      /PRIMARY\s+KEY\s*\(\s*id\s*\)/i.test(up);
    expect(hasPrimaryKey).toBe(true);
  });
});

// ── NOT NULL constraints ──────────────────────────────────────────────────────

describe("consent_record migration – NOT NULL constraints", () => {
  it("purpose_code column is NOT NULL", () => {
    // Extract the purpose_code line/definition and check for NOT NULL
    const purposeLineMatch = up.match(/purpose_code[^\n,)]+/i);
    expect(purposeLineMatch).not.toBeNull();
    expect(purposeLineMatch![0].toUpperCase()).toContain("NOT NULL");
  });

  it("source_channel column is NOT NULL", () => {
    const sourceLineMatch = up.match(/source_channel[^\n,)]+/i);
    expect(sourceLineMatch).not.toBeNull();
    expect(sourceLineMatch![0].toUpperCase()).toContain("NOT NULL");
  });
});

// ── Data types ────────────────────────────────────────────────────────────────

describe("consent_record migration – column data types", () => {
  it("purpose_code uses a VARCHAR or TEXT type", () => {
    const purposeLineMatch = up.match(/purpose_code[^\n,)]+/i);
    expect(purposeLineMatch).not.toBeNull();
    const line = purposeLineMatch![0].toUpperCase();
    const hasVarcharOrText = /VARCHAR|TEXT/.test(line);
    expect(hasVarcharOrText).toBe(true);
  });

  it("source_channel uses a VARCHAR or TEXT type", () => {
    const sourceLineMatch = up.match(/source_channel[^\n,)]+/i);
    expect(sourceLineMatch).not.toBeNull();
    const line = sourceLineMatch![0].toUpperCase();
    const hasVarcharOrText = /VARCHAR|TEXT/.test(line);
    expect(hasVarcharOrText).toBe(true);
  });

  it("granted uses a BOOLEAN type", () => {
    const grantedLineMatch = up.match(/granted[^\n,)]+/i);
    expect(grantedLineMatch).not.toBeNull();
    const line = grantedLineMatch![0].toUpperCase();
    expect(line).toContain("BOOLEAN");
  });

  it("recorded_at uses a TIMESTAMPTZ or TIMESTAMP WITH TIME ZONE type", () => {
    const recordedAtLineMatch = up.match(/recorded_at[^\n,)]+/i);
    expect(recordedAtLineMatch).not.toBeNull();
    const line = recordedAtLineMatch![0].toUpperCase();
    const hasTimestamptz =
      /TIMESTAMPTZ/.test(line) || /TIMESTAMP\s+WITH\s+TIME\s+ZONE/.test(line);
    expect(hasTimestamptz).toBe(true);
  });
});

// ── Foreign key ───────────────────────────────────────────────────────────────

describe("consent_record migration – foreign key constraint", () => {
  it("up SQL contains a REFERENCES clause (foreign key to another table)", () => {
    expect(up.toUpperCase()).toMatch(/REFERENCES\s+\w+/);
  });

  it("foreign key references an orders, customer, or session table", () => {
    const fkMatch = up.match(/REFERENCES\s+(\w+)/i);
    expect(fkMatch).not.toBeNull();
    const referencedTable = fkMatch![1].toLowerCase();
    const validTargets = ["orders", "customers", "sessions", "order", "customer", "session"];
    const isValidTarget = validTargets.some((t) => referencedTable.includes(t));
    expect(isValidTarget).toBe(true);
  });
});

// ── Known purpose_code values ─────────────────────────────────────────────────

describe("consent_record migration – purpose_code enum/comment documentation", () => {
  it("migration source documents MARKETING as a valid purpose_code value", () => {
    expect(up).toContain("MARKETING");
  });

  it("migration source documents PERSONALIZATION as a valid purpose_code value", () => {
    expect(up).toContain("PERSONALIZATION");
  });

  it("migration source documents TERMS as a valid purpose_code value", () => {
    expect(up).toContain("TERMS");
  });
});

// ── Known source_channel values ───────────────────────────────────────────────

describe("consent_record migration – source_channel enum/comment documentation", () => {
  it("migration source documents CHECKOUT as a valid source_channel value", () => {
    expect(up).toContain("CHECKOUT");
  });

  it("migration source documents ONBOARDING as a valid source_channel value", () => {
    expect(up).toContain("ONBOARDING");
  });
});

// ── TypeScript type contract ──────────────────────────────────────────────────

describe("consent_record migration – TypeScript type contract", () => {
  it("up and down are plain strings (not functions or objects)", () => {
    expect(typeof up).toBe("string");
    expect(typeof down).toBe("string");
  });

  it("up SQL is valid enough to not be a single-word stub", () => {
    // Must have at least a table definition token and a paren
    expect(up).toMatch(/\(/);
    expect(up).toMatch(/\)/);
  });
});
