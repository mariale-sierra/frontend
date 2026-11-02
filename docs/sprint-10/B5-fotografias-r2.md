# B5 — Seguridad de fotografías y Cloudflare R2 (app)

Documento hermano y más corto. La referencia completa (decisiones técnicas de CP1/CP2/CP4a, matriz de pruebas de abuso CP7, decisión sobre el bucket privado, tratamiento de fotografías existentes, riesgos y procedimiento de reversión) está en `backend/docs/sprint-10/B5-fotografias-r2.md`. Responsable: Martin Villatoro · Rama: `feature/sprint10-b5-fotos-r2`.

> Nada de esto está desplegado. El bucket R2 sigue público (CP4b no ejecutado). No se agregaron dependencias ni se tocó infraestructura.

## 1. Resumen y criterio de aceptación

La parte de app de B5 es **CP6**: dejar de declarar siempre `image/jpeg` al subir una foto (la galería puede entregar PNG/WebP reales) y confirmar que la app sigue funcionando igual una vez que el backend empezó a devolver URLs de lectura **firmadas** en vez de públicas (CP4a). **Criterio: cumplido** — ver §4.

## 2. Qué cambió en la app

| Pieza | Cambio |
|---|---|
| `services/uploads/upload.service.ts` | Nuevo `normalizeUploadMimeType(reportedMimeType)`: usa el tipo real que reporta `expo-image-picker` (`jpeg`/`png`/`webp`, sin distinguir mayúsculas, recorta espacios) y cae a `image/jpeg` si no es ninguno de los tres que el backend firma. `uploadImageAsync`'s `fileType` amplía su tipo a `UploadableImageType` (antes solo admitía jpeg/png como valor por defecto implícito; ahora incluye webp explícitamente). |
| `app/profile/edit.tsx` | `handleChangePhoto` ya no declara `'image/jpeg'` fijo: usa `normalizeUploadMimeType(result.assets[0].mimeType)`. |
| `hooks/usePhotoProgressSubmit.ts` | **Sin cambios, a propósito.** Esa pantalla solo usa la cámara (`expo-camera`), que siempre produce JPEG — el `'image/jpeg'` fijo que ya tenía es correcto y no es el mismo defecto que `edit.tsx` tenía. |
| `services/cache/queries.ts` | **Sin cambios.** Se verificó que todos los `staleTime` (activity 45s, social 2min, catalog 5min) ya están por debajo del TTL firmado más corto del backend (10 min, post privado) — no había nada que corregir, solo que confirmar. Se agregó una prueba de regresión (§3) para que un cambio futuro no vuelva a abrir esa ventana sin que alguien lo note. |

No se tocó ningún otro flujo de subida o visualización de fotos: la pantalla de reto (`usePhotoProgressSubmit.ts`) es cámara-solo y ya era honesta sobre el tipo; no existe un tercer punto de subida de imágenes en la app.

## 3. Pruebas (resultados reales, 2026-10-24)

| Comando | Resultado |
|---|---|
| `npx jest --silent` | **179/180 suites, 2155 pass**, 0 fallos, 5 omitidas (preexistentes) |
| `npx tsc --noEmit` (script `typecheck`, sí existe pese a lo que decía la nota anterior de este repo) | OK |
| `npm run i18n:check` | OK — en/es con las mismas 1138 claves |
| `npx prettier --check <archivos tocados>` | El repositorio no tiene Prettier configurado como estándar (confirmado: hasta archivos nunca tocados en B5 fallan el mismo check con la configuración por defecto) — no es una regresión de B5, es ruido preexistente de todo el repo |

- `services/uploads/__tests__/upload.service.test.ts`: `normalizeUploadMimeType` (acepta jpeg/png/webp tal cual, sin distinguir mayúsculas, recorta espacios, cae a jpeg para `undefined`/`null`/vacío/`heic`/`application/octet-stream`); `uploadImageAsync` sube un WebP con el Content-Type correcto. **CP7:** nueva prueba "sends If-None-Match on every PUT and fails safely... if R2 rejects a reused key with 412" — confirma que la app manda `If-None-Match: '*'` en cada PUT y, si R2 llegara a rechazar una key reutilizada, no reintenta ni lo trata como éxito (el rechazo real de R2 no se probó: requiere CP0, ver el documento del backend).
- `app/profile/__tests__/editProfile.test.tsx`: se corrigió el mock de `upload.service` (le faltaba `normalizeUploadMimeType`, un hueco latente que no fallaba hoy pero rompería cualquier prueba futura que ejercite `handleChangePhoto`). Las 4 pruebas existentes siguen en verde.
- `services/cache/__tests__/queries.test.ts` (nuevo): cada `staleTime` salvo `reference` queda por debajo de 10 minutos (el TTL firmado más corto del backend); `reference` queda explícitamente excluido porque nunca lleva una URL de foto.

## 4. Compatibilidad con URLs firmadas

No se necesitó ningún cambio para que la app funcione con URLs firmadas en vez de públicas: la app ya trataba `image_url`/`profile_image_url`/etc. como una URL opaca (las pasa directo a `<Image source={{ uri }}>` o equivalente), nunca las parseaba ni las reconstruía. Una URL firmada vencida se comporta, del lado de la app, igual que cualquier imagen que deja de cargar (estado de error de la imagen ya existente en los componentes), porque el backend siempre entrega una URL fresca en cada respuesta — la app nunca guarda ni reconstruye una URL firmada por su cuenta.

No se probó contra R2 real con una URL firmada realmente vencida. **CP0 fue autorizado el 2026-10-24 exclusivamente contra un bucket de pruebas aislado, pero no pudo ejecutarse**: no hay credenciales de Cloudflare R2 en ningún checkout local de este trabajo (ni de prueba ni de producción). El detalle completo de qué se necesita para ejecutarlo está en `backend/docs/sprint-10/B5-fotografias-r2.md`, §13.

## 5. Corrección de moderación (solo backend, sin cambios en la app)

El 2026-10-24 se corrigió un riesgo de moderación detectado durante la revisión de CP0: un fallo al firmar la URL de lectura para moderación podía, tras 2 horas pendiente, aprobarse automáticamente sin que OpenAI evaluara la foto. La corrección es enteramente de `backend/src/workout-posts/workout-posts.service.ts` — no requirió ni requiere ningún cambio en la app. Detalle completo, decisión técnica y evidencia de pruebas en `backend/docs/sprint-10/B5-fotografias-r2.md`, §14.
