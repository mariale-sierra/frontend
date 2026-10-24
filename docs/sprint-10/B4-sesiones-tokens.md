# B4 — Sesiones, tokens y autenticación (app)

Documento hermano y más corto. La referencia completa (diagrama del flujo, esquema de la tabla, política de contraseñas, retiro de los tokens de 7 días, decisiones de producto y orden de despliegue) está en `backend/docs/sprint-10/B4-sesiones-tokens.md`.

## Qué cambió en la app

| Pieza | Cambio |
|---|---|
| `services/auth/token.service.ts` | Además del access token (15 min), guarda el **refresh token** en SecureStore (`secureStorage`; en web cae a AsyncStorage, como ya pasaba con el access token). `setSessionTokens(access, refresh?)`, `getRefreshToken`, `clearRefreshToken`. |
| `services/auth/sessionRefresh.ts` | `refreshSession(api)`: `POST /auth/refresh` con **single flight** (las peticiones que fallan juntas esperan un solo refresh). Devuelve el access token nuevo; `null` si la sesión terminó (no hay refresh token, o el backend respondió 401/400); lanza el error si no hubo red, para que no se cierre la sesión. |
| `services/api.ts` | Sigue siendo **el único cliente Axios**. Ante un 401 de una petición que llevaba token (y sin `skipSessionExpiredLogout`), primero renueva y **reintenta una sola vez** (`retriedAfterRefresh`). Si otra petición ya renovó, reintenta con ese token sin pedir otro refresh. Si el refresh es rechazado, cierra sesión (`notifySessionExpired`) con el aviso de sesión expirada; si no hay red, conserva la sesión y muestra el aviso de red. La bandera `authRefresh` (refresh y logout) no manda bearer y su error no se reintenta, no cierra sesión ni muestra aviso: así un refresh fallido nunca dispara otro. |
| `services/auth/auth.service.ts` | Login y registro guardan los dos tokens. `logout()` llama a `POST /auth/logout` (tiempo límite de 5 s, sin aviso de error) antes de borrar la sesión local. `logout({ revokeOnServer: false })` se usa cuando la sesión ya terminó en el servidor (expirada o revocada). |
| `context/authContext.tsx` | El cierre por sesión expirada y el 401 de `/auth/me` al restaurar usan `revokeOnServer: false`. |
| `validation/authSchemas.ts` | Registro: mínimo **10** caracteres, máximo 72 bytes, y que la contraseña no contenga el username ni la parte local del email (también con leetspeak). La **lista de contraseñas comunes solo vive en el servidor**. El login no aplica la política: las cuentas viejas de 8 caracteres siguen entrando. |
| `utils/apiError.ts` | Mapea `Email or username already in use` → `accountTaken` y los cuatro mensajes de contraseña → `passwordTooShort/TooLong/ContainsIdentity/TooCommon`, también cuando llegan dentro de la lista del ValidationPipe. Se conservan `emailInUse`/`usernameInUse` para un backend todavía sin B4. |
| `app/(auth)/register.tsx` | Cambio mínimo (B10 refactoriza este archivo). `REGISTER_FIELD_ERRORS` lleva cada rechazo a su paso: el 409 único vuelve al paso del email y **marca email y username**; los de contraseña, al paso de contraseña. |
| `i18n/resources/en.ts`, `es.ts` | `common.errors.known.accountTaken` y los cuatro `password*`, en los dos idiomas. |

Compatibilidad: con un backend sin B4 la app funciona como antes. Sin `refreshToken` en la respuesta, guarda solo el access token, y cuando vence (7 días) cierra sesión. Un `/auth/logout` 404 se ignora. Un usuario con un token de 7 días guardado y sin refresh token cierra sesión al primer 401, sin intentar renovar.

## Pruebas (resultados reales, 2026-10-23)

| Comando | Resultado |
|---|---|
| Línea base tras `npm ci` (el `node_modules` local estaba desactualizado: faltaban `zod`, `expo-notifications`…) | 176 suites, 2087 pass |
| `npx jest --ci` (con B4) | **177 suites, 2110 pass**, 0 fallos (la integración opcional queda omitida sin `HAVIT_B4_API_URL`) |
| `npx tsc --noEmit` | ok |
| `npm run i18n:check` | ok, mismas claves en en/es |
| `HAVIT_B4_API_URL=http://localhost:3999 npx jest sessionRefresh.integration` | **5/5** contra el backend B4 compilado, corriendo en local sobre la base desechable `havit_b4_test` (nunca Azure) |

- `services/auth/__tests__/sessionRefresh.test.ts` (12 pruebas, adaptador HTTP falso bajo el cliente real): renovación y reintento con el token nuevo; la llamada de refresh sin bearer; rotación guardada; **tres 401 a la vez → un solo refresh**; reintento sin refresh si otro ya renovó; refresh rechazado → cierre de sesión sin reintentar; **un único reintento, sin bucle**; sin red → se conserva la sesión; token de 7 días sin refresh → cierre de sesión sin llamar al refresh; endpoints de contraseña (`skipSessionExpiredLogout`) y login no se tocan; logout revoca en el servidor y borra local incluso sin red.
- `sessionRefresh.integration.test.ts` (opcional, contra un backend real): el registro guarda los dos tokens; un access token inválido se renueva solo; tres peticiones comparten un refresh; tras el logout ni el access token ni el refresh token valen en el servidor; **un refresh reusado mata la sesión y la app cierra sesión**; el 400 de contraseña común y el 409 único se traducen. Crea 3 cuentas, porque el backend permite 5 registros por IP cada 10 minutos.
- `validation/__tests__/schemas.test.ts` y `utils/__tests__/apiError.test.ts`: la política, la identidad, los 72 bytes y el mapeo de mensajes.

No se probó en un dispositivo físico ni en un APK (B8).

## Pendiente fuera de B4

- **B3:** la rama `feature/sprint10-b3-https` toca las líneas de la URL base de `services/api.ts`. B4 cambia los interceptores del mismo archivo, así que la fusión debería ser limpia, pero hay que revisarla al integrarla.
- **B8:** publicar la APK con B4 justo después de desplegar el backend B4. Mientras tanto, un login desde una APK vieja dura 15 minutos.
- **B10:** conservar `REGISTER_FIELD_ERRORS` al refactorizar `register.tsx`.
- `app/(auth)/recover-password.tsx` sigue siendo un placeholder: no existe recuperación ni cambio de contraseña en el backend.
