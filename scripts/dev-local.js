#!/usr/bin/env node
// Detects this machine's LAN IPv4 address and writes it to `.env.local` as
// EXPO_PUBLIC_API_URL, so Expo running on a physical phone (same WiFi) can
// reach a backend running locally (see raiz/README.md) without anyone
// editing an IP by hand. `.env` (the Azure URL) is left untouched — Expo's
// built-in env loading applies `.env.local` on top of it, and `.env.local`
// is already gitignored (`.env*.local`), so this is per-machine only.
// Re-run any time the IP changes (e.g. a new WiFi network) — `start:local`
// does this automatically before every `expo start`.

const os = require('os');
const fs = require('fs');
const path = require('path');

const BACKEND_PORT = 3000;
const ENV_LOCAL_PATH = path.join(__dirname, '..', '.env.local');
const IGNORED_INTERFACE = /virtual|vethernet|vpn|tailscale|docker|utun|awdl|llw|bridge/i;
const PREFERRED_INTERFACE = /^(en|eth|wlan|wi-?fi)/i;

function findLanIPv4() {
  const interfaces = os.networkInterfaces();
  const candidates = [];
  for (const [name, addrs] of Object.entries(interfaces)) {
    if (IGNORED_INTERFACE.test(name)) continue;
    for (const addr of addrs ?? []) {
      if (addr.family === 'IPv4' && !addr.internal) {
        candidates.push({ name, address: addr.address });
      }
    }
  }
  const preferred = candidates.find((c) => PREFERRED_INTERFACE.test(c.name));
  return (preferred ?? candidates[0])?.address;
}

const ip = findLanIPv4();
if (!ip) {
  console.error(
    '[dev-local] No LAN IPv4 address found. Connect to WiFi/Ethernet, then rerun, ' +
      'or set EXPO_PUBLIC_API_URL manually in .env.local.',
  );
  process.exit(1);
}

const apiUrl = `http://${ip}:${BACKEND_PORT}`;
fs.writeFileSync(ENV_LOCAL_PATH, `EXPO_PUBLIC_API_URL=${apiUrl}\n`);
console.log(`[dev-local] EXPO_PUBLIC_API_URL -> ${apiUrl} (written to .env.local)`);
console.log('[dev-local] Make sure the backend is running locally (raiz: npm run dev:local) and reachable on this WiFi network.');
