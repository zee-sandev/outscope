#!/usr/bin/env node

import('../dist/index.js').catch((error) => {
  console.error('Error loading Horn CLI:', error)
  process.exit(1)
})
