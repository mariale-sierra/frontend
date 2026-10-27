# B9 — Accesibilidad, ayuda y consistencia visual (Sprint 10)

Responsable del bloque: Camila Sandoval. Este documento reúne lo de B9, que estaba repartido entre el commit de la FAQ (`7e3f588`, 25/10), el de accesibilidad (25/10) y `accesibilidad-basica.md`. Se escribió el 2026-10-27; ese día también se agregó la pregunta sobre retos privados, una vez que B11 tomó la decisión.

## 1. Resumen y criterio de aceptación

| Tarea | Estado | Evidencia |
|---|---|---|
| Ayuda y FAQ | ✅ | `app/profile/help.tsx`, abierta desde Configuración (`app/profile/settings.tsx`, fila "Ayuda y preguntas frecuentes"). 4 secciones y 16 preguntas en es/en (15 hasta el 25/10). `__tests__/help.test.tsx` comprueba que ambos idiomas tienen todas las preguntas. |
| Consistencia visual | ✅ en código | Botón secundario sin contorno, insignias del perfil y filtros, card de Explorar con foto y estados vacíos con ilustración y skeletons. Todo con tokens de `constants/theme.ts` (commits del 25 y 26/10). |
| Accesibilidad básica | ✅ en código / ⏳ en dispositivo | Detalle en `accesibilidad-basica.md`: contraste WCAG, áreas táctiles de 44 pt y 26 botones de ícono etiquetados. **Falta la pasada con VoiceOver/TalkBack.** |
| Flujo del primer reto | ⏳ **no hecho** | No se hizo la prueba con una cuenta nueva y sin ayuda. |

**Criterio:** *"ayuda accesible desde la aplicación y correcciones de usabilidad verificables"*.

**Estado: PARCIAL.**
- La ayuda está y es accesible.
- Las correcciones se pueden verificar en código y con pruebas automáticas.
- Faltan las dos verificaciones manuales: lector de pantalla y primer reto.

## 2. Contenido de la FAQ

Las claves están en `help.sections.<sección>.items.<pregunta>` de `i18n/resources/{es,en}.ts`.

| Sección | Preguntas |
|---|---|
| Retos | ¿Cómo me uno a un reto? · **¿Qué veo de un reto privado antes de entrar?** (nueva, 27/10) · ¿Qué pasa si salgo de un reto? · ¿Cuándo se termina un reto? · ¿Puedo entrenar en otro lugar ese día? |
| Progreso | ¿Cómo registro mi progreso del día? · ¿Cómo funcionan los días de descanso? · ¿Cómo se cuenta mi racha? · ¿Cómo consigo insignias? |
| Privacidad | ¿Quién ve mis fotos? · ¿Qué hace el perfil privado? · ¿Cómo elimino mi cuenta? |
| Publicaciones | ¿Por qué mi foto dice "En revisión"? · ¿Cómo reporto una publicación o un comentario? · ¿Puedo eliminar una publicación? · ¿Qué pasa si mi contenido incumple las normas? |

La pregunta sobre retos privados repite la decisión de B11: se ven nombre, foto, duración, participantes y días de descanso, y la rutina solo la ven los miembros. El backend lo aplica desde el 27/10 (`backend/docs/sprint-10/B11-B12-cambios-de-codigo.md`). Antes de esa decisión el PDF pedía no afirmar nada sobre ese punto.

## 3. Contraste (resumen)

La tabla completa está en `accesibilidad-basica.md` §2.

| Par | Contraste | Mínimo | Resultado |
|---|---|---|---|
| `paper` primary (85 %) sobre `ink` | 14.51 | 4.5 | OK |
| `paper` secondary (55 %) sobre `ink` / `surface` | 6.27 / 6.09 | 4.5 | OK |
| `paper` tertiary (30 %) sobre `ink` / `surface` | 2.54 / 2.70 | 3 | **Falla** → sus 10 usos con información pasaron a `secondary` |
| Colores de actividad ↔ `ink` | 9.06–15.91 | 4.5 | OK |
| Botón principal (`ink` sobre `primary`) | 17.99 | 4.5 | OK |

## 4. Controles corregidos

- `IconButton` garantiza un área táctil de 44 sin cambiar su tamaño visual, se anuncia siempre como botón y anuncia cuando está deshabilitado.
- 26 botones de solo ícono, más `BackButton`, recibieron `accessibilityLabel`.

La lista por archivo está en `accesibilidad-basica.md` §4.

## 5. Decisiones

- La FAQ cuelga de **Configuración** (B2) y no de una pestaña propia, como pedía el PDF. Así queda a un toque del engrane que Neurolab señaló (L-D).
- Respuestas cortas, tocar para expandir. No contradicen `legalDocs.ts`, que se revisó contra el plazo de 7 días y los correos de contacto del 27/10.

## 6. Cómo se probó

```bash
npm run typecheck
npm run i18n:check                                  # OK: mismas claves en en.ts y es.ts
npx jest app/profile/__tests__/help.test.tsx        # 4/4 (27/10, con la pregunta nueva)
```

## 7. Pendientes

1. **VoiceOver (iOS) y TalkBack (Android)** en Inicio, Retos y Perfil, en un dispositivo.
2. **Prueba del primer reto:** con una cuenta nueva y sin ayuda, encontrar un reto, unirse y registrar el progreso de un día. Anotar los bloqueos, arreglar los chicos y dejar los grandes en el backlog.
3. Comparar los resultados con E-3, E-5 y E-9 de Neurolab (ver `B2-navegacion-comprension.md` §9).

## 8. Cómo revertir

- FAQ: `git revert 7e3f588` y del commit de la pregunta de retos privados.
- Accesibilidad: `git revert` del commit "revisa la accesibilidad basica…" (25/10). Sus riesgos aceptados están en `accesibilidad-basica.md` §5.
