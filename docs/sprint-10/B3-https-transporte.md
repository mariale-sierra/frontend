# B3 — HTTPS y seguridad del transporte: app móvil (Sprint 10)

Responsable: Ale Pérez · 2026-10-23. Documento principal (infraestructura, Postgres, pruebas completas y plan de transición): `backend/docs/sprint-10/B3-https-transporte.md`.

## 1. Resumen

La seguridad del transporte ahora depende de la variante de build. `development` puede usar HTTP (backend en la LAN con `npm run start:local`). `preview` y `production` salen con `usesCleartextTraffic=false`, y `app.config.js` **falla** si la URL del API no es `https://`, para no publicar por accidente un APK que mande contraseñas y JWT en claro.
**Criterio: PARCIAL.** Configuración verificada (config resuelta y `AndroidManifest.xml` generado).

> **Actualización 2026-10-27.** El dominio y la URL en EAS ya están (ver §4). El API responde por HTTPS con un certificado válido de Let's Encrypt que vence el 2027-01-24, y HTTP redirige con 308 (`backend/docs/sprint-10/evidencias-b3/verificacion-produccion-2026-10-27.txt`). Falta:
> - compilar y distribuir el APK `preview`/`production` con HTTPS (B8);
> - probarlo en un dispositivo;
> - después, cerrar el puerto 3000, que sigue abierto (`http://20.63.84.1:3000/health` → 200). Los APK viejos todavía lo usan.

## 2. Decisiones técnicas

- La variante sale de `APP_VARIANT` (definida por perfil en `eas.json`), con `EAS_BUILD_PROFILE` como respaldo; sin ninguna de las dos se asume `development` (`expo start`).
- `expo-build-properties` sigue en `app.json` con lo fijo (niveles de SDK, target de iOS), pero sin `usesCleartextTraffic`: `app.config.js` lo agrega a esa misma entrada según la variante.
- Una build de release sin URL https es un error y no un aviso: es la única forma de que no se cuele un APK inseguro.
- La URL HTTP de respaldo en `services/api.ts` solo aplica en `__DEV__`.
- `.env` apunta al dominio HTTPS desde que existe; el respaldo HTTP queda solo para desarrollo.

## 3. Archivos modificados

| Archivo | Cambio |
|---|---|
| `app.config.js` | Variante, `usesCleartextTraffic`, validación de `https://`. |
| `app.json` | Sin `usesCleartextTraffic: true` fijo y sin `extra.apiUrl` HTTP (siempre la sobrescribía `app.config.js`). |
| `eas.json` | `env.APP_VARIANT` por perfil. |
| `services/api.ts` | Respaldo HTTP solo en desarrollo. |
| `__tests__/appConfig.test.ts` (nuevo) | 9 pruebas. |
| `docs/ARCHITECTURE-GUIDE.md` | Sección de la URL base actualizada. |

## 4. Configuración

- **EAS:** `EXPO_PUBLIC_API_URL=https://havit-api.canadacentral.cloudapp.azure.com` en el bloque `env` de los perfiles `preview` y `production` de `eas.json`. Sin eso, `eas build --profile preview|production` falla con un mensaje que explica qué falta.
- Dominio activo (2026-10-26): etiqueta DNS `havit-api` en la IP pública de la VM, puertos 80/443 abiertos en el NSG y `API_DOMAIN` en el `.env` de `raiz` en la VM; certificado de Let's Encrypt emitido por Caddy. `.env` ya apunta a `https://havit-api.canadacentral.cloudapp.azure.com`.
- Desarrollo local: sin cambios (`npm run start:local` escribe una URL `http://<ip-lan>:3000` en `.env.local`).

## 5. Pruebas

| Comando | Resultado |
|---|---|
| `npx jest __tests__/appConfig.test.ts` | 8/8 |
| `npx jest` | 174/174 suites, 2078/2078 (`CommentsSheet` tuvo un timeout intermitente en una primera corrida; pasa aislado con y sin B3) |
| `npm run typecheck` | 0 errores |
| `npm run i18n:check` | OK |
| `npx expo config --type public` por variante | dev → `http`, cleartext `true`; preview/production con `http` → error; con `https` → cleartext `false` |
| `expo prebuild -p android` (copia temporal) | production: `android:usesCleartextTraffic="false"`; development: `"true"` (el manifiesto `debug` de React Native siempre lo permite para Metro y no entra en el APK release) |
| `grep -rn "http://"` | Solo respaldos de desarrollo, `scripts/dev-local.js`, README y pruebas |

Flujos críticos: login, registro, `GET /users/me` y `GET /challenges` se probaron por HTTPS contra el stack local (ver evidencia del backend). La subida de fotos usa URLs prefirmadas de R2 que ya son `https://` (`services/uploads/upload.service.ts`, `fetch` nativo) y no cambia. Falta probar en un dispositivo con el APK HTTPS.

## 6. Evidencia

`docs/sprint-10/evidencias-b3/expo-config.txt`, `docs/sprint-10/evidencias-b3/android-manifest.txt`.

## 7. Pendientes y riesgos

- **APK viejos (con B8):** siguen funcionando mientras el 3000 esté abierto. Plan: distribuir el APK HTTPS → avisar → ventana de migración → cerrar el 3000. Detalle en el documento principal, sección 7.

## 8. Rollback

`git revert` del commit de B3 en este repo (vuelven el cleartext y la URL HTTP). Solo si hace falta publicar con urgencia un APK contra HTTP.
