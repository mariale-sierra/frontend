#!/usr/bin/env node
// Counterpart to dev-local.js: makes sure nothing overrides the public API
// URL committed in `.env` (EXPO_PUBLIC_API_URL -> the Azure server). A
// previous `npm run start:local` leaves a `.env.local` behind with a LAN IP
// in it, and Expo's env loading applies `.env.local` on top of `.env`
// forever after that, regardless of which script you run next. Removing it
// here — run automatically before every non-local start script (`start`,
// `start:server`, `android`, `ios`, `web`) — guarantees those always hit the
// public server no matter what `start:local` left lying around.
// `.env.local` is gitignored/per-machine (see dev-local.js), so deleting it
// loses nothing: `start:local` regenerates it from scratch every time.

const fs = require('fs');
const path = require('path');

const ENV_LOCAL_PATH = path.join(__dirname, '..', '.env.local');

if (fs.existsSync(ENV_LOCAL_PATH)) {
  fs.unlinkSync(ENV_LOCAL_PATH);
  console.log('[dev-server] Removed leftover .env.local — using the public API URL from .env.');
} else {
  console.log('[dev-server] Using the public API URL from .env.');
}
