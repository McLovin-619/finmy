import { createEnv } from "@finmy/lib";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { z } from "zod";
import * as schema from "./schema";

// @neondatabase/serverless requires a WebSocket constructor in non-browser runtimes
neonConfig.webSocketConstructor = ws;

const env = createEnv(
  z.object({ DATABASE_URL: z.string().url("must be a valid Neon connection string") }),
  "db",
);

const pool = new Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle(pool, { schema });

export type Database = typeof db;
