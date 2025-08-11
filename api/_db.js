'use strict';

const { Pool } = require('pg');

// Prefer pooled URL for Vercel/Supabase; fallback to non-pooled
const connectionString = process.env.POSTGRES_PRISMA_URL
  || process.env.POSTGRES_URL
  || process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  console.warn('[DB] No Postgres connection string found in env');
}

// Supabase requires SSL. Some environments need an explicit CA chain.
// Use relaxed SSL by default; allow override via env.
const ssl = process.env.PGSSL_DISABLE === '1' ? false : { rejectUnauthorized: false };

const pool = connectionString
  ? new Pool({ connectionString, ssl })
  : null;

async function migrate() {
  if (!pool) return;
  await pool.query(`
    create table if not exists public.works (
      id bigint primary key,
      title text,
      description text,
      image_url text,
      status text,
      submitted_at timestamptz,
      added_by text,
      image_source text,
      views integer default 0
    );
    create index if not exists idx_works_submitted_at on public.works (submitted_at desc);
  `);
}

async function query(text, params) {
  if (!pool) throw new Error('Database not configured');
  return pool.query(text, params);
}

module.exports = { query, migrate };

