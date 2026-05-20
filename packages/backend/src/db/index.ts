import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// ─── Env guard ────────────────────────────────────────────────────────────────
// Checked here so the DB module itself fails fast with a clear message rather
// than surfacing an obscure Neon connection error at the first query.

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("[db] DATABASE_URL is not set — add it to packages/backend/.env and restart.");
}

// ─── Client ───────────────────────────────────────────────────────────────────
// neon() returns an HTTP-based query function. drizzle wraps it with the full
// ORM query builder, including transaction() support via Neon's batch HTTP API.

const sql = neon(databaseUrl);

export const db = drizzle(sql, { schema });

export type Database = typeof db;
