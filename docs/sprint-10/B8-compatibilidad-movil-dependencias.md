# B8 — Compatibilidad móvil y dependencias (app)

Fecha: 2026-10-25 · Rama: `development` · Repositorio: `frontend`

## 1. Resumen y criterio de aceptación

B8 pide dejar la app al día con Expo SDK 57, resolver las vulnerabilidades de
dependencias, verificar la configuración nativa de Android e iOS, y validar la app en
dispositivos físicos.

Lo que **sí** está terminado y verificado en este entorno: las dependencias, la
auditoría de vulnerabilidades y la configuración nativa de ambas plataformas.

Lo que **no** puede cerrarse aquí: la evidencia en dispositivo físico. El criterio de
aceptación de B8 ("evidencia real en Android e iOS, sin depender solo de Expo Go")
**no se cumple todavía**. La sección 9 explica exactamente qué falta y por qué.

Cada afirmación de este documento distingue tres cosas que no son lo mismo:

- **medido** — ejecutado aquí, con la salida pegada o reproducible con el comando dado;
- **derivado de configuración** — leído del proyecto nativo generado, no ejecutado;
- **pendiente** — requiere un dispositivo, una cuenta o una herramienta que no hay.

## 2. Dependencias actualizadas

`npx expo install --check` marcaba 10 paquetes desalineados del SDK instalado. Todos
eran versiones de parche dentro de SDK 57: **no hay salto de SDK**.

| Paquete | Antes | Después |
| --- | --- | --- |
| `expo` | 57.0.24 | 57.0.31 |
| `expo-camera` | 57.0.5 | 57.0.6 |
| `expo-glass-effect` | 57.0.3 | 57.0.4 |
| `expo-image-picker` | 57.0.19 | 57.0.20 |
| `expo-linking` | 57.0.10 | 57.0.13 |
| `expo-notifications` | 57.0.21 | 57.0.24 |
| `expo-router` | 57.0.22 | 57.0.29 |
| `expo-splash-screen` | 57.0.9 | 57.0.10 |
| `jest-expo` | 57.0.5 | 57.0.6 |
| `expo-constants` | 57.0.19 | 57.0.22 (ya permitido por `~57.0.17`) |
| `zod` | 4.5.4 | **4.6.7** (corrige GHSA-mrhx-c7xc-m3w5) |

Transitivas corregidas **sin `overrides`**, porque la versión parcheada ya entraba en el
rango semver que declara quien las consume:

| Paquete | Antes | Después | Severidad |
| --- | --- | --- | --- |
| `shell-quote` | 1.10.0 | 1.12.0 | **crítica** |
| `follow-redirects` | 1.16.0 | 1.16.1 | alta |
| `source-map-js` | 1.2.1 | 1.2.2 | alta |
| `brace-expansion` | 1.1.18 / 5.0.9 | 1.1.21 / 5.0.12 | alta |
| `xcode` → `uuid` | 3.0.1 → 7.0.3 | 4.0.0 → sin uuid vulnerable | moderada |

`xcode`/`uuid` se resolvieron solos: el parche de `expo` arrastra
`@expo/config-plugins` 57.0.11. **No hizo falta ningún override.**

No se ejecutó `npm audit fix --force`: propone `expo@54.0.38`, que es un *downgrade*
mayor de SDK.

**Medido** · `npx expo install --check` → `Dependencies are up to date`.
**Medido** · `npx expo-doctor` → `21/21 checks passed. No issues detected!`.

## 3. Auditoría de vulnerabilidades, antes y después

```
ANTES   15 vulnerabilidades — 1 crítica,  8 altas, 6 moderadas
DESPUÉS  8 vulnerabilidades — 0 críticas, 5 altas, 3 moderadas
```

Resueltas (7): `shell-quote`, `follow-redirects`, `source-map-js`, `brace-expansion`,
`uuid`, `xcode`, `@expo/config-plugins`.

### 3.1 Una advertencia sobre cómo leer `npm audit` en este proyecto

`npm audit --omit=dev` devuelve **exactamente el mismo resultado** que el audit completo,
antes y después. No significa que todo viaje dentro de la app: significa que `expo`,
`expo-router` y compañía están declarados en `dependencies` aunque su código solo se
ejecute en la máquina que construye. Clasificar por "producción" según npm induce a
error; abajo se clasifica por **alcance real en runtime móvil**.

### 3.2 Las 8 restantes son 3 causas raíz

| Causa raíz | Sev. | Entradas que genera | Alcance real | Estado |
| --- | --- | --- | --- | --- |
| `node-forge` (todas las versiones) | alta | `node-forge`, `@expo/code-signing-certificates`, `@expo/cli`, `expo` | **Build/CLI.** Firma de manifiestos de Expo Updates; no se ejecuta en el dispositivo | Sin versión corregida publicada. **Pendiente de revisión por B11** |
| `zod` 3.25.76 anidado en `@expo/cli` | alta | `zod` | **Build/CLI.** La `zod` de la app es 4.6.7, ya corregida | Solo se "arregla" bajando a `expo@54`. Descartado |
| `decode-uri-component` 0.2.2 | moderada | `decode-uri-component`, `query-string`, `expo-router` | **RUNTIME.** `query-string` parsea URLs y deep links dentro de `expo-router` | Sin solución viable en SDK 57 — ver 3.3 |

Comprobación de que la `zod` de la app sí está corregida (**medido**):

```
$ npm explain zod
zod@3.25.76  node_modules/@expo/cli/node_modules/zod   <- build/CLI
zod@4.6.7    node_modules/zod                          <- la app
```

### 3.3 `decode-uri-component`: por qué no se corrigió (con evidencia)

Se investigaron las tres vías posibles dentro de SDK 57. Ninguna es viable:

**a) Una versión parcheada dentro del rango declarado — no existe.** `query-string@7.1.3`
declara `decode-uri-component@^0.2.2`, es decir `>=0.2.2 <0.3.0`. Las únicas versiones
sin el fallo son 0.5.0 y 0.5.1; 0.2.2 es el techo del rango.
`query-string@7.1.3` es además la última de la rama 7.x, y **todas** las versiones de
`expo-router` 57.x declaran `query-string@^7.1.3` (comprobado hasta 57.0.29).

**b) Forzar `decode-uri-component@0.5.1` con un `override` — rompe la app.** No es solo
que salga del rango semver: 0.5.1 es **ESM puro** (`"type": "module"`, sin salida
CommonJS) y `query-string@7.1.3` lo consume con `require()`. Medido en un directorio
aislado:

```
$ # package.json: query-string 7.1.3 + overrides decode-uri-component 0.5.1
$ node -e "require('query-string').parse('?a=1')"
FAILED: decodeComponent is not a function
```

Falla al **llamar**, no al importar: cada parseo de URL y cada deep link lanzaría esa
excepción en producción.

**c) Forzar `query-string@9.5.1` (la primera sin el fallo) — rompe igual.** También es ESM
puro, y `expo-router` lo consume como `__importStar(require("query-string"))`. Medido
con ese mismo patrón:

```
$ node -e "__importStar(require('query-string')).parse('?a=1')"
typeof parse: undefined
FAILED: qs.parse is not a function
```

**Conclusión:** la única corrección real es `expo-router` ≥ 58.0.13, que es un salto de
Expo SDK, **no autorizado**. Queda como riesgo residual, no como riesgo aceptado.

Explotabilidad **medida** sobre la 0.2.2 instalada, para dimensionarlo: con cargas de
hasta 80 KB de secuencias porcentuales malformadas, el tiempo crece de forma
aproximadamente lineal (0,5 ms → 99 ms), sin el crecimiento exponencial que describe el
aviso. No se reprodujo una denegación de servicio práctica. La precondición de ataque
sería que la persona abriese un deep link `havit://` fabricado, y el impacto máximo
observado es un bloqueo de la propia app, sin exposición de datos. **Esto dimensiona el
riesgo; no lo descarta**, y no sustituye la decisión de B11.

## 4. Configuración nativa verificada

Todo lo de esta sección está **derivado del proyecto nativo generado** con
`npx expo prebuild --platform all` (los directorios `android/` e `ios/` están en
`.gitignore`, así que se regeneran y no se comitean).

### 4.1 Versiones mínimas reales, ahora explícitas

No estaban forzadas en la configuración. Se midieron en el proyecto generado y se fijaron
a ese mismo valor, de modo que un parche futuro que mueva el suelo falle en un test en
vez de estrechar en silencio la lista de dispositivos compatibles.

| Plataforma | Medido | Significa | Dónde se leyó |
| --- | --- | --- | --- |
| Android `minSdkVersion` | **24** | Android 7.0 Nougat | Gradle, `[ExpoRootProject]` |
| Android `compileSdkVersion` | **36** | Android 16 | Gradle, `[ExpoRootProject]` |
| Android `targetSdkVersion` | **36** | Android 16 | Gradle, `[ExpoRootProject]` |
| iOS `IPHONEOS_DEPLOYMENT_TARGET` | **16.4** | iOS 16.4 | `ios/frontend.xcodeproj/project.pbxproj` |

Estos valores se obtuvieron preguntando a Gradle con los pines **retirados**, que es la
única forma de leer el valor por defecto real:

```
$ ./gradlew :app:tasks --dry-run        # sin minSdkVersion/compileSdkVersion/targetSdkVersion en app.json
[ExpoRootProject] Using the following versions:
  - buildTools:  36.0.0
  - minSdk:      24
  - compileSdk:  36
  - targetSdk:   36
  - ndk:         27.1.12297006
  - kotlin:      2.1.20
```

> **Cómo se corrigió un error de medición, porque la lección importa más que el dato.**
> La primera versión de este documento fijó `compileSdk`/`targetSdk` en **35**, leído del
> fallback `getVersionOrDefault("compileSdk", "35")` de `ExpoRootProjectPlugin.kt`. Ese
> fallback no es el valor operativo. La build local lo demostró fallando (§7.1.1) y, peor,
> un log anterior de Gradle que decía `compileSdk: 35` se tomó por confirmación cuando en
> realidad **estaba devolviendo el pin recién puesto**: una entrada propia leída como
> evidencia independiente. El valor real solo se obtiene retirando los pines antes de
> preguntar.

`compileSdk` **no se puede bajar**: `expo-camera` arrastra `androidx.camera:*` 1.6.0, que
exige compilar contra la API 36 o superior. Bajarlo rompe la build en
`:app:checkReleaseAarMetadata` con 13 errores de metadatos de AAR. El test de §5 lo fija
para que ese error no pueda reaparecer en silencio.

> **Fuera del alcance de B8.** Quien publique en Google Play debe confirmar el nivel de API
> que Play exige en ese momento; B8 no publica en Play y no verificó ese requisito.

### 4.2 Permisos de Android: se quitaron tres que no se usan

La app heredaba la plantilla base de Expo sin revisarla, y esa plantilla declara, con un
comentario literal `OPTIONAL PERMISSIONS, REMOVE WHATEVER YOU DO NOT NEED`
(`@expo/config-plugins/build/plugins/withAndroidBaseMods.js`), tres permisos que HAVIT no
necesita.

Verificado en el código antes de quitarlos:

- `app/(add)/camera.tsx` solo monta `CameraView` y `useCameraPermissions`. No hay ninguna
  llamada a `recordAsync` ni modo vídeo en toda la app → **no hace falta `RECORD_AUDIO`**.
- `app/profile/edit.tsx` llama `launchImageLibraryAsync({ mediaTypes: ['images'] })` → solo
  lectura de imágenes, nunca vídeo.
- No se usa `MediaLibrary` en ningún sitio → **no hace falta `WRITE_EXTERNAL_STORAGE`**.
- Nada dibuja sobre otras apps → **no hace falta `SYSTEM_ALERT_WINDOW`**.

| Permiso | Antes | Ahora | Por qué |
| --- | --- | --- | --- |
| `INTERNET` | sí | sí | API |
| `CAMERA` | sí | sí | foto de evidencia |
| `READ_EXTERNAL_STORAGE` | sí | sí | selector de imágenes en Android ≤ 32 |
| `VIBRATE` | sí | sí | notificaciones |
| `RECORD_AUDIO` | sí | **bloqueado** | no se graba audio ni vídeo |
| `WRITE_EXTERNAL_STORAGE` | sí | **bloqueado** | no se escribe en la galería |
| `SYSTEM_ALERT_WINDOW` | sí | **bloqueado** | no se dibuja sobre otras apps |

**Derivado de configuración** · en el manifest generado los tres quedan con
`tools:node="remove"`, que es como el *manifest merger* de Android los elimina del
paquete final:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" tools:node="remove"/>
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" tools:node="remove"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" tools:node="remove"/>
```

**Pendiente:** confirmar la lista final sobre el manifest *fusionado* de un APK
construido (`aapt dump permissions`). Requiere una build, que hoy está bloqueada (§7).

### 4.3 Permisos de iOS: descripciones propias y traducidas

Antes, los textos del diálogo de permiso eran los genéricos de Expo en inglés
(`Allow $(PRODUCT_NAME) to access your camera`), dentro de una app cuyo idioma por
defecto es el español (`i18n/index.ts`, `fallbackLng: 'es'`). Ahora describen para qué los
usa HAVIT, en español, a través de los *props* de los plugins `expo-camera` y
`expo-image-picker`, que es lo que los escribe en el `Info.plist` generado.

> **Se intentó traducirlos y hubo que revertirlo.** Una versión anterior usaba la clave
> `locales` de `app.json` para dar los textos en español e inglés, generando
> `es.lproj`/`en.lproj` con `InfoPlist.strings`. Funcionaba en iOS, pero **rompía la build
> de release de Android**: Expo aplica `locales` también a Android y escribe *todas* las
> claves en `res/values-b+<lang>/strings.xml` sin equivalente en el locale por defecto, y
> `:app:lintVitalRelease` falla con 6 errores `ExtraTranslation`
> (`"NSCameraUsageDescription" is translated here but not found in default locale`). Esa
> clave está pensada para el nombre de la app, no para claves del `Info.plist`: usarla así
> fue un error. Como el idioma de respaldo de la app es el español, un único texto en
> español es la opción correcta, y un test impide que `locales` vuelva a aparecer. Si en el
> futuro se quieren prompts traducidos, hará falta un config plugin propio que escriba solo
> el lado de iOS.

**Derivado de configuración** · verificado en el `Info.plist` generado:

| Clave | Estado |
| --- | --- |
| `NSCameraUsageDescription` | texto de HAVIT en español |
| `NSPhotoLibraryUsageDescription` | texto de HAVIT en español |
| `NSPhotoLibraryAddUsageDescription` | no se declara: la app no guarda en la galería (sin uso de `MediaLibrary`) |
| `NSMicrophoneUsageDescription` | **eliminado** (ya no se pide el permiso) |
| `NSFaceIDUsageDescription` | lo añade `expo-secure-store`; la app no usa biometría. Inocuo, documentado |

### 4.4 Transporte: iOS ya bloquea el texto en claro

**Hallazgo relevante para B3 y para la prueba física.** El `Info.plist` generado trae:

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key><false/>
  <key>NSAllowsLocalNetworking</key><true/>
</dict>
```

Es decir, **en iOS App Transport Security ya rechaza HTTP**, con una excepción solo para
red local. `http://20.63.84.1:3000` es una IP pública, no red local, así que **no entra
en la excepción**.

`extra.apiUrl` resuelto hoy (**medido**, `npx expo config --json`):

```
extra.apiUrl = http://20.63.84.1:3000
```

Consecuencia práctica: **una build de iOS instalada hoy no podrá hablar con el backend**,
y no por nada que haga B8. Esto es anterior a B8 y pertenece a B3. En Android funciona
solo porque `usesCleartextTraffic: true` sigue activo en `development`.

Esto convierte a B3 en **prerrequisito de la prueba física en iPhone**, no en una tarea
paralela. Las opciones para desbloquearla están en §9.4.

B8 no toca el transporte: `usesCleartextTraffic` se deja exactamente como estaba.

## 5. Pruebas automatizadas

Todas **medidas**, en este orden, después de los cambios:

| Comprobación | Comando | Resultado |
| --- | --- | --- |
| Tipos | `npm run typecheck` | **limpio** (`tsc --noEmit`, sin errores) |
| Suite completa | `npm test` | **180 suites, 2168 tests en verde**, 1 suite y 5 tests saltados (ya saltados antes) |
| Paridad i18n | `npm run i18n:check` | **1138 = 1138 claves**, 0 ausentes, 0 vacías |
| Compatibilidad Expo | `npx expo install --check` | **sin pendientes** |
| Salud del proyecto | `npx expo-doctor` | **21/21** |
| Config nativa | `npx jest __tests__/nativeConfig.test.ts` | **13/13** (nuevos) |

Línea base antes de tocar nada: 179 suites / 2155 tests. Después: 180 / 2168. La
diferencia son los 13 tests nuevos; **ningún test existente cambió de resultado**.

`__tests__/nativeConfig.test.ts` fija como invariantes lo que una build física necesita:
la lista exacta de permisos de Android y los tres bloqueados, que no se pida micrófono,
los mínimos de SDK de ambas plataformas, la paridad ES/EN de los textos de permiso de
iOS, orientación vertical y un único identificador de aplicación.

Nombre elegido a propósito para **no colisionar** con `__tests__/appConfig.test.ts`, que
B3 añade en su rama para el transporte.

> Un test de Jest en verde **no es** funcionamiento nativo. Esta sección no es evidencia
> de dispositivo.

## 6. Qué se cambió, archivo por archivo

| Archivo | Cambio |
| --- | --- |
| `package.json` | 10 paquetes al día con SDK 57; `zod` → `^4.6.7` |
| `package-lock.json` | transitivas corregidas dentro de rango; sin `overrides` |
| `app.json` | `android.permissions` + `blockedPermissions`; plugins `expo-camera` / `expo-image-picker` con sus textos; `locales`; `minSdkVersion` / `compileSdkVersion` / `targetSdkVersion` / `deploymentTarget` |
| `locales/ios-es.json`, `locales/ios-en.json` | textos de permiso de iOS (nuevos) |
| `__tests__/nativeConfig.test.ts` | 13 tests de invariantes nativas (nuevo) |
| `docs/sprint-10/B8-...md` | este documento (nuevo) |

Sin cambios en el backend, en `raiz/`, en la lógica de autenticación de B4, ni en el
transporte de B3. `.env` no se tocó (decisión explícita de la persona responsable).

## 7. Estado de las builds

### 7.1 Android

| Vía | Estado | Detalle |
| --- | --- | --- |
| EAS `preview` (APK) | **BLOQUEADO** | `npx eas-cli whoami` → `Not logged in`. Requiere credenciales de Expo |
| **Gradle local (release)** | **FUNCIONA** | APK de 173 MB generado y verificado; firmado con el keystore de depuración, instalable pero no distribuible (§7.1.2) |

#### 7.1.1 Intento real de build local

En vez de dar por bloqueada la vía local a partir de lo que falta en la máquina, se
lanzó la build de release y se observó el resultado:

```bash
cd frontend/android
export ANDROID_HOME="$HOME/Library/Android/sdk"
./gradlew :app:assembleRelease --no-daemon
```

Estado del entorno antes de lanzarla (**medido**): Gradle 9.3.1, AGP 8.12.0, JDK 22.0.1
(el único instalado), `build-tools` 35.0.0 y 36.0.0, plataforma **`android-36` solamente**
(se fijó `compileSdk 35`), `cmdline-tools` **vacío** — sin `sdkmanager` no hay forma
automática de instalar la plataforma que falta — y `ANDROID_HOME` sin definir en el perfil.

**Resultado del primer intento: `BUILD FAILED in 34m 25s`** (895 tareas ejecutadas), sin
APK. Y el fallo fue útil, porque destapó un error introducido por B8:

```
Execution failed for task ':app:checkReleaseAarMetadata'.
> 13 issues were found when checking AAR metadata:
    1. Dependency 'androidx.camera:camera-camera2-pipe:1.6.0' requires libraries and
       applications that depend on it to compile against version 36 or later of the
       Android APIs.
       :app is currently compiled against android-35.
```

Causa: B8 había fijado `compileSdkVersion`/`targetSdkVersion` en **35**, leyéndolo del
fallback del plugin en lugar de preguntárselo a Gradle. El valor real por defecto de SDK 57
es **36**, así que el pin no documentaba la realidad: la **bajaba**, y `expo-camera`
(`androidx.camera` 1.6.0) exige 36 o superior. Corregido a `24 / 36 / 36` (§4.1).

Dos conclusiones que invalidan suposiciones previas de este documento:

1. **La vía local nunca estuvo bloqueada por el toolchain.** Se había dado por bloqueada
   porque faltaba la plataforma `android-35` y no había `cmdline-tools` para instalarla.
   Falso: AGP descarga por su cuenta lo que falta, licencia incluida — instaló el **NDK
   27.1.12297006 (2,4 GB)** sin intervención.
2. **JDK 22 no es un obstáculo.** Gradle 9.3.1 y AGP 8.12.0 compilaron con ella sin
   incidencias, hasta llegar al fallo de metadatos, que no tiene relación con la JDK.

**Segundo intento, con `compileSdk 36`: `BUILD FAILED in 3m 42s`** (918 tareas). La
corrección de SDK funcionó —superó `checkReleaseAarMetadata` y bajó de 34 min a 3— pero
apareció un segundo error, también introducido por B8:

```
Execution failed for task ':app:lintVitalRelease'.
> Lint found 6 errors. First failure:
  res/values-b+en/strings.xml:2: Error: "NSCameraUsageDescription" is translated here
  but not found in default locale [ExtraTranslation]
```

Causa: la clave `locales` de `app.json`, que B8 había añadido para traducir los textos de
permiso de iOS. Expo la aplica **también a Android**. Corregido quitándola (§4.3).

**Tercer intento: `BUILD SUCCESSFUL in 3m 36s`, código de salida 0, 921 tareas.**

### 7.1.2 El APK: qué es exactamente

```
android/app/build/outputs/apk/release/app-release.apk
```

| Propiedad | Valor **medido** |
| --- | --- |
| Existe | **sí**, 2026-10-25 13:14 |
| Tamaño | **173 MB** (APK universal, con las 4 ABIs) |
| `package` | `com.havit.app`, `versionCode` 1, `versionName` 1.0.0 |
| `compileSdkVersion` | **36** (`platformBuildVersionName='16'`, Android 16) |
| `targetSdkVersion` | **36** |
| ABIs | `arm64-v8a` 36,4 MB · `armeabi-v7a` 24,9 MB · `x86` 39,3 MB · `x86_64` 38,3 MB |
| `usesCleartextTraffic` | **`true`** — sigue activo, porque B3 no está mergeado |
| `debuggable` | no declarado (es una build de release) |
| Firma | **keystore de depuración de Android** (`CN=Android Debug`), SHA-256 `fac61745…33b9c` |

**¿Es instalable?** **Sí.** Está firmado, así que se puede instalar por `adb install` en un
teléfono real o en un emulador.

**¿Qué perfil usa?** **Ninguno de EAS.** Esto es importante no confundirlo: es el
`buildType release` de Gradle **en local**, no el perfil `preview` de `eas.json`. Y está
firmado con el keystore de depuración porque la plantilla de React Native lo deja así a
propósito, con su advertencia incluida en `android/app/build.gradle`:

```gradle
release {
    // Caution! In production, you need to generate your own keystore file.
    signingConfig signingConfigs.debug
}
```

Consecuencias prácticas:

- **Sirve para probar en un dispositivo físico**, que es lo que B8 necesita.
- **No sirve para distribuir.** Un APK firmado con el keystore de depuración no debe
  llegar a Google Play ni a nadie fuera del equipo, y no equivale a la build de `preview`
  de EAS, que usaría credenciales reales.
- **Los 173 MB no son el tamaño de instalación.** Es un APK universal que lleva las cuatro
  ABIs; un teléfono solo usa una. Descontando las otras tres, para un dispositivo arm64 la
  parte que le corresponde ronda los 70 MB. El tamaño descargado e instalado reales siguen
  **sin medir**: hacen falta un App Bundle o `--split-per-abi`, y el propio dispositivo.

### 7.1.3 Verificación de los permisos sobre el APK construido

Esto era lo que §4.2 dejaba pendiente: comprobar el manifest **fusionado**, no el de
partida. `aapt2 dump permissions` sobre el APK confirma que los tres `tools:node="remove"`
surtieron efecto:

| Permiso | En el APK |
| --- | --- |
| `android.permission.CAMERA` | sí |
| `android.permission.INTERNET` | sí |
| `android.permission.READ_EXTERNAL_STORAGE` (`maxSdkVersion=32`) | sí |
| `android.permission.VIBRATE` | sí |
| **`android.permission.SYSTEM_ALERT_WINDOW`** | **NO — eliminado** |
| **`android.permission.WRITE_EXTERNAL_STORAGE`** | **NO — eliminado** |
| **`android.permission.RECORD_AUDIO`** | **NO — eliminado** |

El APK incluye además permisos que añaden las propias librerías, no la configuración de la
app: `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK`,
`com.google.android.c2dm.permission.RECEIVE` y `ACCESS_NETWORK_STATE` (de
`expo-notifications`), `USE_BIOMETRIC`/`USE_FINGERPRINT` (de `expo-secure-store`, aunque la
app no usa biometría) y una cola larga de permisos de *badge* de lanzadores de Samsung,
HTC, Sony, Huawei, Oppo y otros, que entran con la librería de contadores de notificación.
Son estándar, pero conviene saber que están ahí antes de una revisión de tienda.

**Nota operativa:** `expo prebuild --clean` regenera `android/` e `ios/` desde cero, así
que borra también `ios/Pods` y `ios/frontend.xcworkspace`. Después de cada `--clean` hay
que volver a ejecutar `pod install` (la caché de CocoaPods lo hace rápido).

Lo que **sí** está listo: `eas.json` ya define `development` (dev client, APK),
`preview` (interna, APK) y `production`; `extra.eas.projectId` ya está en `app.json`
(`bc509756-4500-48e1-92f2-441965b21629`), es decir `eas init` ya se hizo. Con sesión
iniciada, el APK sale con:

```bash
cd frontend && npx eas-cli login && npx eas-cli build --platform android --profile preview
```

Dispositivos Android disponibles (**medido**): dos emuladores (`Pixel_9a`,
`Medium_Phone_API_36.0`); `adb devices` vacío, ningún teléfono conectado.

### 7.2 iOS

Corrección a la suposición de partida: **Xcode sí está instalado.**

| Elemento | Estado **medido** |
| --- | --- |
| `Xcode.app` | **26.4.1** (build 17E202), 4,8 GB, SDK iOS 26.4 |
| `xcode-select -p` | apunta a `/Library/Developer/CommandLineTools`, **no** a Xcode |
| `xcodebuild` vía `DEVELOPER_DIR` | **funciona sin `sudo`** → `Xcode 26.4.1` |
| `xcodebuild -list` | el proyecto generado abre bien: target y scheme `frontend` |
| macOS | **26.6.2** (Tahoe, build 25G83), arm64 |
| CocoaPods | **no instalado** (`pod not found`) |
| Dispositivos conectados | `xcrun devicectl list devices` → **No devices found** |

Compatibilidad de versiones, según la tabla de requisitos de Apple: Xcode 26.4.1 pide
macOS Tahoe 26.2 o posterior — macOS 26.6.2 cumple — y su soporte de dispositivos es
"iOS 15 o posterior", que cubre iOS 26.6.2. El matiz: su SDK es iOS 26.4 y su carpeta
`DeviceSupport` local solo llega a 16.4, así que **no está confirmado** que acepte un
dispositivo con iOS 26.6.2 sin descargar soporte adicional. Si lo rechaza, la salida es
actualizar a Xcode 26.6 (SDK 26.5) o Xcode 27.x, ambos compatibles con macOS 26.6.2.
Esto se resuelve en un minuto al conectar el teléfono; no antes.

## 8. ¿Hace falta una cuenta Apple Developer de pago?

**Para instalar y probar casi todo: no.** Una cuenta Apple gratuita (*Personal Team*)
firma una development build y la instala en un iPhone propio, con dos límites conocidos:
el perfil caduca a los **7 días** (hay que reinstalar) y hay un tope de apps firmadas por
dispositivo.

**Para notificaciones push: sí, es obligatoria la de pago (99 USD/año).** La capacidad
*Push Notifications* no está disponible para un Personal Team; lo confirma una respuesta
de un ingeniero de Apple DTS en los foros oficiales, y es un límite de la cuenta, no del
proyecto.

Esto es concreto en HAVIT, no teórico. El proyecto generado trae:

```xml
<!-- ios/frontend/frontend.entitlements -->
<key>aps-environment</key><string>development</string>
```

Con una cuenta gratuita, **la firma falla** con un error del tipo *"does not support the
Push Notifications capability"*. Hay dos caminos:

| Camino | Qué se puede probar | Coste |
| --- | --- | --- |
| **A — cuenta gratuita**, quitando el *entitlement* de push solo para esa build local | Todo menos push: registro, login, sesión, refresh, logout, retos, rutinas, entrenamientos, fotos, moderación, navegación | 0 |
| **B — Apple Developer Program** | Todo, incluidas push por APNs | 99 USD/año |

El camino A **no se comitea**: las notificaciones push son una funcionalidad real del
producto. Es un paso local y reversible del proceso de build, descrito en §9.3.

El camino A es viable de principio a fin, verificado en el código: en
`services/notifications/pushNotifications.ts`, la llamada a `getExpoPushTokenAsync` está
dentro de un `try/catch` que registra un aviso y devuelve `null`. Sin el *entitlement* de
push, el registro falla y **la app sigue funcionando**; no se cae ni bloquea ninguna otra
pantalla. Lo que no se podrá validar es F13.

Nota aparte: las *notificaciones locales* sí funcionan con cuenta gratuita. Lo que no
funciona es el envío remoto por APNs, que es lo que usa HAVIT.

## 9. Guía para instalar HAVIT en el iPhone 16 Pro Max

Dispositivo objetivo: iPhone 16 Pro Max, iOS 26.6.2, Mac Apple Silicon con macOS 26.6.2.

Los pasos 1 a 3 necesitan tu intervención: contraseña de administrador, tu Apple ID y el
teléfono conectado. **Ninguno se ha ejecutado.**

> **Estado al cierre de este documento:** los pasos 1 y 2 ya están resueltos sin tocar el
> sistema: Xcode se usa vía `DEVELOPER_DIR` (sin `sudo`, sin cambiar `xcode-select`) y
> CocoaPods 1.17.0 está instalado y ya generó el espacio de trabajo (§9.2.1). Queda la
> firma y el dispositivo.

### 9.1 Paso 1 — apuntar las herramientas a Xcode (pide tu contraseña)

`xcode-select` apunta a Command Line Tools, no a Xcode. Dos opciones:

```bash
# Opción A — permanente, pide contraseña de administrador
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

# Opción B — solo para esta sesión, sin sudo (es la que se usó para verificar)
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
```

Abre Xcode una vez a mano para que acepte su licencia e instale sus componentes.

### 9.2 Paso 2 — instalar CocoaPods (no está)

Hace falta para `pod install`. Esta máquina tiene una particularidad que descarta la vía
más obvia, así que conviene leer antes de ejecutar.

**Entorno medido:** el único Ruby es el del sistema, **2.6.10** (`/usr/bin/ruby`). No hay
rbenv, rvm ni asdf. Sí hay **Homebrew 7.0.6** en `/opt/homebrew`.

**`sudo gem install cocoapods` — descartado.** Escribe en `/Library/Ruby/Gems/2.6.0`,
exige contraseña de administrador y modifica el estado del sistema.

**`gem install --user-install cocoapods` — intentado, y falla.** Instala en `~/.gem` sin
`sudo` y sin tocar nada global, pero las dependencias transitivas de CocoaPods 1.17.0 ya
dejaron atrás Ruby 2.6, en cascada:

```
ffi (>= 1.15.0)        -> requiere ruby >= 3.0   (1.17.2 aún admite >= 2.5; se fijó y pasó)
securerandom (>= 0.3)  -> requiere ruby >= 3.1   (sin salida dentro del rango)
```

El gemspec de CocoaPods declara `ruby >= 2.6` en **todas** sus versiones (1.14.3 a 1.17.0),
así que bajar de versión no resuelve el problema por sí solo: lo que se movió son las
dependencias. El intento dejó 30 gems en `~/.gem` (55 MB) **sin** el binario `pod`;
se eliminan con `rm -rf ~/.gem` y no afectan a nada del sistema. El Ruby del sistema
quedó intacto (`ruby -v` → 2.6.10, `which ruby` → `/usr/bin/ruby`).

**`brew install cocoapods` — la vía que funciona, con una advertencia.** Instala CocoaPods
1.17.0 precompilado en `/opt/homebrew`, sin `sudo`, con sus gems en un `libexec` privado
que no contamina los del usuario. La advertencia: la fórmula declara `depends_on "ruby"`
sin `:build`, y la fórmula `ruby` de Homebrew **no es keg-only**, así que enlaza
`/opt/homebrew/bin/ruby` (Ruby 4.0.9). Como `/opt/homebrew/bin` precede a `/usr/bin` en el
PATH, `ruby` pasaría de 2.6.10 a 4.0.9 en todas las shells.

Si eso no es aceptable, se desenlaza después y `pod` sigue funcionando. **Ejecutado y
verificado**, no supuesto:

```bash
brew install cocoapods    # CocoaPods 1.17.0_1 + ruby 4.0.9 + openssl@4 + libyaml, sin sudo
brew unlink ruby          # 5155 symlinks retirados de /opt/homebrew/bin
```

Estado medido en cada punto:

| Comprobación | Antes de instalar | Tras instalar | Tras `brew unlink ruby` |
| --- | --- | --- | --- |
| `pod --version` | `pod not found` | **1.17.0** | **1.17.0** |
| `which pod` | — | `/opt/homebrew/bin/pod` | `/opt/homebrew/bin/pod` |
| `ruby -v` | 2.6.10 | **4.0.9** | **2.6.10** |
| `which ruby` | `/usr/bin/ruby` | `/opt/homebrew/bin/ruby` | `/usr/bin/ruby` |

Desenlazar es seguro, y se comprobó antes de hacerlo en vez de darlo por hecho:
`brew uses --installed ruby` devuelve **solo `cocoapods`**, y el `pod` real lleva el
shebang `#!/opt/homebrew/opt/ruby/bin/ruby`, una ruta absoluta que no pasa por
`/opt/homebrew/bin`. Reversible con `brew link ruby`; `brew uninstall cocoapods ruby` lo
retira del todo.

**Efecto secundario que conviene conocer.** Instalar CocoaPods arrastra `openssl@4`, y
Homebrew desenlazó `openssl@3` en el proceso (6570 symlinks). De `openssl@3` dependen
`composer`, `elixir`, `erlang`, `ffmpeg`, `curl`, `krb5`, `black` y otros. Comprobado que
**no rompió nada**: `openssl@3` es *keg-only*, sigue en el Cellar, su enlace
`/opt/homebrew/opt/openssl@3` está intacto, `brew info` confirma
`Recursive Runtime (1): all installed`, y se verificaron los binarios uno a uno —
`composer` 2.9.7, `ffmpeg` 8.1.2, `black` 26.3.1 y `elixir`/OTP 27 responden con
normalidad.

**Limitación menor:** CocoaPods avisa de que el terminal no usa UTF-8 y sugiere añadir
`export LANG=en_US.UTF-8` a `~/.profile`. No se modificó ningún perfil del usuario; basta
con pasar `LANG=en_US.UTF-8` en la invocación.

### 9.2.1 `pod install` — ejecutado y correcto

Una vez instalado CocoaPods, el espacio de trabajo de iOS se generó sin errores
(**medido**):

```bash
cd frontend/ios
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer LANG=en_US.UTF-8
pod install          # exit 0
```

| Resultado | Valor |
| --- | --- |
| Pods instalados | **312** |
| Tamaño de `ios/Pods` | **1,2 GB** |
| CocoaPods que lo generó | **1.17.0** |
| Espacio de trabajo | `ios/frontend.xcworkspace` |
| `xcodebuild -list -workspace` | responde; el scheme **`frontend`** existe |

Dato favorable para los tiempos de compilación: el proyecto resuelve React Native por
**binarios precompilados**, no desde fuentes (`RCT_USE_RN_DEP`, visible en el Podfile).
`pod install` descargó `reactnative-core-0.86.3` (94 MB) y los `.xcframework` de los
módulos de Expo, en lugar de compilar React Native entero.

Los avisos `[!] … has added N script phases` de `ExpoCamera`, `ExpoModulesCore`,
`hermes-engine` y otros son informativos de CocoaPods, no errores.

Con esto, el proyecto iOS está **listo para compilar**. Lo que falta es exclusivamente la
firma y el dispositivo, que son los pasos 1, 3 y 4 de abajo.

### 9.3 Paso 3 — generar el proyecto, firmar y ejecutar

```bash
cd frontend
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
npx expo prebuild --platform ios --clean
```

**Si vas por el camino A (cuenta gratuita)**, quita el *entitlement* de push de esa build.
Es un cambio local sobre un directorio que está en `.gitignore`; no se comitea:

```bash
/usr/libexec/PlistBuddy -c "Delete :aps-environment" ios/frontend/frontend.entitlements
```

Después:

1. Conecta el iPhone por cable y desbloquéalo. Acepta **Confiar en este ordenador**.
2. `open ios/frontend.xcworkspace`
3. En Xcode: target `frontend` → **Signing & Capabilities** → marca
   *Automatically manage signing* → en **Team** elige tu Apple ID personal (si no
   aparece, añádelo en *Settings → Accounts*).
4. Si el identificador `com.havit.app` da conflicto con una cuenta gratuita, cámbialo en
   Xcode a algo único tuyo, por ejemplo `com.havit.app.<tu-nombre>`. **Solo en Xcode**,
   no en `app.json`.
5. Elige tu iPhone en el selector de dispositivos y pulsa **Run** (⌘R).
6. La primera vez, el teléfono rechazará el certificado: ve a
   **Ajustes → General → VPN y gestión de dispositivos**, abre tu perfil de desarrollador
   y pulsa **Confiar**. Vuelve a ejecutar.

Si Xcode 26.4.1 dice que no reconoce iOS 26.6.2, actualízalo a 26.6 o a 27.x desde la
App Store y repite. Es el riesgo señalado en §7.2.

### 9.4 Antes de probar: a qué backend va a hablar

**Esto hay que resolverlo antes de ejecutar los flujos, no durante.** Dos problemas
distintos:

1. **iOS bloqueará el HTTP** por App Transport Security (§4.4). Una build que apunte a
   `http://20.63.84.1:3000` fallará en *todas* las llamadas de red, y el síntoma parecerá
   un fallo de la app.
2. **Ese host es el backend real.** Los flujos de registro, unirse a retos, registrar
   entrenamientos y subir fotos **crean datos**. No deben ejecutarse contra producción.

Lo que ya está disponible en esta máquina (**medido**):

| Pieza | Estado |
| --- | --- |
| PostgreSQL local | **`postgresql@18` corriendo**, `pg_isready` → `/tmp:5432 - aceptando conexiones` |
| **Base de datos de pruebas aislada** | **`havit_b4_test` ya existe y está al día**: 62 tablas en el schema `havit` y **66 migraciones aplicadas**, exactamente los 66 ficheros SQL que tiene `backend` en `development` (1 init + 58 migrations + 7 seeds). También están `havit_perf` y `havit_b4_audit_1792820163` |
| HTTPS local | `raiz/docker-compose.yml` ya trae **Caddy 2.10.2** con TLS automático sobre `API_DOMAIN`, y `caddy/Caddyfile` es trabajo de B3 |
| Nombre Bonjour del Mac | `MacBook-Pro-de-Alejandro-2.local` |
| IP LAN del Mac | `192.168.5.94` |

O sea que **el entorno aislado no hay que construirlo, ya está**: tareas anteriores (B4,
rendimiento) dejaron bases locales con el esquema completo y al día. No hace falta
`db:migrate` ni tocar la instancia de Azure.

### 9.4.1 Verificación de seguridad: a qué backend se conectaría la app

Hecha antes de instalar nada, porque es el riesgo con más consecuencias de todo B8.

**Por defecto, a producción.** El `.env` versionado define
`EXPO_PUBLIC_API_URL=http://20.63.84.1:3000`, así que **cualquier** build lo toma si no se
sobreescribe (**medido**, `npx expo config --json`):

```
extra.apiUrl = http://20.63.84.1:3000
```

**Una variable de entorno sí lo sobreescribe** (**medido**), que es lo que permite una
build de pruebas segura:

```
$ EXPO_PUBLIC_API_URL="http://MacBook-Pro-de-Alejandro-2.local:3000" npx expo config --json
extra.apiUrl = http://MacBook-Pro-de-Alejandro-2.local:3000
```

> **Riesgo residual que hay que conocer antes de instalar.** `services/api.ts` en
> `development` lleva la URL de producción **codificada como respaldo**:
>
> ```ts
> const FALLBACK_API_URL = 'http://20.63.84.1:3000';
> const baseURL = (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? FALLBACK_API_URL;
> ```
>
> Si `extra.apiUrl` llegase vacío en tiempo de ejecución, la app hablaría con **producción
> en silencio**, incluso en una build hecha para pruebas. La rama de B3 ya lo corrige
> (deja el respaldo solo para desarrollo). B8 **no** lo ha tocado por ser territorio de B3.
> Antes de ejecutar un flujo que cree datos, conviene comprobar la URL efectiva en el
> propio dispositivo, no solo en la configuración.

**Lo que falta, y necesita autorización:** apuntar el backend a `havit_b4_test` es un
cambio en `backend/.env`, otro repositorio. **No se ha hecho.**

Opciones, en orden de preferencia:

1. **Backend local por nombre `.local` sobre HTTP.** Construir con
   `EXPO_PUBLIC_API_URL=http://MacBook-Pro-de-Alejandro-2.local:3000`. Es la vía más
   barata y la que mejor encaja con `NSAllowsLocalNetworking`, que según las fuentes
   consultadas cubre con claridad los dominios `.local`.
2. **Caddy con su CA interna.** `raiz` ya lo tiene montado; con `API_DOMAIN` sin definir
   sirve `https://localhost` con certificado de la **CA interna de Caddy**, y el
   `Caddyfile` lleva `skip_install_trust`. Para que el iPhone lo acepte hay que exportar
   esa CA raíz del volumen `caddy_data`
   (`/data/caddy/pki/authorities/local/root.crt`), instalarla como perfil en el teléfono
   y **activarla en Ajustes → General → Información → Ajustes de confianza de
   certificados**. Además `API_DOMAIN` tendría que ser el nombre por el que el teléfono
   llega al Mac, no `localhost`. Funciona con independencia de ATS, pero son varios pasos
   en el dispositivo.
3. **Esperar a B3** con dominio real y certificado de Let's Encrypt. Es el camino de
   producción y resuelve el transporte de forma definitiva.

> **Incertidumbre que hay que resolver en el dispositivo, no sobre el papel.** Si
> `NSAllowsLocalNetworking` exime además a las IP privadas en crudo (`192.168.5.94`) no
> está claro: las fuentes se contradicen y hay un informe en el foro de Apple de una
> dirección `192.168` que siguió fallando con esa clave activa. Por eso la opción 1 usa el
> nombre `.local` y no la IP, y por eso la opción 2 queda preparada como alternativa. **No
> se dará por buena ninguna de las dos hasta verla funcionar en el iPhone.**

**La base de datos es el punto delicado.** `raiz/docker-compose.yml` advierte de forma
explícita que no se añada un servicio `db` local que tape el configurado, y toma
`DB_HOST`/`DB_DATABASE` del `.env`, que hoy apunta a la instancia de Azure. Antes de
ejecutar cualquier flujo que **cree** datos (F1, F7, F9, F11) hay que apuntar el backend a
la PostgreSQL local que ya está corriendo y aplicar el esquema con su propio runner
(`npm run db:migrate`). Ese cambio es del repositorio `backend`, **fuera del alcance de
B8**, y no se ha hecho.

Para los flujos que **solo leen** (F6, F8, F14) basta un backend de pruebas, sin tocar
datos.

## 10. Matriz de validación en dispositivos

Ningún dispositivo físico se ha probado. Toda la columna de resultado está **pendiente**.
Ninguna fila debe marcarse sin ejecutar el flujo en el teléfono.

### 10.1 Dispositivos

| # | Dispositivo | Modelo | SO | Tipo | Build | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| D1 | iPhone (de Alejandro) | iPhone 16 Pro Max | iOS 26.6.2 | **físico** | development firmada localmente | **PENDIENTE DE VALIDACIÓN** — proyecto listo, falta firma y dispositivo |
| D2 | Android (sin asignar) | — | — | **físico** | `app-release.apk` local (§7.1.2) | **PENDIENTE** — **el APK ya existe**; falta un teléfono donde instalarlo |
| D3 | Emulador `Pixel_9a` | AVD | API 36 | emulador | `app-release.apk` local | **PENDIENTE** — el APK es instalable; no se ha ejecutado |

Nota sobre D2: el bloqueo ya **no** es la build. Hay un APK release instalable
(`adb install`), lo que falta es el dispositivo físico. La build de EAS `preview` sigue
bloqueada por credenciales, pero ya no es la única vía para probar en Android.

D3 es *verificación adicional*. **Un emulador no es evidencia de dispositivo físico** y no
se presentará como tal.

### 10.2 Flujos a ejecutar en cada dispositivo físico

Rellenar con fecha, versión, identificador de build, tipo de conexión y evidencia
(captura o vídeo) en el momento de ejecutar.

| # | Flujo | D1 iPhone | D2 Android | Notas |
| --- | --- | --- | --- | --- |
| F1 | Registro | pendiente | pendiente | **crea datos** — no contra producción |
| F2 | Login | pendiente | pendiente | |
| F3 | Restauración de sesión (cerrar y reabrir) | pendiente | pendiente | B4 |
| F4 | Refresh de token | pendiente | pendiente | B4 |
| F5 | Logout | pendiente | pendiente | B4 |
| F6 | Explorar retos | pendiente | pendiente | solo lectura |
| F7 | Unirse a un reto | pendiente | pendiente | **crea datos** |
| F8 | Consultar rutinas | pendiente | pendiente | solo lectura |
| F9 | Registrar entrenamiento | pendiente | pendiente | **crea datos** |
| F10 | Capturar foto con la cámara | pendiente | pendiente | valida §4.2 / §4.3 |
| F11 | Subir foto de evidencia | pendiente | pendiente | **crea datos** |
| F12 | Estado de moderación | pendiente | pendiente | |
| F13 | Notificaciones push | **bloqueado** sin cuenta de pago (§8) | pendiente | Android necesita credenciales FCM |
| F14 | Navegación principal | pendiente | pendiente | |

### 10.3 Hardware y red

| Medición | Cómo se obtiene | Estado |
| --- | --- | --- |
| Orientación vertical | observación en el dispositivo | **pendiente** · configurado como `portrait` y cubierto por test |
| Uso de memoria | Xcode Debug Gauges / Android Studio Profiler | **pendiente** — requiere la app corriendo |
| Tamaño de descarga | tamaño del `.ipa` / `.apk` | **pendiente** — requiere build |
| Tamaño instalado | Ajustes del dispositivo | **pendiente** |
| Tiempo de arranque | cronometrado en frío, 3 intentos | **pendiente** |
| Estabilidad | sesión de uso continuado | **pendiente** |
| Wi-Fi | ejecutar F1–F14 por Wi-Fi | **pendiente** |
| Datos móviles | repetir F2, F6, F9, F11 con Wi-Fi apagado | **pendiente** |
| Permisos de cámara y fotos | diálogo del sistema al usarlos por primera vez | **pendiente** · verifica el texto en español de §4.3 |
| Android mínimo real | del SDK instalado | **medido: API 24 / Android 7.0** |
| iOS mínimo real | del SDK instalado | **medido: iOS 16.4** |

Los dos últimos son los únicos valores de esta tabla que ya están medidos, y salen de la
configuración (§4.1), no de un dispositivo.

## 11. Bloqueos externos

| # | Bloqueo | Impide | Quién lo desbloquea |
| --- | --- | --- | --- |
| B-1 | Sin sesión en EAS (`Not logged in`) | el APK de `preview` **firmado con credenciales reales** y distribuible | credenciales de Expo |
| B-2 | Sin dispositivo Android físico | la columna D2 de la matriz | aportar un teléfono (el APK ya está) |
| B-3 | ~~CocoaPods no instalado~~ | — | **RESUELTO** (§9.2): 1.17.0 por Homebrew, `pod install` correcto |
| B-4 | ~~`xcode-select` apunta a CLT~~ | — | **RESUELTO** sin `sudo` usando `DEVELOPER_DIR` |
| B-5 | Sin cuenta Apple Developer de pago | **solo** las notificaciones push en iOS (F13) | 99 USD/año, o aceptar el camino A |
| B-6 | iPhone no conectado | toda la validación física de iOS | conectar y confiar en el Mac |
| B-7 | B3 sin mergear + API en HTTP | que iOS llegue al backend (§4.4, §9.4) | merge de B3 o backend en red local |
| B-8 | Toolchain Android local incompleto | la build local y el emulador | plataforma `android-35` + `cmdline-tools` |
| B-9 | Soporte de iOS 26.6.2 en Xcode 26.4.1 sin confirmar | posiblemente nada; se sabe al conectar | actualizar Xcode si lo rechaza |
| B-10 | Sin credenciales FCM/APNs | push en ambas plataformas | configurar en EAS |

## 12. Coordinación con otras tareas

**B3 (HTTPS y transporte).** `origin/feature/sprint10-b3-https` existe, **no está
mergeada** y está por detrás de `development` (no contiene B4). Toca
`app.config.js`, `app.json`, `eas.json` y `services/api.ts`. B8 **no** ha reimplementado
nada de eso: `usesCleartextTraffic` se deja intacto.

Punto de merge a resolver cuando B3 entre: B3 **elimina** la entrada estática de
`expo-build-properties` de `app.json` y la vuelve a añadir dinámicamente desde
`app.config.js`, pasando solo `{ android: { usesCleartextTraffic: isDevelopment } }`. B8
ha añadido a esa misma entrada `minSdkVersion`, `compileSdkVersion`, `targetSdkVersion` y
`ios.deploymentTarget`. **Al integrar, la entrada dinámica de B3 debe arrastrar también
esos cuatro valores**, o se perderán sin que nada falle de forma visible —
`__tests__/nativeConfig.test.ts` lo detectará, que es justamente para lo que está.

Además, §4.4 es un hallazgo que le toca a B3: ATS ya bloquea el HTTP en iOS, así que
el cambio a HTTPS no es solo una mejora de seguridad, es **requisito para que la app
funcione en iOS**.

**B4 (sesiones y tokens).** Sin cambios. Los flujos F3, F4 y F5 de la matriz validan B4
sobre el dispositivo.

**`.env`.** Está **trackeado en git** aunque `.gitignore` lo liste: se comiteó antes de
que existiera la regla, y `.gitignore` no afecta a lo que ya está trackeado. Contiene
solo `EXPO_PUBLIC_API_URL`, sin secretos, comprobado por la persona responsable, que pidió
no tocarlo en B8. Queda documentado: la URL usa **HTTP** y su paso a HTTPS es de B3.

## 13. Veredicto por tarea B8

| Tarea | Veredicto | Fundamento |
| --- | --- | --- |
| 1. Dependencias y vulnerabilidades | **COMPLETADO Y VERIFICADO** | 10 paquetes al día con SDK 57; crítica eliminada; 15 → 8; tests, tipos, i18n y expo-doctor en verde. Las 8 restantes son 3 causas raíz documentadas, 2 de ellas solo de build |
| 2. APK de Android | **IMPLEMENTADO, PENDIENTE DE PRUEBA FÍSICA** | **APK release construido y verificado** (§7.1.2): existe, está firmado y es instalable. Falta ejecutarlo en un teléfono (B-2). La build de EAS `preview`, con firma real y distribuible, sigue bloqueada por credenciales (B-1) |
| 3. iOS | **IMPLEMENTADO, PENDIENTE DE FIRMA Y DISPOSITIVO** | Xcode 26.4.1 usable sin `sudo`, CocoaPods 1.17.0 instalado, `pod install` correcto (312 pods) y el workspace abre. Falta conectar el teléfono (B-6), elegir y configurar la firma, y —solo para push— cuenta de pago (B-5) |
| 4. Hardware y mínimos | **PARCIAL** | mínimos reales **medidos y confirmados en el APK** (API 24 / target 36 / iOS 16.4). Tamaño del APK universal medido (173 MB, con el desglose por ABI). Memoria, tamaño instalado, arranque, Wi-Fi y datos móviles: **pendientes**, requieren la app corriendo |
| 5. Configuración nativa (permisos, plugins) | **COMPLETADO Y VERIFICADO** en Android; **pendiente de prueba física** en iOS | los tres permisos sobrantes **se comprobaron ausentes del APK construido** (§7.1.3), no solo del manifest de partida. En iOS los textos están en el `Info.plist` generado, pero el diálogo real no se ha visto |
| 6. Documentación y matriz | **COMPLETADO** | este documento; la matriz está creada con todas sus filas en pendiente, como corresponde |

**B8 no está terminado.** Lo que depende de dependencias, configuración y herramientas
está hecho y verificado, y en Android la verificación llega hasta un APK real construido y
analizado. Lo que depende de un dispositivo físico, de una cuenta de Apple o de B3 no está
hecho, y no se presenta como si lo estuviera: las 14 filas de flujos de §10.2 siguen todas
en pendiente para los dos dispositivos.
