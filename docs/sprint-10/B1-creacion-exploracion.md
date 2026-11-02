# B1 — Correcciones Neurolab: creación y exploración de challenges (Sprint 10)

Responsable del bloque: Camila Sandoval. El código de B1 entró en `888cc04` ("cambios sprint 10", 2026-10-20) y `522ff2d` ("fix"), más los ajustes de la card de Explorar del 25 y 26/10. Este documento se escribió el 2026-10-27 a partir de esos commits, porque B1 no tenía su `.md`. Describe lo que hay en el código y **no inventa resultados de pruebas con usuarios**: esas pruebas no se hicieron.

## 1. Resumen y criterio de aceptación

- **Creación.** Ahora tiene un paso por decisión, y cada paso explica qué se pide:
  1. nombre;
  2. actividad y lugar;
  3. ciclo y duración, con un calendario de vista previa;
  4. llenar el ciclo;
  5. visibilidad, con su consecuencia;
  6. foto;
  7. revisión;
  8. reglas ("Cómo funciona").
- **Explorar.** Tiene filtros por actividad y una card nueva con un botón visible ("Unirme ›"). La acción principal se distingue de los datos secundarios (duración y miembros como badges).
- **Estados.** Los mensajes de solicitud enviada, unión, abandono y finalización están en es/en.

**Criterio:** *"los flujos de crear, explorar y unirse deben completarse sin bloqueos, con acciones y estados comprensibles"*.

| Parte | Estado | Evidencia |
|---|---|---|
| Flujos sin bloqueos | ✅ automatizado | `createChallenge.test.tsx`, `useCreateChallengeFlow.test.tsx`, `challengesTab.test.tsx`, `challengeInfoInvite.test.tsx`, `ExploreChallengeCard.test.tsx` en verde |
| Acciones y estados comprensibles | ⏳ **sin validar con usuarios** | La tarea "Validar cambios" (3 personas ajenas al equipo, sin instrucciones) **no se hizo**. No hay resultados que reportar. |

**Estado: PARCIAL.** Implementado y con pruebas automáticas; falta la validación con usuarios.

## 2. Hallazgo Neurolab → cambio → archivo

Fuente: informe del Sprint 9, "Resultados de las Pruebas de Experiencia de Usuario", pp. 10–12, citado con IDs en `B2-navegacion-comprension.md` §9. Los IDs (L-x, E-x) son los de ese documento.

| Hallazgo | Cambio | Archivos |
|---|---|---|
| **E-4** "Comprendí cómo crear un reto": **2.50/5** (el más bajo) y **L-A** crear retos fue de las tareas más difíciles y largas | El antiguo paso "Arma el ciclo" se dividió en **Ciclo y duración** ("Planea unos cuantos días una vez. Los repetiremos hasta que termine el reto.") y **Llena tu ciclo**. El calendario de vista previa muestra "N ciclos completos + N días", así que "ciclo" deja de ser jerga y se ve con un ejemplo concreto. "Configura los N días" pasó a "Llena el día N para continuar", que dice exactamente qué falta. | `app/challenge/create.tsx`, `components/challenge/create/{CycleLengthCard,CycleCalendarPreview,CycleDayList}.tsx`, `hooks/useCreateChallengeFlow.ts`, `store/challengeBuilderStore.ts` |
| E-4 / L-A: las consecuencias de cada decisión | El paso de visibilidad dice qué implica cada opción: "Solo por solicitud — tú apruebas quién se une. Las fotos se quedan entre los miembros". Paso nuevo **Cómo funciona**, con las 3 reglas del reto: foto diaria, constancia y que se hace en grupo. | `components/challenge/create/{VisibilityCardGroup,ChallengeRulesStep}.tsx` |
| E-4: cómo finalizar el reto | La revisión resume el ciclo como "Ciclo de N · desglose" antes de "Iniciar reto". | `components/challenge/create/ChallengeReviewSummary.tsx` |
| **L-B** explorar y luego unirse fue de las tareas más difíciles y lentas | Card de Explorar rediseñada con una píldora **"Unirme ›"** visible en el color de la actividad (antes solo había un "View" en texto). Filtros por actividad (`ActivityFilterChips`). Estado vacío por filtro ("Aún no hay retos en esta categoría."). | `components/challenge/list/{ExploreChallengeCardV2,ActivityFilterChips}.tsx`, `app/(tabs)/challenges.tsx` |
| L-B + **E-9** (botones claros), cerrado el 27/10 | En un reto **privado**, la card dice **"Solicitar ›"** en vez de "Unirme". Así coincide con el detalle ("Solicitar unirme") y con el glosario de B2; antes la card prometía "Unirme" en un reto que en realidad pide aprobación. | `ExploreChallengeCardV2.tsx`, `services/adapters/challengeListAdapter.ts` (`isPrivate`) |
| L-B: invitación | El detalle del reto muestra quién te invitó ("@usuario te invitó a este reto"). | `app/challenge/[id]/index.tsx`, `__tests__/challengeInfoInvite.test.tsx` |
| Estados (tarea 3) | Mensajes en es y en: unión (`joinConfirm.success`), solicitud enviada (`joinConfirm.requestSent`, `requestPendingLabel`), aprobación (`joinApprovedPopup`), salida (`leaveConfirm`, "Tu progreso se guardará") y finalización (de B2: `ChallengeFinishedPopup`). | `i18n/resources/{es,en}.ts` |

## 3. Decisiones y alternativas descartadas

| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Dividir ciclo/duración y llenado del ciclo en dos pasos | Mantener un solo paso con todo | El paso único concentraba la decisión más difícil (E-4 2.50/5). Separarlo deja una sola pregunta por pantalla. |
| CTA visible en la card ("Unirme ›") que abre el detalle | Unirse directo desde la card | Unirse sin ver la rutina ni las reglas sería un paso a ciegas, y los privados necesitan la confirmación de solicitud. La card lleva al detalle, donde se confirma. |
| "Solicitar" (corto) en la card | "Solicitar unirme" completo | La píldora comparte la fila con dos badges; el texto completo no entra en pantallas angostas. El detalle sí usa el texto completo. |

## 4. BD, variables de entorno e infraestructura

Ninguno. Solo cambios de app.

## 5. Cómo se probó

```bash
npm run typecheck                                            # sin errores
npm run i18n:check                                           # mismas claves en en.ts y es.ts
npx jest app/challenge components/challenge hooks/__tests__/useCreateChallengeFlow.test.tsx \
  'app/(tabs)/__tests__/challengesTab.test.tsx'              # verde (2026-10-27)
```

## 6. Evidencia

Pruebas automatizadas de la sección 5. **No hay capturas ni resultados de usuarios.**

## 7. Pendientes, riesgos y dependencias

- **Validación con 3 personas ajenas al equipo (tarea 4): no hecha.** Protocolo propuesto, sin instrucciones previas:
  1. crear un reto de 7 días con un día de descanso;
  2. encontrar un reto público de Fuerza y unirse;
  3. solicitar unirse a uno privado.

  Anotar dónde se atoran y repetir la afirmación E-4 de la encuesta para compararla con el 2.50.
- **E-7** ("no supe cómo abandonar un reto") y **E-10** (colores) no son de B1 ni de B2; siguen sin asignar.
- Un commit ("cambios sprint 10") mezcla B1 con otros cambios: fondos, registro y `index.web.tsx`. Revertir solo B1 exige revertir por archivo.

## 8. Cómo revertir

`git revert 888cc04 522ff2d` revierte todo el bloque (y lo demás que venía en esos commits). Para revertir solo la card privada: `git revert` del commit "explorar dice solicitar en retos privados…" del 27/10.
