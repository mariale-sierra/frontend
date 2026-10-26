# B4 — Sesiones, tokens y autenticación (app)

Documento hermano y más corto. La referencia completa (diagrama del flujo, esquema de las tablas, orden de bloqueos, política de contraseñas, retiro de los tokens de 7 días, decisiones de producto, orden de despliegue y la matriz de hallazgos de la auditoría independiente) está en `backend/docs/sprint-10/B4-sesiones-tokens.md`.

## Qué cambió en la app

| Pieza | Cambio |
|---|---|
| `services/auth/token.service.ts` | Además del access token (15 min), guarda el **refresh token** en SecureStore (`secureStorage`; en web cae a AsyncStorage, como ya pasaba con el access token). Lleva la **época de sesión** (`getSessionEpoch`), que avanza en login/registro (`beginSession`) y en logout (`endSessionEpoch`). |
| `services/auth/sessionRefresh.ts` | `refreshSession(api, epoch)`: `POST /auth/refresh` con **single flight compartido solo dentro de la misma sesión**. Si la época cambió mientras esperaba (logout, u otra cuenta inició sesión), descarta la respuesta: no guarda tokens ni borra los de la sesión nueva, y rechaza con `SessionChangedError`. Si el backend responde 401/400 (token inválido, vencido, revocado o reusado) devuelve `null` y borra el refresh token. Si falla por red, timeout, 429 o 5xx, rechaza con ese error y la sesión se conserva. |
| `services/api.ts` | Sigue siendo **el único cliente Axios**. Cada petición lleva la época con la que salió (`sessionEpoch`). Ante un 401 de una petición con token, renueva y **reintenta una sola vez** (`retriedAfterRefresh`). Si la petición es de **otra sesión**, la descarta sin refresh, sin cerrar la sesión actual, sin aviso y **sin reintentarla con el token de la cuenta nueva**. Si el refresh falla de forma transitoria, rechaza con **el error del refresh**, no con el 401, para que nadie lo lea como "sesión cerrada". La bandera `authRefresh` (login, registro, refresh y logout) nunca manda Bearer, y su error no se reintenta, no cierra sesión ni muestra aviso. |
| `services/auth/auth.service.ts` | Login y registro abren la sesión con `beginSession` y van sin Bearer. `logout()` invalida primero la época (un refresh en curso ya no puede guardar nada), llama a `POST /auth/logout` (5 s como máximo, sin aviso) y **no borra una sesión que se haya iniciado mientras esperaba**. `logout({ revokeOnServer: false })` se usa cuando la sesión ya terminó en el servidor. |
| `context/authContext.tsx` | Al restaurar la sesión, solo cierra sesión si `/auth/me` termina en 401 **y** la sesión sigue siendo la misma. Un fallo transitorio del refresh deja la sesión guardada, y la siguiente petición vuelve a intentar renovarla. |
| `validation/authSchemas.ts` | Registro: mínimo **10 caracteres** (contados en code points: `🔥🍕🎉🚀🌙` son 5), máximo 72 bytes, sin secuencias ni repeticiones triviales (las mismas reglas que el backend) y sin contener el username ni la parte local del email. Un mensaje a la vez, en el orden del backend. La **lista de contraseñas comunes solo vive en el servidor**. El login no aplica la política. |
| `utils/apiError.ts` | Mapea `Email or username already in use` → `accountTaken` y los cuatro mensajes de contraseña → `passwordTooShort/TooLong/ContainsIdentity/TooCommon`, también dentro de la lista del ValidationPipe. Se conservan `emailInUse` y `usernameInUse` para un backend sin B4. |
| `app/(auth)/register.tsx` | Cambio mínimo (B10 refactoriza este archivo): `REGISTER_FIELD_ERRORS` lleva cada rechazo a su paso. El 409 único vuelve al email y **marca email y username**. |
| `i18n/resources/en.ts`, `es.ts` | `common.errors.known.accountTaken` y los cuatro `password*`, en los dos idiomas. |

### Cómo se distinguen los fallos del refresh

| Respuesta a `POST /auth/refresh` | Qué pasa |
|---|---|
| 200 | Se guardan los tokens nuevos (solo si la sesión es la misma) y se reintenta la petición una vez |
| 401 (inválido, vencido, revocado o reusado; el backend responde lo mismo en todos los casos) o 400 | Fin de la sesión: se borra el refresh token y se cierra sesión con el aviso de sesión expirada |
| Sin red, timeout, 429, 5xx | **La sesión se conserva** (tokens intactos). La petición falla con ese error y su aviso; la siguiente petición vuelve a intentar renovar. Vale al arrancar la app y durante el uso normal |
| La sesión cambió mientras tanto (logout, u otra cuenta) | Se descarta en silencio: no guarda, no borra, no reintenta, no cierra la sesión nueva |

Compatibilidad: con un backend sin B4 la app funciona como antes. Sin `refreshToken` guarda solo el access token y, al vencer (7 días), cierra sesión. Un `/auth/logout` 404 se ignora.

## Pruebas (resultados reales, 2026-10-23, tras las correcciones)

| Comando | Resultado |
|---|---|
| Línea base tras `npm ci` (el `node_modules` local estaba desactualizado) | 176 suites, 2087 pass |
| `npx jest --ci` | **178 suites, 2138 pass**, 0 fallos, 5 omitidas (la integración opcional sin `HAVIT_B4_API_URL`) |
| `npx tsc --noEmit` | ok |
| `npm run i18n:check` | ok, las mismas claves en en/es |
| `HAVIT_B4_API_URL=http://localhost:3999 npx jest sessionRefresh.integration` | **5/5** contra el backend B4 corregido, compilado y corriendo en local sobre la base desechable `havit_b4_test` (nunca Azure) |

- `services/auth/__tests__/sessionRefresh.test.ts` usa el `token.service` real sobre almacenamiento en memoria, el cliente real y un adaptador HTTP que **retiene respuestas y las libera en el orden que fija la prueba**. Cubre:
  - renovación y reintento único; single flight;
  - reintento sin un segundo refresh dentro de la misma sesión;
  - refresh rechazado → cierre de sesión; reintento que vuelve a dar 401 → cierre, sin bucle;
  - red, timeout, 429 y 503 → sesión conservada y renovación al volver;
  - token de 7 días → cierre de sesión sin llamar al refresh;
  - login y registro sin Bearer;
  - logout con y sin red.

  Y, sobre respuestas que llegan después de cambiar la sesión:
  - un refresh que responde tras el logout no restaura tokens;
  - **A → logout → B**: el refresh tardío de A no pisa a B ni reintenta la petición de A con el token de B;
  - el 401 tardío de una petición de A no dispara refresh, reintento ni cierre de B;
  - el 401 tardío del refresh de A no borra el refresh token de B;
  - B no se une al refresh en curso de A;
  - un logout que aún está borrando no elimina una sesión iniciada mientras tanto.
- `context/__tests__/authRestoreSession.test.tsx`: arranque en frío con la pila real de auth, `/auth/me` en 401 y el refresh fallando sin red, con 429 o con 503 → la sesión y los tokens se conservan; refresh correcto → sesión renovada; refresh en 401 → cierre de sesión y tokens borrados. **Se comprobó que falla con el comportamiento anterior** (rechazar con el 401).
- `sessionRefresh.integration.test.ts` (opcional, contra un backend real): el registro guarda los dos tokens; un access token inválido se renueva solo; tres peticiones comparten un refresh; tras el logout no vale ningún token; un refresh reusado mata la sesión y la app cierra sesión; el 400 de contraseña común y el 409 único se traducen.
- `validation/__tests__/schemas.test.ts` y `utils/__tests__/apiError.test.ts`: la política (incluidas las secuencias que encontró la auditoría y la longitud Unicode) y el mapeo de mensajes.

No se probó en un dispositivo físico ni en un APK (B8).

## Pendiente fuera de B4

- **B3:** la rama `feature/sprint10-b3-https` toca las líneas de la URL base de `services/api.ts`; B4 cambia los interceptores. La fusión debería ser limpia, pero hay que revisarla.
- **B8:** publicar la APK con B4 justo después de desplegar el backend B4.
- **B10:** conservar `REGISTER_FIELD_ERRORS` al refactorizar `register.tsx`.
- `app/(auth)/recover-password.tsx` sigue siendo un placeholder: no hay recuperación ni cambio de contraseña en el backend.
