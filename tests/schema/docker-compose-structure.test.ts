/**
 * Acceptance tests: docker-compose.yml exists and is correctly configured
 * to run a local PostgreSQL 15 instance for migrations.
 *
 * These tests parse the docker-compose.yml file. They FAIL until
 * docker-compose.yml is created with the required service and settings.
 */

import * as fs from 'fs';
import * as path from 'path';

const COMPOSE_PATH = path.resolve(__dirname, '../../docker-compose.yml');

// Minimal YAML key-value extractor (no external YAML dependency required)
function readCompose(): string {
  if (!fs.existsSync(COMPOSE_PATH)) {
    throw new Error(`docker-compose.yml not found at ${COMPOSE_PATH}`);
  }
  return fs.readFileSync(COMPOSE_PATH, 'utf-8');
}

describe('docker-compose.yml – file presence and top-level structure', () => {
  it('docker-compose.yml exists at repo root', () => {
    expect(fs.existsSync(COMPOSE_PATH)).toBe(true);
  });

  it('specifies a services block', () => {
    const content = readCompose();
    expect(content).toMatch(/^services:/m);
  });
});

describe('docker-compose.yml – PostgreSQL 15 service', () => {
  it('defines a service that uses a postgres:15 image', () => {
    const content = readCompose();
    // Accept postgres:15, postgres:15.x, or postgres:15-alpine variants
    expect(content).toMatch(/image:\s*postgres:15/);
  });

  it('exposes port 5432', () => {
    const content = readCompose();
    expect(content).toMatch(/5432/);
  });

  it('sets POSTGRES_PASSWORD environment variable', () => {
    const content = readCompose();
    expect(content).toMatch(/POSTGRES_PASSWORD/);
  });

  it('sets POSTGRES_USER environment variable', () => {
    const content = readCompose();
    expect(content).toMatch(/POSTGRES_USER/);
  });

  it('sets POSTGRES_DB environment variable', () => {
    const content = readCompose();
    expect(content).toMatch(/POSTGRES_DB/);
  });

  it('defines a named volume or bind-mount for data persistence', () => {
    const content = readCompose();
    // Either a volumes: section at the service level or a bind mount
    expect(content).toMatch(/volumes:/);
  });
});

describe('docker-compose.yml – healthcheck configuration', () => {
  it('includes a healthcheck using pg_isready', () => {
    const content = readCompose();
    expect(content).toMatch(/pg_isready/);
  });
});
