import { defineConfig } from "drizzle-kit";
import { z } from "zod";

const { DATABASE_URL } = z.object({ DATABASE_URL: z.string().url() }).parse(process.env);

export default defineConfig({
  schema: "./schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: { url: DATABASE_URL },
  // Verbose diff output when generating migrations
  verbose: true,
  strict: true,
});
