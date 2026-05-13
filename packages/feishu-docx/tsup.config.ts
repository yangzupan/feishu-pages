import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: {
    resolve: true,
    compilerOptions: {
      skipLibCheck: true,
      ignoreDeprecations: '6.0',
    },
  },
  sourcemap: true,
  clean: true,
  outDir: 'dist',
})
