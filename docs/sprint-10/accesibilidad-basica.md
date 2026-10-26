# Sprint 10 — Revisión de accesibilidad básica (app)

Fecha: 2026-10-26 · Rama: `development` · Repositorio: `frontend`

## 1. Resumen y criterio de aceptación

La tarea pide comprobar **contraste, legibilidad, tamaños táctiles y etiquetas accesibles de los controles importantes**. Se revisó toda la app (`app/` y `components/`) contra WCAG 2.1 AA, el mínimo táctil de Apple (44 pt) y las etiquetas para VoiceOver/TalkBack, y se corrigió lo que fallaba.

| Punto | Antes | Después |
|---|---|---|
| Contraste | El tono de texto `tertiary` (30 %) daba 2.5:1 y se usaba en 10 lugares con información o en controles | Esos 10 lugares pasan a `secondary` (6.3:1). Lo decorativo se queda igual |
| Legibilidad | Escala tipográfica desde 12 px; nada bloquea el tamaño de letra del sistema | Sin cambios (ya cumple) |
| Tamaños táctiles | Unos 20 `IconButton` medían 28–40 sin `hitSlop` | `IconButton` garantiza un área táctil de 44 sin cambiar su tamaño visual |
| Etiquetas | 26 botones de solo ícono sin `accessibilityLabel`, más `BackButton` en todas las pantallas (el lector decía solo "botón") | Todos etiquetados; `IconButton` siempre se anuncia como botón y anuncia si está deshabilitado |

**Criterio de aceptación: cumplido para la revisión automática y de código.** Typecheck sin errores, `i18n:check` OK y 2,204/2,204 pruebas aprobadas, incluidas 5 nuevas de accesibilidad. **Falta** una pasada manual con VoiceOver (iOS) y TalkBack (Android) en dispositivo (§6).

## 2. Contraste

Se calculó la razón de contraste WCAG de cada combinación de texto y fondo del tema (`constants/theme.ts`), mezclando la opacidad del texto con el fondo real. AA pide **4.5:1** para texto normal y **3:1** para texto grande y para controles o íconos con significado.

| Combinación | Contraste | Mínimo | Resultado |
|---|---|---|---|
| Texto `paper` primary (85 %) sobre `ink` | 14.51 | 4.5 | OK |
| Texto `paper` secondary (55 %) sobre `ink` | 6.27 | 4.5 | OK |
| Texto `paper` secondary (55 %) sobre `surface` | 6.09 | 4.5 | OK |
| Texto `paper` tertiary (30 %) sobre `ink` | 2.54 | 3 | **Falla** |
| Texto `paper` tertiary (30 %) sobre `surface` | 2.70 | 3 | **Falla** |
| Los 6 colores de actividad como texto o ícono sobre `ink` | 9.06–15.91 | 4.5 | OK |
| Texto `ink` sobre los 6 colores de actividad (pills rellenos) | 9.06–15.91 | 4.5 | OK |
| Texto `error` sobre `ink` / `surface` | 5.37 / 4.71 | 4.5 | OK |
| Botón principal (`ink` sobre `primary`) | 17.99 | 4.5 | OK |
| Botón `outline` nuevo (`paper` sobre `surface`) | 17.79 | 4.5 | OK |
| Borde del botón `outline` (`surface` contra `ink`) | 1.14 | 3 | Aceptado (§5) |
| Placeholder gris de la foto del reto | 1.44 | 3 | Exento (decorativo) |

**Corregido:** `tertiary` es para estados deshabilitados, placeholders e íconos decorativos (los estados deshabilitados y la decoración están exentos en WCAG). Estos usos llevaban información o eran controles, así que pasan a `secondary`:

| Archivo | Qué es |
|---|---|
| `app/notification-settings.tsx` | Aviso de que una notificación no se puede desactivar |
| `app/profile/moderation.tsx` | "Contenido eliminado" en la cola de moderación |
| `components/challenge/create/CycleCalendarPreview.tsx` | Encabezados de los días de la semana |
| `components/challenge/progress/ChallengeWorkoutCalendar.tsx` | Números de los días futuros |
| `components/ui/input.tsx`, `components/routine/metrics/exerciseInput.tsx`, `restTimeInput.tsx` | Placeholders de campos |
| `components/invites/InviteCard.tsx` | Estado "cancelada" / "expirada" |
| `components/home/CommentRow.tsx` | Ícono de reportar comentario (control) |
| `components/challenge/create/CycleDayList.tsx` | Ícono × para quitar un día (control) |
| `components/ui/segmentedIconToggle.tsx` | Ícono de la opción no seleccionada (control) |

Los demás usos de `tertiary` (unos 40) son íconos de estados vacíos, flechas de filas, indicadores de carga y separadores, todos decorativos, así que se dejaron como están.

## 3. Legibilidad

- La escala tipográfica (`fontSize`) va de 12 a 30 px, con interlineado propio en cada tamaño. Ningún texto de la app usa menos de 12, salvo las etiquetas de la barra de navegación (11), que es el tamaño estándar de Apple para barras de pestañas y siempre van junto a un ícono.
- Ningún componente desactiva `allowFontScaling` ni limita `maxFontSizeMultiplier`, así que el tamaño de letra del sistema (Ajustes → Pantalla → Tamaño del texto) se respeta en toda la app.
- Textos que se ponen sobre fotos (los íconos del encabezado de la info del reto, "N liked this" en el feed) llevan sombra oscura para que se lean sobre fotos claras.

## 4. Tamaños táctiles y etiquetas

**`components/ui/iconButton.tsx`** (la base de casi todos los botones de solo ícono):

- Si el botón mide menos de `MIN_TOUCH_TARGET` (44), agrega el `hitSlop` que le falta. Por ejemplo, un botón de 32 recibe 6 de cada lado. El tamaño visual no cambia. Un `hitSlop` explícito se respeta.
- `accessibilityRole="button"` siempre, y `accessibilityState.disabled` cuando está deshabilitado.

**`components/ui/backButton.tsx`:** se lee "Atrás" / "Back" (`common.actions.back`) por defecto en todas las pantallas que lo usan.

**Etiquetas agregadas** (textos nuevos en `common.a11y`, en y es):

| Control | Archivo | Se lee |
|---|---|---|
| Regresar (×2), cambiar de cámara, usar esta foto | `app/(add)/camera.tsx` | "Atrás", "Cambiar de cámara", "Usar esta foto" |
| Regresar | `app/(add)/metrics.tsx`, `app/(auth)/login.tsx`, `app/(auth)/register.tsx`, `app/challenge/routine/select.tsx`, `components/exercises/muscleFilterSheet.tsx` | "Atrás" |
| Regresar / cerrar | `app/challenge/routine/create.tsx` | "Atrás" o "Cerrar", según el ícono |
| Mensajes (Home) | `app/(tabs)/index.tsx` | "Mensajes" |
| Enviar | `app/messaging/[conversationId].tsx`, `app/messaging/spaces/[id]/index.tsx`, `components/home/CommentsSheet.tsx` | "Enviar" |
| Mes anterior / siguiente | `components/challenge/progress/ChallengeWorkoutCalendar.tsx` | "Mes anterior", "Mes siguiente" |
| − / + de los steppers | `components/routine/builder/valueStepper.tsx`, `components/add/setTargetStepper.tsx` | "Disminuir Series" / "Aumentar Series", y el valor actual |
| Quitar día | `components/challenge/create/CycleDayList.tsx` | "Quitar el día 3" |
| Eliminar comentario | `components/home/CommentRow.tsx` | "Eliminar comentario" |
| Abrir rutina | `components/routine/builder/routinePickerCard.tsx` | "Abrir rutina" |
| Foto del mosaico | `components/challenge/progress/ChallengePhotoMosaicSkeleton.tsx` | "Abrir foto" (rol imagen-botón) |
| Cerrar aviso | `components/ui/errorNotification.tsx` | "Descartar" |
| Limpiar búsqueda | `components/ui/searchBar.tsx` | "Borrar búsqueda" |

**Cómo se buscó:** dos escaneos del código, uno para `Pressable` que solo contienen un ícono, sin texto ni etiqueta, y otro para cada `<IconButton>` sin `accessibilityLabel`. Después de las correcciones, los dos quedan en cero, salvo el propio `IconButton` (la etiqueta le llega por props).

## 5. Decisiones y riesgos aceptados

| Decisión | Alternativa descartada | Motivo |
|---|---|---|
| Corregir el área táctil en `IconButton` con `hitSlop` | Agrandar cada botón | No cambia el diseño y arregla todos los casos (y los futuros) en un solo lugar |
| Pasar a `secondary` solo los usos con información o que son controles | Subir el token `tertiary` para toda la app | Subir el token aclararía ~40 íconos decorativos sin necesidad; WCAG no exige contraste en decoración ni en estados deshabilitados |
| El borde del botón `outline` (1.14:1) se acepta | Volver a ponerle contorno | Fue un pedido explícito de diseño (fondo `surface` sin borde). El botón se identifica por su texto (17.8:1), que sí cumple |
| Barra de navegación con etiquetas de 11 px | Subirlas a 12 | Es el estándar de Apple para barras de pestañas y van con ícono |
| Mínimo táctil de 44 (Apple) | 48 (Material) | El diseño parte de iOS; 44 cubre la gran mayoría de los casos en Android |

## 6. Pendiente

- **Prueba manual con lector de pantalla** en dispositivo: recorrer Home, Retos, Crear reto, Cámara y Perfil con VoiceOver y TalkBack, y revisar el orden de lectura y que no haya elementos duplicados.
- **Tamaño de letra grande del sistema:** abrir las pantallas con texto al máximo y revisar que las cards de altura fija (Mis retos, Explorar) no corten texto.
- Los formularios usan campos con etiqueta flotante; confirmar en dispositivo que el lector lee la etiqueta del campo y no solo el valor.

## 7. Verificación

| Comando | Resultado |
|---|---|
| `npm run typecheck` | Sin errores |
| `npm run i18n:check` | OK, mismas claves en en/es |
| `npx jest` | 184/184 suites, 2,204 pruebas aprobadas, 0 fallos |
| Pruebas nuevas: `components/ui/__tests__/iconButton.test.tsx` | 5/5: rol y etiqueta, `hitSlop` hasta 44, sin `hitSlop` en botones grandes, `hitSlop` explícito respetado, estado deshabilitado, "Atrás" por defecto |
