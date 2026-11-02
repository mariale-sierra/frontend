# Sprint 10 · B10 — Limpieza, tipado y cobertura frontend (alcance pendiente)

Responsable: Emily Góngora · Deadline original: 24/10 · Estimación original: 5 SP · Ejecución: 26/10.
Repositorio: `frontend/`, rama `development` (base `930ca59`, sincronizada con `origin/development`).

Este documento complementa [`B10-refactorizacion-cobertura.md`](B10-refactorizacion-cobertura.md) (primera entrega de B10, PR #17, fusionado el 23/10). No lo reemplaza.

## 1. Alcance

**Realizado:** limpieza de código sin uso y de un log sensible, reducción de `any` en archivos no protegidos, pruebas de comportamiento para todo lo que se tocó, y tres mediciones de cobertura comparables (más una cuarta de control).

**Excluido explícitamente: la refactorización de pantallas.** No se extrajeron componentes ni hooks de pantallas, no se dividieron archivos grandes y no se reorganizó la arquitectura. **Ningún archivo de `app/` se modificó** en esta entrega.

### Líneas antes/después por pantalla refactorizada

**No aplica: no se refactorizaron pantallas.** Tampoco hubo ajustes mínimos en pantallas (ver §9).

## 2. Preparación del repositorio y línea base

| Paso | Resultado |
|---|---|
| Rama al empezar | `feature/sprint10-b2-b10`, limpia, con su remota ya borrada. |
| Verificación | `git log origin/development..feature/sprint10-b2-b10` vacío y PR #17 en estado `MERGED` (23/10): la rama estaba fusionada por completo. |
| Limpieza | `git switch development`, `git merge --ff-only origin/development` (`522ff2d` → `930ca59`, 46 commits), `git branch -d feature/sprint10-b2-b10`. |
| PR abiertos | Solo #18 (B3, `services/api.ts`, `app.config.js`, `eas.json`; "no mergear hasta tener dominio"). No se tocó ninguno de sus archivos. |
| `.github/` | No existe en `frontend/` (confirmado). |
| Dependencias (problema de entorno) | Tras sincronizar, `npm ls --depth=0` reportó 10 paquetes con versión inválida respecto al lockfile (p. ej. `expo@57.0.25` vs `~57.0.31`, `jest-expo@57.0.5` vs `~57.0.6`). Se corrigió con `npm ci --legacy-peer-deps`, que instala exactamente `package-lock.json` y no lo modifica. Es un problema de la copia local, no del código. |

### Estado de la suite antes de cualquier cambio (`930ca59`)

| Comando | Resultado |
|---|---|
| `npm run typecheck` | exit 0, sin errores. |
| Suite completa (comando de §6) | **185 suites:** 184 aprobadas, 1 omitida, 0 fallidas. **2,209 pruebas:** 2,204 aprobadas, 5 omitidas, 0 fallidas. |
| Suite omitida | `services/auth/__tests__/sessionRefresh.integration.test.ts`: usa `describe.skip` si no hay URL de backend real (`describeApi = apiUrl ? describe : describe.skip`). Es intencional (prueba de integración B4 contra backend vivo). |

### Fallo de AsyncStorage en `app/(tabs)/__tests__/index.test.tsx`

**Ya no se reproduce: pasa 4/4.** No hizo falta una "línea base reparada"; la línea base de `930ca59` es válida.

Causa real, reproducida a propósito: ejecutando la prueba sin `jest.setup.js` (solo con el setup de Skia),

```bash
npx jest --setupFiles="@shopify/react-native-skia/jestSetup.js" --runTestsByPath "app/(tabs)/__tests__/index.test.tsx"
```

la suite no arranca con `[@RNC/AsyncStorage]: NativeModule: AsyncStorage is null`, lanzado al importar `services/cache` (que importa `@react-native-async-storage/async-storage` al cargar el módulo). La corrección es el mock oficial global en `jest.setup.js` (`jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'))`), que ya estaba en `development` desde `1ad2297` (mariale-sierra, 13/10). No se modificó producción ni la configuración de Jest por este punto.

## 3. Archivos modificados y motivo

### Producción (11 archivos; ninguno en `app/`)

| Archivo | Líneas antes → después | Cambio | Motivo |
|---|---|---|---|
| `hooks/useMetricsScreen.ts` | 238 → 238 | 3 `catch (x: any)` → `catch (x)` (`unknown`); `error?.response?.status === 401` → `getApiErrorStatus(error) === 401`. | `any` innecesario; `getApiErrorStatus` (de `utils/apiError.ts`) hace exactamente la misma lectura sobre `unknown`. |
| `context/authContext.tsx` | 198 → 199 | `login`/`register`: `Promise<any>` → `Promise<AuthSessionResponse>`; `.catch((error: any)` → `unknown` + `getApiErrorStatus`. | El servicio ya devuelve `AuthSessionResponse`; los consumidores (`login.tsx`, `register.tsx`) solo hacen `await`, sin usar el valor, así que no cambia nada para ellos. |
| `services/auth/auth.service.ts` | 130 → 126 | Quita el `try { … } catch (error: any) { throw error; }` de `login`. | Código muerto: el `catch` solo relanzaba el mismo error. Se conserva el comentario de por qué no se registra. Prueba: el error llega idéntico (`rejects.toBe(mismoError)`). |
| `services/auth/sessionRefresh.ts` | 99 → 100 | `catch (error: any)` → `catch (error)`; estado leído con `getApiErrorStatus`. | `any` innecesario. Comportamiento cubierto por las pruebas B4 existentes (400/401 limpian, el resto se relanza). |
| `components/exercises/muscleFilterSheet.tsx` | 223 → 223 | 2 `.catch((error: any)` → `(error: unknown)`. | `logError` ya acepta `unknown`. |
| `services/notifications/pushNotifications.ts` | 216 → 218 | `console.warn('[push] …', error)` → `console.warn('[push] …', describeError(error))`. | **Log sensible** (ver §4). |
| `services/user/user.service.ts` | 95 → 100 | Quita el tipo sin uso `ChallengeListResponse`; mueve el JSDoc de `getMyChallenges` (estaba huérfano encima de `banUser`); tipa la respuesta (`api.get<MyChallengesResponse \| null>`). | Tipo obsoleto (TS6196) y respuesta implícitamente `any`. Las guardas `Array.isArray` se mantienen igual. |
| `components/challenge/create/ChallengeNameFields.tsx` | 114 → 114 | Quita `View` del import. | Import sin uso (TS6133). |
| `components/spaces/JoinRequestRowSkeleton.tsx` | 26 → 26 | Quita `View` del import. | Import sin uso (TS6133). |
| `components/home/CommentRow.tsx` | 68 → 68 | Quita `spacing` del import. | Import sin uso (TS6133). |

Sin dependencias nuevas, sin sistema de logging nuevo, sin `as any`, `@ts-ignore` ni desactivaciones de ESLint/TypeScript.

### Pruebas (6 archivos nuevos + 1 ampliado)

| Archivo | Pruebas | Comportamiento cubierto |
|---|---|---|
| `hooks/__tests__/useMetricsScreen.test.tsx` (nuevo) | 17 | Solo retos activos; preselección por `challengeId` y caída al primero si no es válido; estado vacío sin pedir rutina; sin usuario no carga; 401 → `'401'`, 500/red/rechazo no-Error → `'generic'`; si falla solo la rutina, la lista de retos se conserva; nombre de rutina nulo si `getRoutine` falla o no hay id; adaptación inválida (B7); cambio de reto carga su rutina; toast propio solo si el interceptor no mostró uno; aplicar/quitar ubicación recarga la rutina y actualiza la tienda; navegación. Adaptadores y tiendas reales; servicios simulados en su frontera. |
| `components/exercises/__tests__/muscleFilterSheet.test.tsx` (nuevo) | 10 | Lista regiones al abrir y no pide nada cerrada; tocar la fila filtra por región; el chevrón entra a la región y un músculo filtra solo por él; título y estado de carga; volver; fila "todas" solo con filtro activo; reabrir vuelve a regiones; fallo al cargar regiones o músculos no bloquea la hoja. |
| `services/user/__tests__/user.service.test.ts` (nuevo) | 15 | `getMyChallenges` aplana `active → completed → left`, grupos ausentes, cuerpo nulo, forma no agrupada, grupos que no son listas, error propagado; `searchUsers` recorta, no llama con texto vacío, ignora respuestas que no son lista; perfil, foto, perfil público; ban/unban y baneados. |
| `services/auth/__tests__/authService.test.ts` (nuevo) | 7 | Login/registro: inicia sesión, guarda id/usuario solo si vienen, banderas `suppressErrorToast` + `authRefresh`, consentimiento legal; errores 401/409 llegan intactos y no inician sesión; `acceptTerms`, `fetchAuthMe`. |
| `context/__tests__/authLoginRegister.test.tsx` (nuevo) | 6 | Arranque sin sesión; login fija token/usuario y devuelve la respuesta; respaldo a lo almacenado; credenciales erróneas → sigue sin sesión y relanza; registro; logout desregistra push **antes** de cerrar sesión y limpia el estado. |
| `components/challenge/create/__tests__/ChallengeNameFields.test.tsx` (nuevo) | 7 | Contador `n / 40`, recorte a 40 caracteres, validación al perder foco (con y sin handler), mensaje de error, descripción sin recorte. |
| `services/notifications/__tests__/pushNotifications.test.ts` (ampliado) | +1 | El aviso de registro fallido imprime `POST /notifications/push-token -> 500` y nunca el bearer ni el push token. |

**Total: +6 suites y +63 pruebas.** Ninguna aserción existente se debilitó ni se omitió.

**Comprobación de que las pruebas detectan regresiones** (mutación manual, revertida en el acto y verificada con `git diff`): cambiar `=== 401` por `=== 403` en `useMetricsScreen.ts` hace fallar 1 prueba; volver a imprimir el `error` crudo en `pushNotifications.ts` hace fallar la prueba nueva de push.

## 4. Limpieza de logs

| Log | Decisión | Justificación |
|---|---|---|
| `services/notifications/pushNotifications.ts:172` — `console.warn('[push] could not register the push token', error)` | **Saneado** con `describeError(error)` (ya existente en `utils/apiError.ts`). | Imprimía el objeto de error crudo. Si falla `POST` del token, el error de Axios lleva `config.headers.Authorization` (**bearer de la sesión**) y `config.data` (**push token**), visibles en Metro/LogBox en desarrollo. Ahora solo sale método, ruta sin query y estado. No se eliminó el diagnóstico. |
| `pushNotifications.ts:152` (sin `projectId`) y `:168` (429) | Conservados. | Texto fijo, sin datos. |
| `utils/apiError.ts` — `logError` (`console.error`) y `logWarn` (`console.warn`) | Conservados. | Son el mecanismo central: solo en `__DEV__`, pasan por `describeError` (sin cuerpos, cabeceras, payloads ni URLs firmadas). |
| `i18n/index.ts:54` — fallo de inicialización de i18n | Conservado. | Error real de arranque, sin datos de usuario. |

**`services/uploads/upload.service.ts` (posible solapamiento con B5): sin cambios.** Se revisó: no tiene `console.*`; usa `logWarn` en dos puntos que solo registran "forma inesperada de `/uploads/sign`" y el estado HTTP + código de error del almacenamiento (p. ej. `SignatureDoesNotMatch`). No registra la URL firmada, la sesión ni el payload, y `upload.service.test.ts` (B5, PR #20 fusionado) ya verifica que la URL firmada nunca se registra. **Para B5:** no hay cambio pendiente ni conflicto en este archivo por parte de B10.

## 5. Conteos antes/después: `console.*` y `any`

**Criterio** (`scripts/code-metrics.js`, `npm run metrics`): carpetas `app, components, context, hooks, i18n, services, store, types, utils, validation, constants`; solo `.ts/.tsx`; excluye `__tests__/`, `*.test.*` y `node_modules`. El script elimina comentarios y el contenido de cadenas antes de contar. `console`: cada llamada `console.<log|error|warn|info|debug>(`. `any`: uso como tipo (`: any`, `as any`, `<any>`, `any[]`, `, any`, `| any`). No incluye archivos raíz (`App.tsx`, `index.ts`, `index.web.tsx`, `app.config.js`; revisados a mano: 0 `console` y 0 `any`) ni `scripts/` o `test-utils/` (herramientas, no producción). No hay archivos generados en ese alcance.

**Contraste con grep** (incluye comentarios), mismas carpetas y exclusiones:

```bash
grep -rnE "console\.(log|error|warn|info|debug)\(" <carpetas> --include=*.ts --include=*.tsx | grep -v __tests__ | grep -v "\.test\."
grep -rnE "(:\s*any\b|\bas\s+any\b|<\s*any\s*[>,\[]|\bany\s*\[\]|,\s*any\s*[>,)\]]|\|\s*any\b)" <carpetas> --include=*.ts --include=*.tsx | grep -v __tests__ | grep -v "\.test\."
```

| Métrica | Diagnóstico previo (orientativo) | Antes (`930ca59`) | Después |
|---|---|---|---|
| `console.*` (script) | ~45 (`log`/`error`) | **6** (`error` 2, `warn` 4) | **6** (`error` 2, `warn` 4; uno saneado) |
| `console.log` + `console.error` | ~45 | 2 | 2 |
| `console.*` por carpeta | app 20, services 17, hooks 5, components 3 | app 0, services 3, hooks 0, components 0, utils 2, i18n 1 | igual |
| `any` como tipo (script) | ~31 | **28** | **18** |
| `any` con grep | — | 30 líneas (2 son la palabra "any" en comentarios de `FeedPostCard.tsx` y `searchUserRow.tsx`) | 20 (las mismas 2 de comentario) |
| `hooks/useMetricsScreen.ts` | 3 | 3 | 0 |
| `app/challenge/routine/exercises.tsx` | 3 | 0 (ya resuelto en la primera entrega de B10) | 0 |
| TS6133/TS6196 (`npx tsc --noEmit --noUnusedLocals`, diagnóstico; no es script del repo) | — | 13 (9 producción, 4 pruebas) | 9 (5 producción, 4 pruebas) |

El diagnóstico de ~45 `console` y ~31 `any` **no corresponde al estado actual**: la reducción de logs ocurrió antes de este bloque (`e52021f`, esteban-dlp, 15/10, introdujo `logError`/`logWarn`), y la primera entrega de B10 ya había medido 2 `log/error` y 28 `any` en `522ff2d`. Detalle por archivo en [`evidencias-b10/metricas-console-any.json`](evidencias-b10/metricas-console-any.json).

`any` eliminados (10): `useMetricsScreen.ts` 3, `authContext.tsx` 3, `muscleFilterSheet.tsx` 2, `auth.service.ts` 1, `sessionRefresh.ts` 1.

**`any` restantes (18), no tocados a propósito:**
- `services/api.ts` (4): lo modifica el PR abierto #18 (B3); cambiarlo ahora generaría conflicto.
- 14 en pantallas de `app/` (`catch (error: any)` en login, register, accept-terms, create, routine/create, routine/select, invite, delete-account y 6 en `app/exercises/*`): fuera del alcance (sin intervenir pantallas; `register.tsx` está protegido).

## 6. Cobertura

### Comando y alcances

Todas las mediciones usan el mismo comando en `frontend/` (caché y salida en un directorio temporal propio para no sobrescribir reportes ni chocar con la caché de Windows en `%TEMP%`):

```bash
npx jest --ci --coverage --cacheDirectory=<tmp>/jest-cache --coverageDirectory=<tmp>/<medicion>/coverage \
  --coverageReporters=json-summary --coverageReporters=text-summary --coverageReporters=json \
  --json --outputFile=<tmp>/<medicion>/jest-results.json [--collectCoverageFrom ...]
```

- **Alcance original** (configuración previa a `7b56568`, reconstruida por CLI): `--collectCoverageFrom='services/**/*.{ts,tsx}' --collectCoverageFrom='hooks/**/*.{ts,tsx}' --collectCoverageFrom='i18n/**/*.{ts,tsx}'` → 88 archivos.
- **Alcance ampliado** (`collectCoverageFrom` actual de `package.json`, sin cambios en esta entrega): `services`, `hooks`, `i18n`, `components`, `app` (`**/*.{ts,tsx}`), excluyendo `**/__tests__/**`, `**/*.d.ts` y `components/**/index.ts` → 359 archivos.

**Sobre el alcance ampliado:** ya incluía `components/` y `app/` desde la primera entrega de B10, así que no se modificó. Se verificó que es correcto para el repositorio: en esas carpetas solo hay `.ts`/`.tsx` (112 + 268, más 6 `.gitkeep`), no hay `__mocks__`, `*.test.*` ni `*.spec.*` fuera de `__tests__/`, ni `*.d.ts` ni archivos generados; los `components/**/index.ts` solo reexportan. No se agregaron exclusiones ni umbrales.

### Resultados

| # | Medición | Código | Archivos | Statements | Branches | Functions | Lines | Estado |
|---|---|---|---|---|---|---|---|---|
| 1 | Inicial · alcance original | `930ca59` | 88 | 60.02% (1662/2769) | 60.92% (1026/1684) | 57.71% (475/823) | 59.75% (1430/2393) | exit 0; 184 suites ok, 1 omitida; 2,204 pruebas ok, 5 omitidas |
| 2 | Inicial · alcance ampliado | `930ca59` | 359 | 54.40% (4431/8144) | 51.84% (2929/5649) | 49.39% (1263/2557) | 55.05% (4027/7315) | ídem |
| 3 | **Final · alcance ampliado** | `930ca59` + B10 | 359 | **56.92% (4635/8142)** | **53.12% (3001/5649)** | **52.20% (1335/2557)** | **57.58% (4211/7313)** | exit 0; 190 suites ok, 1 omitida; 2,267 pruebas ok, 5 omitidas |
| 4 | Final · alcance original (control) | `930ca59` + B10 | 88 | 65.95% (1825/2767) | 63.42% (1068/1684) | 63.66% (524/823) | 65.83% (1574/2391) | ídem |

Salidas guardadas por separado: [`evidencias-b10/`](evidencias-b10/) (`cobertura-1…4-*.txt`).

### Lectura

- **Efecto del universo medido (1 vs 2):** con las mismas pruebas y el mismo código, pasar del alcance original al ampliado baja líneas de 59.75% a 55.05% (−4.70 pp). Es el denominador (271 archivos más), no una pérdida de cobertura.
- **Efecto de esta entrega (2 vs 3, mismo alcance y los mismos 359 archivos):** líneas +2.53 pp (+184 líneas cubiertas), statements +2.52 pp (+204), branches +1.28 pp (+72), functions +2.81 pp (+72).
- **Denominador:** statements 8144 → 8142 y lines 7315 → 7313. Las 2 unidades menos salen de quitar el `try/catch` muerto de `auth.service.ts` (40 → 38 statements, 38 → 36 líneas). No cambió el conjunto de archivos.

### Por archivo intervenido (alcance ampliado, medición 2 → 3)

| Archivo | Lines | Branches | Functions |
|---|---|---|---|
| `hooks/useMetricsScreen.ts` | 0% → 98.13% (105/107) | 0% → 81.48% | 0% → 100% |
| `components/exercises/muscleFilterSheet.tsx` | 0% → 100% (30/30) | 0% → 88.46% | 0% → 100% |
| `services/user/user.service.ts` | 0% → 100% (26/26) | 0% → 100% | 0% → 100% |
| `components/challenge/create/ChallengeNameFields.tsx` | 22.22% → 100% (9/9) | 0% → 100% | 0% → 100% |
| `services/auth/auth.service.ts` | 71.05% → 100% (36/36) | 62.5% → 87.5% | 80% → 90% |
| `services/auth/sessionRefresh.ts` | 100% → 100% | 90.47% → 90.47% | 100% → 100% |
| `services/notifications/pushNotifications.ts` | 81.01% → 81.01% | 74.07% → 74.07% | 70% → 70% (la línea saneada ya se ejecutaba; la prueba nueva fija su contenido) |
| `components/home/CommentRow.tsx`, `components/spaces/JoinRequestRowSkeleton.tsx` | 100% → 100% | — | — |

`context/authContext.tsx` **no está en el alcance de `collectCoverageFrom`** (ni en el original ni en el ampliado). Medición aparte, solo informativa: `npx jest --coverage --collectCoverageFrom='context/authContext.tsx' context/__tests__` da 89.02% de líneas (73/82); con solo las dos suites previas (`authRestoreSession`, `authSessionExpired`) daba 53.65% (44/82). No suma a las mediciones 1–4.

## 7. Validación final

| Verificación | Resultado |
|---|---|
| Pruebas específicas durante el desarrollo | Cada suite nueva o ampliada se ejecutó sola hasta pasar: 17, 10, 15, 7, 6, 7 y 19 (push). |
| Suite completa | **191 suites: 190 aprobadas, 1 omitida (integración B4), 0 fallidas. 2,272 pruebas: 2,267 aprobadas, 5 omitidas, 0 fallidas.** |
| `npm run typecheck` | exit 0. |
| Lint | **No existe** script de lint ni de formato en `frontend/package.json`; no se ejecutó ninguno. |
| `npm run i18n:check` | OK, mismas claves en `en` y `es` (no se tocaron textos). |
| Cobertura final | Medición 3 (y 4 de control), §6. |
| Ruido en consola | Las suites nuevas no imprimen nada en consola (verificado ejecutándolas solas). Los ~50 `console.error/warn` de la corrida completa (avisos de `act()` y similares) ya estaban en la línea base y vienen de otras suites. |
| Revisión del diff | Solo los 11 archivos de §3, el reporte y sus evidencias. Sin cambios en `app/`, `package.json`, `package-lock.json`, configuración de Jest ni archivos de otros bloques. |

**No se hizo validación visual ni manual de la app** (sin emulador ni dispositivo en esta ejecución). Los cambios de producción son de tipos, imports, un `try/catch` que solo relanzaba y el texto de un aviso de desarrollo; las pruebas cubren esos caminos, pero eso no garantiza por sí solo la ausencia total de regresiones.

## 8. Riesgos, limitaciones y pendientes de coordinación

- **`context/`, `store/`, `utils/`, `validation/`, `constants/` y `types/` siguen fuera de `collectCoverageFrom`.** No se agregaron porque la tarea pedía ampliar a `components/` y `app/`; agregarlos cambiaría el universo frente a las mediciones previas. Propuesta para un siguiente bloque: incluirlos y reportar las cifras antes/después con el mismo método.
- **`services/api.ts`** (4 `any`): esperar a que se resuelva el PR #18 (B3).
- **Pantallas con `catch (error: any)` e imports sin uso** (`app/challenge/create.tsx`, `app/challenge/routine/create.tsx`, `app/messaging/spaces/create.tsx`, `app/profile/about.tsx`, `app/profile/delete-account.tsx`): limpieza de una línea cada una, pospuesta para no intervenir pantallas mientras B1/B2/B4/B9 trabajan en ellas. Dos (`challenge/create.tsx`, `routine/create.tsx`) cambiaron el 25/10.
- **Imports sin uso en pruebas** (4: `__tests__/nativeConfig.test.ts`, `ActiveChallengeSection.test.tsx`, `confirmationPopup.test.tsx`): no afectan producción; no se tocaron.
- `authContext.tsx`, `auth.service.ts` y `sessionRefresh.ts` son de B4 (fusionado). Los cambios no alteran la lógica y las pruebas B4 existentes (`authRestoreSession`, `sessionRefresh`, `sessionExpired`) siguen pasando.
- Copias locales desactualizadas deben correr `npm ci --legacy-peer-deps` tras sincronizar `development` (ver §2).

### Propuesta de CI (no implementada)

`.github/workflows/frontend-ci.yml`, en `pull_request` y `push` a `development`: `actions/checkout`, `actions/setup-node` (Node 24, caché npm), `npm ci --legacy-peer-deps`, `npm run typecheck`, `npm run i18n:check`, `npx jest --ci --coverage`, y subir `coverage/coverage-summary.json` como artefacto. Sin umbral de cobertura al principio, para no bloquear PR mientras se mide la tendencia.

## 9. Pantallas que no se tocaron y por qué

| Pantalla | Motivo |
|---|---|
| `app/(auth)/register.tsx`, `app/(tabs)/challenges.tsx`, `app/challenge/[id]/index.tsx` | Protegidas por la coordinación: sus cambios esperan los PR de los bloques correspondientes. |
| `app/(tabs)/index.tsx` | El fallo de AsyncStorage estaba en el entorno de pruebas (ya corregido en `jest.setup.js`), no en la pantalla. |
| Resto de `app/` (incluidas las 5 con imports sin uso y las 14 con `any`, §5 y §8) | Fuera del alcance: no se refactorizan pantallas y otros bloques (B1/B2/B4/B9) las intervienen. |

## 10. Cómo repetir y revertir

Repetir: `npm run metrics`, `npm run typecheck`, `npm run i18n:check` y el comando de §6 (con y sin las tres `--collectCoverageFrom` del alcance original). Revertir: `git revert` de los commits de B10 de esta entrega (sin datos ni configuración externa involucrados).
