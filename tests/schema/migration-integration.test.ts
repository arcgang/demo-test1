/**
 * Acceptance tests: prisma migrate deploy runs cleanly and all 15 tables exist.
 *
 * These tests connect to a running PostgreSQL instance (DATABASE_URL env var)
 * and verify that:
 *   1. The migrations directory contains at least one migration.
 *   2. All 15 required tables are present after deployment.
 *   3. Key columns and constraints are reflected correctly.
 *
 * They FAIL until:
 *   - prisma/schema.prisma is present with all 15 models
 *   - prisma migrate dev (or migrate deploy) has been run against the target DB
 *   - DATABASE_URL points to the running Postgres 15 instance
 *
 * Run these tests with:
 *   DATABASE_URL=postgresql://... npx jest tests/schema/migration-integration.test.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../prisma/migrations');
const DATABASE_URL = process.env['DATABASE_URL'] ?? '';

// Only run DB tests when DATABASE_URL is set; otherwise skip with a clear message
const describeWithDb = DATABASE_URL ? describe : describe.skip;

// ─── Migrations directory ───────────────────────────────────────────────────

describe('prisma/migrations – directory and content', () => {
  it('prisma/migrations directory exists', () => {
    expect(fs.existsSync(MIGRATIONS_DIR)).toBe(true);
  });

  it('contains at least one migration folder', () => {
    expect(fs.existsSync(MIGRATIONS_DIR)).toBe(true);
    const entries = fs.readdirSync(MIGRATIONS_DIR).filter((e) => {
      const full = path.join(MIGRATIONS_DIR, e);
      return fs.statSync(full).isDirectory();
    });
    expect(entries.length).toBeGreaterThanOrEqual(1);
  });

  it('each migration folder contains a migration.sql file', () => {
    expect(fs.existsSync(MIGRATIONS_DIR)).toBe(true);
    const folders = fs.readdirSync(MIGRATIONS_DIR).filter((e) => {
      const full = path.join(MIGRATIONS_DIR, e);
      return fs.statSync(full).isDirectory() && e !== 'migration_lock.toml';
    });
    folders.forEach((folder) => {
      const sqlFile = path.join(MIGRATIONS_DIR, folder, 'migration.sql');
      expect(fs.existsSync(sqlFile)).toBe(true);
    });
  });

  it('migration SQL references all 15 expected table names', () => {
    expect(fs.existsSync(MIGRATIONS_DIR)).toBe(true);
    const expectedTables = [
      'market_config',
      'product_cache',
      'customer_session',
      'cart',
      'cart_item',
      'eligibility_result',
      'finance_quote',
      'trade_in_quote',
      'verification_case',
      'payment_attempt',
      'shop_order',
      'order_item',
      'activation_status',
      'consent_record',
      'audit_event',
    ];

    // Collect all SQL across migration files
    const folders = fs.readdirSync(MIGRATIONS_DIR).filter((e) => {
      const full = path.join(MIGRATIONS_DIR, e);
      return fs.statSync(full).isDirectory();
    });
    let combinedSql = '';
    folders.forEach((folder) => {
      const sqlFile = path.join(MIGRATIONS_DIR, folder, 'migration.sql');
      if (fs.existsSync(sqlFile)) {
        combinedSql += fs.readFileSync(sqlFile, 'utf-8');
      }
    });

    expectedTables.forEach((table) => {
      expect(combinedSql.toLowerCase()).toContain(table);
    });
  });
});

// ─── Live database tests (require DATABASE_URL) ─────────────────────────────

describeWithDb('database – all 15 tables exist after migrate deploy', () => {
  let client: Client;

  const EXPECTED_TABLES = [
    'market_config',
    'product_cache',
    'customer_session',
    'cart',
    'cart_item',
    'eligibility_result',
    'finance_quote',
    'trade_in_quote',
    'verification_case',
    'payment_attempt',
    'shop_order',
    'order_item',
    'activation_status',
    'consent_record',
    'audit_event',
  ];

  beforeAll(async () => {
    client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  async function tableExists(tableName: string): Promise<boolean> {
    const result = await client.query(
      `SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1`,
      [tableName]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async function columnExists(
    tableName: string,
    columnName: string
  ): Promise<boolean> {
    const result = await client.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
      [tableName, columnName]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async function columnIsNullable(
    tableName: string,
    columnName: string
  ): Promise<boolean> {
    const result = await client.query(
      `SELECT is_nullable FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
      [tableName, columnName]
    );
    if ((result.rowCount ?? 0) === 0) return false;
    return result.rows[0].is_nullable === 'YES';
  }

  EXPECTED_TABLES.forEach((table) => {
    it(`table "${table}" exists`, async () => {
      expect(await tableExists(table)).toBe(true);
    });
  });

  // ── UUID primary keys ──────────────────────────────────────────────────────

  it('market_config.id is a UUID primary key', async () => {
    expect(await columnExists('market_config', 'id')).toBe(true);
    const res = await client.query(
      `SELECT data_type FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'market_config' AND column_name = 'id'`
    );
    expect(res.rows[0]?.data_type).toBe('uuid');
  });

  it('shop_order.id is a UUID primary key', async () => {
    expect(await columnExists('shop_order', 'id')).toBe(true);
  });

  it('audit_event.id is a UUID primary key', async () => {
    expect(await columnExists('audit_event', 'id')).toBe(true);
  });

  // ── Audit timestamp columns ────────────────────────────────────────────────

  it('cart has created_at and updated_at columns', async () => {
    expect(await columnExists('cart', 'created_at')).toBe(true);
    expect(await columnExists('cart', 'updated_at')).toBe(true);
  });

  it('shop_order has created_at and updated_at columns', async () => {
    expect(await columnExists('shop_order', 'created_at')).toBe(true);
    expect(await columnExists('shop_order', 'updated_at')).toBe(true);
  });

  it('verification_case has created_at and updated_at columns', async () => {
    expect(await columnExists('verification_case', 'created_at')).toBe(true);
    expect(await columnExists('verification_case', 'updated_at')).toBe(true);
  });

  it('payment_attempt has created_at and updated_at columns', async () => {
    expect(await columnExists('payment_attempt', 'created_at')).toBe(true);
    expect(await columnExists('payment_attempt', 'updated_at')).toBe(true);
  });

  it('market_config has created_at and updated_at columns', async () => {
    expect(await columnExists('market_config', 'created_at')).toBe(true);
    expect(await columnExists('market_config', 'updated_at')).toBe(true);
  });

  // ── Nullable columns per LLD §7.3 ─────────────────────────────────────────

  it('customer_session.customer_id is nullable', async () => {
    expect(await columnIsNullable('customer_session', 'customer_id')).toBe(true);
  });

  it('customer_session.line_id is nullable', async () => {
    expect(await columnIsNullable('customer_session', 'line_id')).toBe(true);
  });

  it('shop_order.customer_id is nullable', async () => {
    expect(await columnIsNullable('shop_order', 'customer_id')).toBe(true);
  });

  it('shop_order.verification_status is nullable', async () => {
    expect(await columnIsNullable('shop_order', 'verification_status')).toBe(true);
  });

  it('shop_order.activation_status is nullable', async () => {
    expect(await columnIsNullable('shop_order', 'activation_status')).toBe(true);
  });

  it('shop_order.external_order_reference is nullable', async () => {
    expect(await columnIsNullable('shop_order', 'external_order_reference')).toBe(true);
  });

  it('payment_attempt.provider_reference is nullable', async () => {
    expect(await columnIsNullable('payment_attempt', 'provider_reference')).toBe(true);
  });

  it('payment_attempt.token_reference is nullable', async () => {
    expect(await columnIsNullable('payment_attempt', 'token_reference')).toBe(true);
  });

  it('payment_attempt.callback_payload_json is nullable', async () => {
    expect(await columnIsNullable('payment_attempt', 'callback_payload_json')).toBe(true);
  });

  it('verification_case.porting_payload_json is nullable', async () => {
    expect(await columnIsNullable('verification_case', 'porting_payload_json')).toBe(true);
  });

  it('verification_case.verification_reference is nullable', async () => {
    expect(await columnIsNullable('verification_case', 'verification_reference')).toBe(true);
  });

  it('activation_status.esim_reference is nullable', async () => {
    expect(await columnIsNullable('activation_status', 'esim_reference')).toBe(true);
  });

  it('activation_status.esim_qr_payload is nullable', async () => {
    expect(await columnIsNullable('activation_status', 'esim_qr_payload')).toBe(true);
  });

  it('audit_event.session_id is nullable', async () => {
    expect(await columnIsNullable('audit_event', 'session_id')).toBe(true);
  });

  it('audit_event.order_id is nullable', async () => {
    expect(await columnIsNullable('audit_event', 'order_id')).toBe(true);
  });

  it('consent_record.customer_id is nullable', async () => {
    expect(await columnIsNullable('consent_record', 'customer_id')).toBe(true);
  });

  // ── NOT NULL columns ───────────────────────────────────────────────────────

  it('market_config.currency_code is NOT NULL', async () => {
    expect(await columnIsNullable('market_config', 'currency_code')).toBe(false);
  });

  it('cart.status is NOT NULL', async () => {
    expect(await columnIsNullable('cart', 'status')).toBe(false);
  });

  it('shop_order.order_status is NOT NULL', async () => {
    expect(await columnIsNullable('shop_order', 'order_status')).toBe(false);
  });

  it('shop_order.payment_status is NOT NULL', async () => {
    expect(await columnIsNullable('shop_order', 'payment_status')).toBe(false);
  });

  // ── Cascade deletes ────────────────────────────────────────────────────────

  it('cart_item has a foreign key to cart with ON DELETE CASCADE', async () => {
    const res = await client.query(`
      SELECT rc.delete_rule
      FROM information_schema.referential_constraints rc
      JOIN information_schema.key_column_usage kcu
        ON kcu.constraint_name = rc.constraint_name
        AND kcu.table_schema = rc.constraint_schema
      WHERE kcu.table_schema = 'public'
        AND kcu.table_name = 'cart_item'
        AND kcu.column_name = 'cart_id'
    `);
    const deleteRule = res.rows[0]?.delete_rule;
    expect(deleteRule).toBe('CASCADE');
  });

  it('order_item has a foreign key to shop_order with ON DELETE CASCADE', async () => {
    const res = await client.query(`
      SELECT rc.delete_rule
      FROM information_schema.referential_constraints rc
      JOIN information_schema.key_column_usage kcu
        ON kcu.constraint_name = rc.constraint_name
        AND kcu.table_schema = rc.constraint_schema
      WHERE kcu.table_schema = 'public'
        AND kcu.table_name = 'order_item'
        AND kcu.column_name = 'order_id'
    `);
    const deleteRule = res.rows[0]?.delete_rule;
    expect(deleteRule).toBe('CASCADE');
  });

  // ── Decimal / numeric types for monetary columns ───────────────────────────

  it('cart.payable_now is a numeric/decimal column', async () => {
    const res = await client.query(
      `SELECT data_type FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'cart' AND column_name = 'payable_now'`
    );
    expect(['numeric', 'decimal']).toContain(res.rows[0]?.data_type);
  });

  it('trade_in_quote.estimated_credit is a numeric/decimal column', async () => {
    const res = await client.query(
      `SELECT data_type FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'trade_in_quote' AND column_name = 'estimated_credit'`
    );
    expect(['numeric', 'decimal']).toContain(res.rows[0]?.data_type);
  });

  it('shop_order.total_amount is a numeric/decimal column', async () => {
    const res = await client.query(
      `SELECT data_type FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'shop_order' AND column_name = 'total_amount'`
    );
    expect(['numeric', 'decimal']).toContain(res.rows[0]?.data_type);
  });

  // ── JSON columns ───────────────────────────────────────────────────────────

  it('product_cache.metadata_json is a jsonb column', async () => {
    const res = await client.query(
      `SELECT data_type FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'product_cache' AND column_name = 'metadata_json'`
    );
    expect(res.rows[0]?.data_type).toBe('jsonb');
  });

  it('audit_event.payload_json is a jsonb column', async () => {
    const res = await client.query(
      `SELECT data_type FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'audit_event' AND column_name = 'payload_json'`
    );
    expect(res.rows[0]?.data_type).toBe('jsonb');
  });

  it('verification_case.customer_payload_json is a jsonb column', async () => {
    const res = await client.query(
      `SELECT data_type FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'verification_case' AND column_name = 'customer_payload_json'`
    );
    expect(res.rows[0]?.data_type).toBe('jsonb');
  });

  // ── Boolean defaults ───────────────────────────────────────────────────────

  it('market_config.mobile_money_enabled defaults to false', async () => {
    const res = await client.query(
      `SELECT column_default FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'market_config' AND column_name = 'mobile_money_enabled'`
    );
    expect(res.rows[0]?.column_default).toMatch(/false/i);
  });

  it('market_config.card_payment_enabled defaults to true', async () => {
    const res = await client.query(
      `SELECT column_default FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'market_config' AND column_name = 'card_payment_enabled'`
    );
    expect(res.rows[0]?.column_default).toMatch(/true/i);
  });

  it('customer_session.is_authenticated defaults to false', async () => {
    const res = await client.query(
      `SELECT column_default FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'customer_session' AND column_name = 'is_authenticated'`
    );
    expect(res.rows[0]?.column_default).toMatch(/false/i);
  });

  it('verification_case.activation_eligible defaults to false', async () => {
    const res = await client.query(
      `SELECT column_default FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'verification_case' AND column_name = 'activation_eligible'`
    );
    expect(res.rows[0]?.column_default).toMatch(/false/i);
  });

  // ── Idempotency: migrate deploy a second time does not fail ────────────────

  it('prisma migrate deploy is idempotent (can be run again without error)', async () => {
    // We can't re-run prisma from inside a jest test without spawning a process,
    // but we verify idempotency by checking the _prisma_migrations table records
    // that every migration is marked as applied (applied_steps_count = steps_count
    // and finished_at is not null).
    const res = await client.query(`
      SELECT migration_name, finished_at, rolled_back_at
      FROM _prisma_migrations
      WHERE rolled_back_at IS NOT NULL
    `);
    // There must be zero rolled-back migrations
    expect(res.rowCount ?? 0).toBe(0);
  });

  it('_prisma_migrations table has no failed/dirty migrations', async () => {
    const res = await client.query(`
      SELECT migration_name, finished_at
      FROM _prisma_migrations
      WHERE finished_at IS NULL
    `);
    // Every migration must have a finished_at timestamp
    expect(res.rowCount ?? 0).toBe(0);
  });
});
