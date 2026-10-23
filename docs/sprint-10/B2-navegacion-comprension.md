# Sprint 10 · B2 — Correcciones Neurolab: navegación y comprensión

Responsable: Emily Góngora · Fecha objetivo: 19/10 · Estimación del plan: 5 SP / 12 h (estimación, no horas trabajadas).
Rama: `feature/sprint10-b2-b10` (frontend) y `feature/sprint10-b2-estado-foto` (backend), ambas desde `development`.

## 1. Resumen y criterio de aceptación

El perfil ahora tiene un engrane que abre **Configuración** (editar perfil, notificaciones, términos/privacidad/normas, acerca de, cerrar sesión y eliminar cuenta) y un botón visible **Editar perfil**. La hoja de lugar pregunta "¿Dónde vas a entrenar hoy?" y explica qué pasa con los ejercicios. Las insignias explican cómo se cuentan y "Reto completado" dice qué insignia dio (o cuántos retos faltan) con datos reales de `GET /badges/me`. El registro diario separa "día registrado" del **estado real de la foto** (en revisión / publicada / privada / rechazada), leído de la respuesta del servidor; la cuadrícula del perfil marca tus fotos en revisión o no publicadas. Los retos privados dicen "Solicitar unirme" en vez de "Unirse".

**Criterio de aceptación: cumplido parcialmente.** El criterio del plan de deuda técnica (informe del Sprint 9, p. 21) pide que cada mejora se implemente **y se revise contra el hallazgo que la originó**. Las cinco tareas de B2 están implementadas y tienen pruebas automatizadas, sin rediseño general (§5), y cada una está vinculada a su hallazgo en §9. Pero que el código y sus pruebas pasen no demuestra que el problema de usabilidad quedó resuelto. Falta: (a) **una nueva prueba con usuarios** para cada hallazgo vinculado (§9); (b) verificación visual en dispositivo o emulador; no hay capturas porque la app apunta al backend compartido y no ingresé credenciales reales; (c) desplegar el cambio de backend que expone el estado de moderación en la cuadrícula (el popup tras registrar ya funciona con la API actual). Además, varios hallazgos de Neurolab no forman parte de las tareas de B2 y siguen sin corrección en este bloque: crear retos, abandonar un reto y colores (§9.4).

## 2. Decisiones, alternativas descartadas y motivos

| Decisión | Alternativas descartadas | Motivo |
|---|---|---|
| Engrane (`settings-outline`) → nueva pantalla `app/profile/settings.tsx`; "Editar perfil" pasa a botón con texto bajo el encabezado (slot `actions` de `ProfileHeader`, el mismo que usa "Mensaje" en perfiles ajenos). | Mantener lápiz + engrane juntos; menú desplegable; rediseñar el perfil. | Dos íconos parecidos repetían la confusión; un botón con texto deja Editar perfil a un toque y es el patrón ya usado en la app. Sin rediseño. |
| Configuración solo **enlaza** pantallas existentes (`/profile/edit`, `/notification-settings`, `/(auth)/legal?doc=…`, `/profile/about`, `/profile/delete-account`). | Copiar formularios o ajustes dentro de Configuración. | Conserva las confirmaciones existentes: cierre de sesión con `ConfirmationPopup`; eliminación con su pantalla de contraseña. |
| Cerrar sesión y Eliminar cuenta salen de Editar perfil y quedan en Configuración; Cerrar sesión se mantiene en el estado de error de carga de Editar perfil. | Duplicarlos en ambas pantallas. | Un solo lugar para la sesión; la salida de emergencia cuando el perfil no carga sigue existiendo. |
| `SettingsRow` compartido; `LogoutButton` y `DeleteAccountRow` se reescriben sobre él. | Una fila nueva copiada para Configuración. | Las dos filas ya duplicaban la misma estructura; ahora todas las entradas se ven y comportan igual. |
| **Ayuda/FAQ (B9) no se enlaza.** | Enlace a una pantalla vacía o "próximamente". | No existe la pantalla ni rama/PR de B9 en el remoto (revisado el 22/10). Punto de integración documentado en el comentario de `app/profile/settings.tsx`: una fila más en la sección "Información legal". |
| Estado de la foto en el popup: se lee `posts[0].moderationStatus` y `visibility` de la respuesta de `POST /workout-logs/progress`. | Deducir "publicada" porque terminó la subida. | La API ya devuelve el post completo (la relación `posts` del `WorkoutLog`). Con `MODERATION_GATE_ENABLED = true`, un post nuevo nace `pending`. Si el campo falta, no se muestra nada. **Es una decisión del equipo** (tarea 4 del backlog del Sprint 10), no un hallazgo de Neurolab: el informe no menciona estados de la foto ni el popup (§9.3). |
| Estado de la foto en la cuadrícula: **cambio mínimo de backend**, `moderationStatus` en `ChallengePhoto` **solo para el autor**. | Exponerlo a todos; endpoint nuevo. | Era el único dato indispensable que faltaba (el backend lo leía pero no lo devolvía). Otros usuarios solo reciben posts aprobados y no deben conocer el estado ajeno. Ver `backend/docs/sprint-10/B2-estado-moderacion-fotos.md`. |
| Recompensa al terminar: se consulta `GET /badges/me` después de completar y se calcula "ganaste X" / "te faltan N" / "ya tienes todas" (`utils/challengeReward.ts`). | Prometer "ganaste una insignia" siempre; texto fijo. | Terminar un reto ≠ ganar insignia: solo hay insignias en 1 y 3 retos completados (`BADGE_CATALOG`). Si la consulta falla, no se promete nada. |
| Reglas de conteo por insignia en `BadgeDetailSheet` mediante un espejo `code → metric` en `constants/badges.ts`. | Pedir al backend un campo nuevo. | La API no envía `metric`; el espejo sigue el patrón ya existente de `BADGE_STYLES`. Un código desconocido no muestra regla. |
| "Solicitar unirme" + confirmación "¿Solicitar unirte?" para retos privados (nuevo tipo `requestJoin` en `useConfirmationPopup`). | Solo cambiar el texto del toast posterior. | El usuario se enteraba de que era una solicitud **después** de confirmar "Unirme". La llamada (`joinChallenge`) y su manejo no cambian. |
| Script `scripts/check-i18n-keys.js` que transpila `en.ts`/`es.ts` con el TypeScript del proyecto y compara las hojas por ruta. | Contar líneas; regex sobre el texto. | Los archivos difieren en líneas por comentarios y saltos; solo comparar objetos reales evita falsos positivos. Sin dependencias nuevas. |

## 3. Archivos creados o modificados (frontend)

| Ruta | Cambio |
|---|---|
| `app/profile/settings.tsx` (nuevo) | Pantalla Configuración con secciones Cuenta, Preferencias, Información legal y Sesión. |
| `components/profile/SettingsRow.tsx` (nuevo) | Fila de ajustes reutilizable (ícono, etiqueta, pista, chevron, tono `danger`). |
| `components/profile/LogoutButton.tsx`, `DeleteAccountRow.tsx` | Reescritos sobre `SettingsRow`; misma confirmación / misma navegación. |
| `app/(tabs)/profile.tsx` | Lápiz → engrane hacia Configuración; botón "Editar perfil" en el encabezado. |
| `app/_layout.tsx` | Registro de `profile/settings` sin header nativo. |
| `components/challenge/detail/LocationSwitchSheet.tsx` | Pista antes de elegir lugar y al elegir sustitutos. |
| `app/challenge/[id]/routine/[day].tsx` | Pista "¿Hoy entrenas en otro lugar?…"; botón/confirmación "Solicitar unirme" en retos privados. |
| `app/challenge/[id]/index.tsx` | Fila "Al terminarlo" (insignias de retos y cuándo se termina); "Solicitar unirme" en privados. |
| `hooks/useConfirmationPopup.tsx` | Tipo `requestJoin`. |
| `constants/badges.ts` | `getBadgeMetric(code)`: espejo de la métrica de cada insignia. |
| `components/badges/BadgeDetailSheet.tsx` | Línea con la regla de conteo. |
| `utils/challengeReward.ts` (nuevo) | Resultado real de terminar un reto para las insignias de retos. |
| `utils/photoModeration.ts` (nuevo) | Interpreta el estado de la foto desde la respuesta del servidor. |
| `utils/progressLoggedFeedback.ts` | Recibe el estado de la foto y consulta la recompensa al completar. |
| `store/uploadSuccessStore.ts`, `store/challengeFinishedStore.ts` | Campos `photo` y `reward`. |
| `components/ui/UploadSuccessPopup.tsx`, `ChallengeFinishedPopup.tsx` | Línea separada para la foto y la insignia. |
| `components/profile/PhotoGrid.tsx` | Etiqueta "En revisión" / "No publicada" en tus fotos. |
| `types/challenge.ts`, `types/workout-log.ts` | `PhotoModerationStatus`, `moderationStatus`, `posts[]`. |
| `i18n/resources/en.ts`, `es.ts` | Textos nuevos y glosario unificado (§8). |
| `scripts/check-i18n-keys.js` (nuevo), `package.json` | Script `npm run i18n:check`. |
| Pruebas nuevas | `app/profile/__tests__/settings.test.tsx`, `app/(tabs)/__tests__/profileSettingsEntry.test.tsx`, `components/challenge/detail/__tests__/LocationSwitchSheet.test.tsx`, `components/profile/__tests__/PhotoGridStatus.test.tsx`, `components/ui/__tests__/progressFeedbackPopups.test.tsx`, `hooks/__tests__/useConfirmationPopup.test.tsx`, `utils/__tests__/photoModeration.test.ts`, `utils/__tests__/challengeReward.test.ts`. |
| Pruebas ampliadas/actualizadas | `utils/__tests__/progressLoggedFeedback.test.ts` (4 casos B2 + mock de badges), `components/badges/__tests__/BadgesSection.test.tsx` (reglas), `app/challenge/__tests__/challengeInfoAdmin.test.tsx` y `routineDayMembership.test.tsx` (etiquetas de solicitud en privados: cambio intencional de texto). |

El hook `usePhotoProgressSubmit` que entrega el estado de la foto al popup se documenta en B10 (es parte de la refactorización de la cámara).

## 4. Base de datos, entorno, configuración e infraestructura

- **Base de datos:** sin cambios ni migraciones (`moderation_status` ya existe).
- **Variables de entorno / infraestructura:** ninguna.
- **Backend:** un campo opcional nuevo en la respuesta de fotos (solo para el autor). Paso manual: desplegar el backend para que la cuadrícula muestre los estados; hasta entonces el frontend simplemente no muestra etiqueta.
- **Configuración:** `package.json` → script `i18n:check`.

## 5. Verificación

| Comando (en `frontend/`) | Resultado |
|---|---|
| `npm run typecheck` | Sin errores (exit 0). |
| `npm run i18n:check` | `en.ts: 1128 keys (1416 lines)` · `es.ts: 1128 keys (1380 lines)` · 0 faltantes · 0 sobrantes · 0 vacías · OK. |
| `npx jest` (suite completa, con cobertura) | **173/173 suites, 2,070/2,070 pruebas aprobadas.** |
| `npx jest app/profile app/(tabs)/__tests__/profileSettingsEntry.test.tsx components/profile components/ui components/badges components/challenge/detail hooks/__tests__/useConfirmationPopup.test.tsx utils app/challenge` | Todas aprobadas (subconjunto B2 durante el desarrollo). |
| Backend: `npx jest` · `npm run build` | 60 suites aprobadas (2 omitidas ya existentes), 1,032 pruebas aprobadas, 4 omitidas; build OK. |

Pruebas nuevas de B2 (qué fijan): rutas de cada fila de Configuración y la confirmación de cierre de sesión; engrane → Configuración y botón Editar perfil; pistas de la hoja de lugar; etiquetas de estado en la cuadrícula (y ninguna para aprobadas o ajenas); popups con línea de foto separada, sin línea en día de descanso y con insignia real; `requestJoin`; estado de foto desde la respuesta (null si no viene, nunca "publicada" por suposición); recompensa: 1.º reto gana insignia, 2.º "te falta 1", ≥3 "ya tienes todas", 0 o lista vacía no promete nada.

Avisos de consola observados y ya existentes antes del cambio (verificado contra `HEAD`): "overlapping act()" en `cameraDoubleTap` y `restDayDoubleTap` (3 cada uno) y "not configured to support act" en `BadgesSection`.

## 6. Evidencias, capturas, logs y métricas

- Resultado del script de claves: §5 y §9.
- Logs sanitizados de la corrida completa: guardados fuera del repo (scratchpad de la sesión); los números relevantes están en este documento y en B10.
- **Capturas: no disponibles.** No se ejecutó la app en emulador/dispositivo: usa el backend compartido y requiere iniciar sesión con una cuenta real. Pendiente para B12 tomar capturas de: perfil (engrane + botón), Configuración, hoja de lugar, detalle de insignia, popup "¡Registrado!" con foto en revisión, "Reto completado" con insignia, ficha de reto privado.

## 7. Pendientes, riesgos y dependencias

- **Informe de Neurolab:** no está en `frontend/`, `backend/` ni `raiz/`. La fuente se tomó del documento del Sprint 9 que compartió el equipo (§9.1). El PDF no se versiona en el repositorio.
- **Validación con usuarios pendiente:** hay que repetir con usuarios las tareas de §9.5. El informe no trae tiempos, tasas de éxito ni métricas de fijación, así que no hay una línea base numérica del laboratorio para comparar; la comparación posible es contra la encuesta (§9.2).
- **B9 (Camila) — Ayuda/FAQ:** sin pantalla ni rama. Cuando exista, agregar una `SettingsRow` en la sección "Información legal" de `app/profile/settings.tsx` y una prueba en `settings.test.tsx`.
- **Despliegue del backend** para ver estados en la cuadrícula (§4).
- **Riesgo bajo de conflicto** en `app/challenge/[id]/index.tsx` y `[day].tsx` (trabajo reciente de otros bloques): cambios acotados a una fila de `infoRows`, la etiqueta del botón y una pista.
- La fila "Al terminarlo" menciona "1 y 3 retos": si cambia `BADGE_CATALOG`, hay que actualizar ese texto (el popup sí se calcula con datos reales).
- La racha (`streak_7_days`) es la racha **actual**: el texto lo dice ("si la rompes, vuelve a empezar"), según `docs/BADGES-RECOMPENSAS.md`.

## 8. Glosario final

| Concepto | Español | English | Dónde |
|---|---|---|---|
| Entidad | reto (nunca "desafío" en la app) | challenge | todas las pantallas |
| Unirse a reto público (botón) | Unirme al reto / Unirme (tarjeta) | Join challenge / Join | ficha, día de rutina, tarjeta Explorar |
| Confirmación (público) | ¿Unirte a este reto? → Unirme | Join this challenge? → Join | `useConfirmationPopup` |
| Unirse a reto/espacio privado (botón) | Solicitar unirme | Request to join | ficha, día de rutina, espacios |
| Confirmación (privado) | ¿Solicitar unirte? → Enviar solicitud | Request to join? → Send request | `useConfirmationPopup` (`requestJoin`) |
| Estado pendiente | Solicitud enviada | Request sent | retos y espacios (antes "Solicitud pendiente"/"Request pending" en espacios) |
| Lugar | lugar de entrenamiento; "¿Dónde vas a entrenar hoy?" | training place; "Where are you training today?" | hoja y día de rutina (antes "ubicación") |
| Registro del día | registrado / quedó registrado | logged | popups |
| Estado de la foto | en revisión · publicada · privada · no publicada (rechazada) | in review · published · private · not published | popup y cuadrícula |
| Recompensa | insignia | badge | perfil, popup, ficha |
| Configuración | Configuración | Settings | perfil |

Mayúsculas: estilo oración en botones y títulos ("Join challenge", antes "Join Challenge"). Los nombres de documentos legales conservan mayúscula inicial por ser títulos.

## 9. Trazabilidad con Neurolab

### 9.1 Fuente

- **Documento:** «SPRINT 9 (2).pdf» (entregable del Sprint 9; compartido por el equipo, no versionado en el repositorio).
- **Sección:** «Resultados de las Pruebas de Experiencia de Usuario», **pp. 10–12**. El mapa de calor está en la p. 12.
- **Sesión:** 8 de octubre de 2026, según el Sprint Backlog del Sprint 9 (tarea B9 de **ese** sprint, p. 6). No se debe confundir con B9 del Sprint 10 (Ayuda/FAQ, de Camila).
- **Método:** eye tracking y una encuesta posterior. La encuesta tuvo 4 participantes (3 con actividad física moderada y 1 con actividad baja; 2 ya habían usado apps de fitness). Escala de 1 = totalmente en desacuerdo a 5 = totalmente de acuerdo. El informe no indica por separado cuántas personas hicieron eye tracking.
- **Estado al cierre del Sprint 9:** pruebas realizadas y analizadas; correcciones pendientes; usabilidad «parcialmente cumplida» (p. 16); FAQ y ayuda por definir junto con estas correcciones (p. 17); correcciones de Neurolab con prioridad 3 en el plan de deuda técnica y criterio «cada mejora debe implementarse y revisarse contra el hallazgo que la originó» (p. 21).
- **Datos que el informe no publica:** tiempos de ejecución, tasas de éxito, porcentajes o métricas de fijación, datos individuales completos ni resultados posteriores a las correcciones. Este documento tampoco los reporta.

**Tipo de relación:** *directa* = el hallazgo nombra el mismo elemento o pregunta que se corrigió; *inferida* = la corrección es una interpretación del equipo sobre un hallazgo más general. **Estado actual** se separa en tres niveles: implementado (código en la rama), pruebas automatizadas (Jest) y validación con usuarios. Esta última no se hizo para ninguna corrección.

### 9.2 Hallazgos del laboratorio (observación y eye tracking)

| ID | Hallazgo | Evidencia | Página | Corrección relacionada (B2) | Relación | Estado actual | Validación pendiente |
|---|---|---|---|---|---|---|---|
| L-A | Crear challenges fue de las tareas más difíciles y largas; con los botones visibles, algunos no terminaron a tiempo. | Observación en laboratorio | 10–12 | **Ninguna.** No es una tarea de B2 en el backlog del Sprint 10. | — | No abordado en B2. Otro integrante modificó el flujo de creación en `888cc04`; no lo verifiqué contra este hallazgo. | Repetir «crear un reto» con usuarios después de las correcciones de ese flujo. |
| L-B | Explorar challenges y luego unirse fue de las tareas más difíciles y lentas. | Observación en laboratorio | 10–12 | Botón y confirmación «Solicitar unirme» / «Enviar solicitud» en retos privados; confirmación «¿Unirte a este reto?» en públicos (`useConfirmationPopup`, `[id]/index.tsx`, `[day].tsx`). | Inferida: el informe no dice en qué paso fallaba el recorrido. Solo cubre el último paso (confirmar) y no el de explorar. | Implementado. Pruebas: `useConfirmationPopup.test.tsx`, `challengeInfoAdmin.test.tsx`, `routineDayMembership.test.tsx`. | Repetir «explorar y unirse a un reto» de principio a fin (público y privado) con usuarios. |
| L-C | La mirada de la mayoría se concentró en la parte superior, donde también estaban las opciones de las tareas problemáticas. | Análisis de videos y mapa de calor (sin cifras) | 10–12 (mapa de calor: p. 12) | **Ninguna específica.** No se movió nada de lugar: según el informe, las opciones ya estaban arriba. El engrane sigue en la barra superior. | — | No abordado como cambio de jerarquía visual. | Si se repite el eye tracking, revisar si las acciones de arriba (engrane, «Editar perfil») se reconocen ahora. |
| L-D | En la tarea de cerrar sesión y hacer el onboarding, los participantes se confundieron porque la configuración de la cuenta estaba representada con un lápiz. | Observación en laboratorio | 10–12 | Engrane (`settings-outline`) que abre Configuración (cerrar sesión, eliminar cuenta, notificaciones, legal, acerca de) y botón con texto «Editar perfil» (`app/profile/settings.tsx`, `app/(tabs)/profile.tsx`, `SettingsRow`). | **Directa** | Implementado. Pruebas: `settings.test.tsx`, `profileSettingsEntry.test.tsx`. | Repetir «cerrar sesión desde el perfil» con usuarios y comprobar que se encuentra sin pasar por Editar perfil. |

### 9.3 Resultados de la encuesta (4 participantes)

| ID | Afirmación | Promedio / 5 | Observación del informe | Página | Corrección relacionada (B2) | Relación | Estado actual | Validación pendiente |
|---|---|---:|---|---|---|---|---|---|
| E-1 | Fue fácil comprender cómo crear una cuenta | 4.75 | El resultado más alto. | 10–12 | Ninguna | — | Sin acción (no hace falta). | — |
| E-2 | Comprendí rápidamente la información de Home | 4.00 | Sin observaciones negativas. | 10–12 | Ninguna | — | Sin acción. | — |
| E-3 | Fue fácil encontrar los retos disponibles | 4.25 | Contrasta con L-B: encontrar retos no es lo mismo que completar «explorar y unirse». | 10–12 | Ninguna (ver L-B para unirse). | — | Sin acción en B2. | Comparar con la tarea L-B en la nueva prueba. |
| E-4 | Comprendí cómo crear un reto | 2.50 | El más bajo; los 4 participantes puntuaron 3 o menos. | 10–12 | **Ninguna.** No es una tarea de B2. | — | No abordado en B2 (ver L-A). | Repetir la afirmación en una nueva encuesta. |
| E-5 | Fue fácil registrar mi progreso | 4.00 | Un participante puntuó 1. | 10–12 | Popup «¡Registrado!» que separa el día registrado del estado real de la foto (en revisión, publicada, privada o no publicada) y etiquetas en la cuadrícula (`utils/photoModeration.ts`, popups, `PhotoGrid.tsx`, backend). | **Inferida.** Es una interpretación del equipo (tarea 4 del backlog del Sprint 10). El informe **no** menciona estados de la foto, ni confusión entre registrar y publicar, ni el popup, y no explica por qué ese participante puntuó 1. | Implementado. Pruebas: `photoModeration.test.ts`, `progressFeedbackPopups.test.tsx`, `PhotoGridStatus.test.tsx`, `usePhotoProgressSubmit.test.tsx` y el spec del backend. | Preguntar en la nueva prueba qué dificultó registrar el progreso, antes de atribuirlo a la foto. |
| E-6 | Comprendí cómo seleccionar una rutina alternativa según el lugar | 3.75 | Un participante puntuó 1. | 10–12 | «¿Dónde vas a entrenar hoy?», explicación de qué pasa con los ejercicios y de que solo cambia tu entrenamiento; pista en el día de rutina; «lugar» en vez de «ubicación» (`LocationSwitchSheet.tsx`, `[day].tsx`, i18n). | **Directa:** la afirmación nombra esta función. | Implementado. Pruebas: `LocationSwitchSheet.test.tsx`; `useLocationSwitch.test.tsx` confirma que la lógica no cambió. | Repetir «cambiar de lugar y elegir alternativa» con usuarios. |
| E-7 | Fue fácil encontrar la opción para abandonar un reto | 4.00 | Un participante puntuó 2 y comentó que no supo cómo abandonar un reto. | 10–12 | **Ninguna.** No es una tarea de B2. | — | No abordado en B2. | Pendiente de asignar y luego validar con usuarios. |
| E-8 | Comprendí que el reto había finalizado y cuál era mi recompensa | 4.00 | Un participante puntuó 2. | 10–12 | Fila «Al terminarlo» en la ficha del reto; regla de conteo en cada insignia; «Reto completado» dice la insignia real o cuántos retos faltan (`[id]/index.tsx`, `BadgeDetailSheet.tsx`, `utils/challengeReward.ts`, `ChallengeFinishedPopup.tsx`). | **Directa:** la afirmación nombra la finalización y la recompensa. | Implementado. Pruebas: `challengeReward.test.ts`, `BadgesSection.test.tsx`, `progressFeedbackPopups.test.tsx`, `progressLoggedFeedback.test.ts`. | Terminar un reto con usuarios y preguntar qué obtuvieron. |
| E-9 | Los botones indican claramente qué acción realizan | 3.75 | Un participante puntuó 2. | 10–12 | «Solicitar unirme» en retos privados (antes decía «Unirse» y enviaba una solicitud); «Editar perfil» como botón con texto; mayúscula inicial uniforme; glosario §8. | **Inferida:** el informe no dice qué botones confundieron. | Implementado. Pruebas: `useConfirmationPopup.test.tsx`, `profileSettingsEntry.test.tsx`; `npm run i18n:check`. | Repetir la afirmación en una nueva encuesta. |
| E-10 | Los colores ayudaron a identificar las acciones importantes | 3.75 | Un participante puntuó 1 y comentó que los colores no ayudaban en ese momento. | 10–12 | **Ninguna.** No se cambiaron colores. | — | No abordado en B2. | Pendiente de asignar. |
| E-11 | La aplicación me pareció visualmente atractiva | 4.00 | Sin observaciones negativas. | 10–12 | Ninguna | — | Sin acción. | — |
| E-12 | La aplicación me motivaría a seguir usando retos y rutinas | 4.00 | Un participante puntuó 3. | 10–12 | Ninguna directa. | — | Sin acción. | — |

### 9.4 Tareas de B2 (Sprint 10) y su origen

| Tarea del backlog del Sprint 10 | Origen en Neurolab |
|---|---|
| 1. Configuración | L-D (directa) |
| 2. Lugar de entrenamiento | E-6 (directa) |
| 3. Recompensas | E-8 (directa) |
| 4. Registro diario y fotografías | E-5 (**inferida**; los estados de la foto son una decisión del equipo, no un hallazgo) |
| 5. Consistencia de textos | E-9 y L-B (inferidas) |

Hallazgos de Neurolab que **no cubre** ninguna tarea de B2: L-A y E-4 (crear retos), L-C (atención visual), E-7 (abandonar un reto) y E-10 (colores).

### 9.5 Validación pendiente con usuarios

Ninguna corrección se validó con usuarios. Propuesta para la siguiente sesión: repetir con participantes las tareas de cerrar sesión desde el perfil (L-D), cambiar de lugar y elegir alternativa (E-6), terminar un reto e identificar la recompensa (E-8), registrar el progreso de un día con foto (E-5) y explorar y unirse a un reto público y a uno privado (L-B), y volver a aplicar la misma encuesta de 12 afirmaciones para comparar. Hasta entonces, B2 queda en «implementado y probado automáticamente», no en «problema de usabilidad resuelto».

## 10. Resultado del script de claves español/inglés

```text
$ npm run i18n:check            # después de B2
en.ts: 1128 keys (1416 lines)
es.ts: 1128 keys (1380 lines)
Missing in es.ts (extra in en.ts): 0
Missing in en.ts (extra in es.ts): 0
Empty values: 0
OK: both files have the same keys.
```

Antes de B2 (commit base `522ff2d`): 1095 claves en cada archivo, 0 diferencias, con 1364 y 1328 líneas. La diferencia de ~36 líneas se debe a comentarios y saltos de línea, no a claves.

## 11. Cómo revertir

- Frontend: `git revert <hash>` de cada commit B2 de la tabla final (en orden inverso) o cerrar el PR sin fusionar. Ningún dato persistente depende de estos cambios.
- Backend: `git revert` del commit de `feature/sprint10-b2-estado-foto`; el frontend tolera la ausencia de `moderationStatus` (no muestra etiqueta).
