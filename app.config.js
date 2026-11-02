// Dynamic config layer on top of app.json. Expo merges the two: app.json supplies the
// static base config, and this function's return value is the final resolved config.
// It exists to (1) expose the API base URL as `extra.apiUrl`, overridable via the
// EXPO_PUBLIC_API_URL env var, and (2) make transport security depend on the build variant.
//
// B3 (sprint 10) — variants:
// - development (default: `expo start`, the `development` EAS profile): may talk plain HTTP,
//   so a dev client can reach a backend on the LAN (`npm run start:local`).
// - anything else (`preview`, `production` EAS profiles, or APP_VARIANT=production for a
//   local release build): HTTPS only. The APK is built with usesCleartextTraffic=false and
//   resolving the config FAILS if the API URL is not https://, instead of shipping an APK
//   that sends passwords and JWTs in clear text.
// eas.json sets APP_VARIANT per profile; EAS_BUILD_PROFILE is the fallback EAS itself sets.

const DEV_FALLBACK_API_URL = 'http://20.63.84.1:3000';

module.exports = ({ config }) => {
  const variant = process.env.APP_VARIANT ?? process.env.EAS_BUILD_PROFILE ?? 'development';
  const isDevelopment = variant === 'development';
  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL ?? (isDevelopment ? DEV_FALLBACK_API_URL : undefined);

  if (!isDevelopment && !apiUrl?.startsWith('https://')) {
    throw new Error(
      `[app.config] "${variant}" builds need an https:// API URL, got ${apiUrl ?? 'nothing'}. ` +
        'Set EXPO_PUBLIC_API_URL=https://<api-domain> for this EAS profile (eas.json "env" or ' +
        'EAS environment variables). See docs/sprint-10/B3-https-transporte.md.',
    );
  }

  // app.json keeps the static expo-build-properties options (SDK levels, iOS target);
  // only usesCleartextTraffic depends on the variant, so it's merged into that entry.
  const plugins = (config.plugins ?? []).filter(
    (p) => !(Array.isArray(p) && p[0] === 'expo-build-properties'),
  );
  const buildProperties =
    (config.plugins ?? []).find((p) => Array.isArray(p) && p[0] === 'expo-build-properties')?.[1] ??
    {};

  return {
    ...config,
    plugins: [
      ...plugins,
      [
        'expo-build-properties',
        {
          ...buildProperties,
          android: { ...buildProperties.android, usesCleartextTraffic: isDevelopment },
        },
      ],
    ],
    extra: {
      ...config.extra,
      apiUrl,
      // B3 push: Expo push tokens need the EAS project id. `eas init` writes it
      // into app.json (extra.eas.projectId); EAS_PROJECT_ID overrides it for
      // local builds without touching the committed config.
      eas: {
        ...config.extra?.eas,
        ...(process.env.EAS_PROJECT_ID ? { projectId: process.env.EAS_PROJECT_ID } : {}),
      },
    },
  };
};
