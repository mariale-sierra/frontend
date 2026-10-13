# Badges y recompensas (Sprint 9, B12)

## Decisión de producto

**Las recompensas son badges calculados al vuelo, sin persistencia.** Se mantiene la decisión del sprint anterior (B3), documentada en `backend/src/badges/badges.service.ts`: nada se "otorga" ni se guarda; cada request cuenta `workout_logs` completados, la racha y los retos completados.

| Opción | Qué implica | Decisión |
|---|---|---|
| Calcular al vuelo (actual) | Cero tablas ni migraciones. Siempre coherente con los datos reales. Sin fecha de obtención ni notificación de "ganaste un badge". | **Elegida** para este sprint |
| Otorgar y persistir | Tabla de badges otorgados + lógica de otorgamiento + migración. Permite fecha de obtención, notificaciones y que un badge no se pierda si cambia el dato de origen. | Pendiente: solo si producto pide "fecha de obtención" o un aviso al ganar |

Consecuencia a tener presente: la racha (`streak_7_days`) se calcula con la racha **actual**, así que quien la rompe vuelve a ver el badge como "por conseguir". Si eso no es deseable, es el argumento para persistir.

## Catálogo (backend `BADGE_CATALOG`)

| code | Criterio | Métrica | Meta |
|---|---|---|---|
| `first_workout` | Primer entrenamiento completado | entrenamientos | 1 |
| `five_workouts` | 5 entrenamientos | entrenamientos | 5 |
| `ten_workouts` | 10 entrenamientos | entrenamientos | 10 |
| `streak_7_days` | 7 días consecutivos | racha actual | 7 |
| `one_challenge_completed` | 1 reto completado | retos | 1 |
| `three_challenges_completed` | 3 retos completados | retos | 3 |

Agregar un badge nuevo: una entrada en `BADGE_CATALOG` (siempre que use una métrica existente), su estilo en `frontend/constants/badges.ts` y su texto en `badges.items.<code>` de `i18n/resources/{es,en}.ts` (si falta, la app usa el nombre/descripción que manda el backend).

## Frontend

- `GET /badges/me` y `GET /badges/user/:userId` → `services/badges/badges.service.ts`, tipo `types/badge.ts`.
- `components/badges/BadgesSection.tsx`: fila horizontal en el perfil propio (`app/(tabs)/profile.tsx`) y ajeno (`app/profile/[userId].tsx`), ganados primero. No se muestra con lista vacía (perfil privado sin seguir) ni si falla la carga.
- `BadgeTile`: disco con color de actividad (`constants/badges.ts`) e icono `ink` si está ganado; disco translúcido y atenuado si no.
- `BadgeDetailSheet`: "qué significa y cómo se consigue" (nombre, criterio, barra de progreso). Usa `BottomSheetModal glass`, como el resto de hojas.
- Los badges **no** se muestran en la pantalla de un reto: dependen del usuario, no del reto, y pedirlos por participante serían N requests. Si producto lo quiere, haría falta un endpoint que los devuelva en lote.

## Contenido de prueba

`backend/database/demo/2026-10-12-01-demo-content.sql`, aplicado **a mano** con `npm run db:demo` (no corre en el arranque ni en el deploy, a diferencia de `seeds/`). Crea 5 usuarios `demo_*` (clave `TestHavit123!`), 4 retos públicos, follows, 22 entrenamientos con post (imágenes `picsum.photos`), hashtags y likes. `demo_ana` tiene los 4 primeros badges y 2 retos completados; `demo_luis`, `demo_sofia` y `demo_valeria` quedan en progreso; `demo_marco` sin ninguno. Es idempotente. **Solo para bases de desarrollo.**

## Estados vacíos

`components/ui/emptyState.tsx` (icono + título + mensaje + hasta dos botones) reemplaza el texto suelto en: feed (`EmptyFeed`), perfil propio sin fotos, Retos → "Mis retos", Buscar (sin texto y sin resultados) y Mensajes sin conversaciones. Cada uno lleva a explorar retos, crear/registrar o buscar personas.
