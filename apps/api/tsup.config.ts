import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts', 'src/vercel.ts', 'scripts/migrate.ts', 'scripts/seed.ts'],
  format: 'esm',
  target: 'node20',
  clean: true,
  // The shared contracts package ships TypeScript source, so bundle it in.
  noExternal: ['@platform/contracts'],
});
