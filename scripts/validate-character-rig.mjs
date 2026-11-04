#!/usr/bin/env node
// Shared validator: this adapter only selects the existing Nextra preview URL.
process.env.RIG_URL ??= 'http://127.0.0.1:3017/rig-test.html';
process.env.RIG_OUTPUT ??= 'output/rig-validation';
await import('../skills/character-rig-lab/scripts/validate-browser.mjs');

