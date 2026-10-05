// Dynamic config layer on top of app.json. Expo merges the two: app.json supplies the
// static base config, and this function's return value is the final resolved config.
// Only reason this file exists: expose the API base URL as `extra.apiUrl`, overridable via
// the EXPO_PUBLIC_API_URL env var, without hardcoding it inside services/api.ts.
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    // Keep the plain-HTTP default — the backend has no TLS certificate yet.
    // HTTPS is a pending infra dependency; switch this default once it's provisioned.
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://20.63.84.1:3000',
    // B3 push: Expo push tokens need the EAS project id. `eas init` writes it
    // into app.json (extra.eas.projectId); EAS_PROJECT_ID overrides it for
    // local builds without touching the committed config.
    eas: {
      ...config.extra?.eas,
      ...(process.env.EAS_PROJECT_ID ? { projectId: process.env.EAS_PROJECT_ID } : {}),
    },
  },
});
