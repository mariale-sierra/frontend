// B3: transport security depends on the build variant (app.config.js).
import { readFileSync } from 'fs';
import { join } from 'path';
import { runInThisContext } from 'vm';
import appJson from '../app.json';

type ResolvedConfig = {
  plugins: unknown[];
  extra: { apiUrl?: string; eas?: { projectId?: string } };
};

// Loaded as plain Node, like Expo does — NOT through jest's babel transform, which inlines
// process.env.EXPO_PUBLIC_* from .env at compile time and would hide the env under test.
const CONFIG_PATH = join(__dirname, '..', 'app.config.js');
const configModule = { exports: {} as unknown };
runInThisContext(`(function (module, exports, process) {${readFileSync(CONFIG_PATH, 'utf8')}\n})`, {
  filename: CONFIG_PATH,
})(configModule, configModule.exports, process);
const resolveConfig = configModule.exports as (ctx: { config: object }) => ResolvedConfig;

const ENV_KEYS = ['APP_VARIANT', 'EAS_BUILD_PROFILE', 'EXPO_PUBLIC_API_URL'] as const;

function resolveWith(env: Partial<Record<(typeof ENV_KEYS)[number], string>>) {
  for (const key of ENV_KEYS) delete process.env[key];
  Object.assign(process.env, env);
  return resolveConfig({ config: appJson.expo });
}

function cleartext(config: ResolvedConfig) {
  const entry = config.plugins.find(
    (p): p is [string, { android: { usesCleartextTraffic: boolean } }] =>
      Array.isArray(p) && p[0] === 'expo-build-properties',
  );
  return entry?.[1].android.usesCleartextTraffic;
}

describe('app.config.js', () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it('lets development talk plain HTTP (LAN backend, dev client)', () => {
    const config = resolveWith({ EXPO_PUBLIC_API_URL: 'http://192.168.1.20:3000' });
    expect(config.extra.apiUrl).toBe('http://192.168.1.20:3000');
    expect(cleartext(config)).toBe(true);
  });

  it('keeps the dev fallback URL only for development', () => {
    expect(resolveWith({}).extra.apiUrl).toMatch(/^http:\/\//);
    expect(() => resolveWith({ APP_VARIANT: 'production' })).toThrow(/https:\/\//);
  });

  it.each(['preview', 'production'])('%s builds block cleartext traffic', (variant) => {
    const config = resolveWith({
      APP_VARIANT: variant,
      EXPO_PUBLIC_API_URL: 'https://api.havit.example',
    });
    expect(config.extra.apiUrl).toBe('https://api.havit.example');
    expect(cleartext(config)).toBe(false);
  });

  it.each(['preview', 'production'])('%s builds refuse an http:// API URL', (variant) => {
    expect(() =>
      resolveWith({ APP_VARIANT: variant, EXPO_PUBLIC_API_URL: 'http://20.63.84.1:3000' }),
    ).toThrow(/need an https:\/\/ API URL/);
  });

  it('uses the EAS build profile when APP_VARIANT is not set', () => {
    expect(() =>
      resolveWith({ EAS_BUILD_PROFILE: 'production', EXPO_PUBLIC_API_URL: 'http://x.test' }),
    ).toThrow(/"production" builds/);
  });

  it('declares expo-build-properties exactly once and keeps app.json plugins', () => {
    const config = resolveWith({});
    const names = config.plugins.map((p) => (Array.isArray(p) ? p[0] : p));
    expect(names.filter((n) => n === 'expo-build-properties')).toHaveLength(1);
    expect(names).toEqual(expect.arrayContaining(['expo-router', 'expo-notifications']));
    expect(config.extra.eas?.projectId).toBe(appJson.expo.extra.eas.projectId);
  });
});
