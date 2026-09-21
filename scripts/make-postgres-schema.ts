// Derives prisma/schema.postgres.prisma from prisma/schema.prisma (the SQLite source
// of truth). The models are identical; only the datasource block differs. Run after
// any schema change: `npm run schema:pg`. Vercel builds against the Postgres file.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const src = join(process.cwd(), "prisma", "schema.prisma");
const out = join(process.cwd(), "prisma", "schema.postgres.prisma");

let s = readFileSync(src, "utf8");
s = s.replace(
  /datasource db \{[\s\S]*?\}/,
  `datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}`
);
s = `// GENERATED from schema.prisma by scripts/make-postgres-schema.ts — do not edit by hand.\n// Used for hosted deployments (Neon/Vercel): prisma generate --schema=prisma/schema.postgres.prisma\n` + s;
writeFileSync(out, s);
console.log(`wrote ${out}`);
