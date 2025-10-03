import { defineConfig } from 'prisma/generator-helper'

export default defineConfig({
  // Configuration Prisma 7-ready
  output: '../node_modules/.prisma/client',
  engineType: 'library',
})