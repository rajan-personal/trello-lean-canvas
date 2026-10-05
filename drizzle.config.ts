import { defineConfig } from 'drizzle-kit'
// Auth schema inspection only; release migrations are reviewed SQL in server/db/migrations.
export default defineConfig({schema:'./server/db/auth-schema.ts',out:'./.drizzle-auth-review',dialect:'postgresql'})

