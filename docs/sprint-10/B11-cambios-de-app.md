# B11 — Cambios de app: retos privados y aviso al reabrir (Sprint 10)

Fecha: 2026-10-27. Es la parte de app de los cambios de código de B11. El documento principal, con las decisiones, sus alternativas y las pruebas del backend, es `backend/docs/sprint-10/B11-B12-cambios-de-codigo.md`.

## 1. Resumen y criterio

- **Rutina oculta.** Cuando `GET /challenges/:id` trae `routine_hidden: true` (reto privado y quien mira no es miembro), la ficha del reto sigue mostrando la sección "El ciclo" con su resumen, pero en lugar de los días muestra: *"Es un reto privado: verás su rutina cuando aprueben tu solicitud."*
- **Card de Explorar.** En un reto privado dice "Solicitar ›" en vez de "Unirme ›".
- **Notificación `challenge_reopened`.** Tiene tipo, texto es/en y se trata como evento del sistema (nunca dice "Usuario eliminado"). Al tocarla abre el reto, por la ruta genérica de entidad `challenge`.
- **FAQ.** Pregunta nueva: "¿Qué veo de un reto privado antes de entrar?".

**Criterio: cumplido en código y pruebas automáticas.** No se verificó en dispositivo.

## 2. Archivos

| Archivo | Cambio |
|---|---|
| `types/challenge.ts` | `routine_hidden?: boolean` en `ChallengeContract` |
| `services/adapters/challengeDetailAdapter.ts` | `routineHidden` en el view model |
| `components/challenge/detail/challengeRoutineList.tsx` | Prop `hiddenNotice`: muestra el aviso, con ícono `lock-closed-outline` y texto en tono `secondary`, en vez de las filas |
| `app/challenge/[id]/index.tsx` | Pasa el aviso cuando `routineHidden` |
| `components/challenge/list/challengeListSections.tsx`, `services/adapters/challengeListAdapter.ts`, `components/challenge/list/ExploreChallengeCardV2.tsx` | `isPrivate` → "Solicitar" |
| `types/notification.ts`, `services/notifications/notificationText.ts` | Tipo `challenge_reopened`, evento del sistema |
| `app/profile/help.tsx` | Pregunta `private` en la sección Retos |
| `i18n/resources/{es,en}.ts` | `challenges.requestJoin`, `challengeInfo.routineHiddenNotice`, `notifications.types.challenge_reopened`, `help.sections.challenges.items.private` |

Solo se usaron componentes y tokens existentes (`Row`, `Icon`, `Text` tono `secondary`, `spacing`); no hay valores nuevos de diseño.

## 3. Cómo se probó

```bash
npm run typecheck        # sin errores
npm run i18n:check       # OK: mismas claves en en.ts y es.ts
npx jest --ci            # suite completa, ver la sección 5 del documento del backend y el commit
```

Pruebas nuevas:

| Archivo | Qué comprueba |
|---|---|
| `challengeDetailAdapter.test.ts` | `routineHidden` y que el ciclo sigue contando los días de descanso |
| `challengeListAdapter.test.ts` | `isPrivate` |
| `ExploreChallengeCard.test.tsx` | "Join" vs "Request" |
| `challengeRoutineList.test.tsx` | Aviso en vez de filas |
| `notificationText.test.ts` | `challenge_reopened` como evento del sistema |

## 4. Compatibilidad

- **App vieja + backend nuevo:** quien no es miembro de un reto privado ve los días del ciclo sin nombre. No se rompe.
- **App nueva + backend viejo:** nunca llega `routine_hidden`, así que se ve igual que antes.
- **Notificaciones:** una app vieja que recibe `challenge_reopened` muestra el texto que manda el servidor ("Se reabrió un challenge en el que participas.", del catálogo del backend) y abre el reto (la ruta se resuelve por la entidad `challenge`).

## 5. Cómo revertir

`git revert` del commit de la app. El backend puede quedarse como está (ver la sección 4).
