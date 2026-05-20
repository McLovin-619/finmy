import { type ZodObject, type ZodRawShape, z } from "zod";

/**
 * Parse and validate environment variables at startup.
 * Logs every failing field and throws — never continues with a broken config.
 * Server-side only; mobile reads EXPO_PUBLIC_* vars directly at build time.
 */
export function createEnv<T extends ZodRawShape>(
  schema: ZodObject<T>,
  context: string,
): z.infer<ZodObject<T>> {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`);
    const message = `[${context}] Missing or invalid environment variables:\n${lines.join("\n")}`;
    console.error(message);
    throw new Error(message);
  }
  return result.data;
}
