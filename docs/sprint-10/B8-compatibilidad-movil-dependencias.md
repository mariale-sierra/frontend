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

Con esto el proyecto iOS está **configurado y resuelto**, pero **todavía no puede
compilar**: falta un componente de Xcode, descrito en §9.2.2.

### 9.2.2 Falta el componente de plataforma iOS en Xcode (bloqueo real)

Se intentó compilar para simulador —sin firma, para comprobar que el proyecto nativo
compila— y **no fue posible**. No por el proyecto, sino por Xcode:

```bash
$ xcodebuild -workspace frontend.xcworkspace -scheme frontend \
             -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
             CODE_SIGNING_ALLOWED=NO build
xcodebuild: error: Unable to find a destination matching the provided destination specifier
  Ineligible destinations for the "frontend" scheme:
    { platform:iOS, ..., error:iOS 26.4 is not installed.
      Please download and install the platform from Xcode > Settings > Components. }
```

`xcodebuild -showdestinations` **no devuelve ningún destino elegible**, y las otras dos
comprobaciones lo confirman:

```
$ xcrun simctl runtime list
Total Disk Images: 0 (0.0G)

$ ls /Library/Developer/CoreSimulator/Profiles/Runtimes/
(vacío)
```

Las carpetas `iPhoneOS.platform` e `iPhoneSimulator.platform` existen y `xcodebuild
-showsdks` lista el SDK de iOS 26.4, lo que induce a error: desde Xcode 15 **la plataforma
es un componente descargable aparte**, y aquí no está instalada. Sin ella no se puede
compilar para iOS **ni para dispositivo ni para simulador**.

> **Corrección a una afirmación anterior de este documento.** Tras instalar CocoaPods y
> ejecutar `pod install` con éxito se dijo que el proyecto iOS quedaba "listo para
> compilar". Era demasiado: está configurado, con sus 312 pods resueltos y un workspace que
> `xcodebuild -list` abre correctamente, pero **compilar era imposible** y eso no se había
> comprobado. Lo correcto es lo que dice ahora §13: implementado, pendiente de un componente
> de Xcode, de la firma y del dispositivo.

**Qué hace falta:** abrir Xcode → **Settings → Components** y descargar la plataforma
**iOS**. Son del orden de 7–10 GB y es una acción del usuario; puede pedir contraseña de
administrador. Hasta entonces, cualquier intento de build de iOS falla con el error de
arriba, y el bloqueo B-9 (si Xcode 26.4.1 acepta un dispositivo con iOS 26.6.2) **no se
puede ni evaluar**: al instalar el componente puede además ofrecer una versión de Xcode más
reciente, que sería lo deseable para un iPhone con iOS 26.6.2.

### 9.2.3 El proyecto iOS compila: verificado sobre el binario

Con el componente de plataforma ya instalado (§9.2.2 resuelto), se compiló de verdad, sin
firma, contra un simulador iOS 26.4.1:

```bash
cd frontend/ios
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer LANG=en_US.UTF-8
xcodebuild -workspace frontend.xcworkspace -scheme frontend -configuration Debug \
           -destination 'platform=iOS Simulator,name=iPhone 17 Pro Max' \
           CODE_SIGNING_ALLOWED=NO build
# ** BUILD SUCCEEDED **   (salida 0, 55.518 líneas de log, cero errores)
```

Y lo que importa: los cambios de configuración nativa de B8 se comprobaron **en el
`Info.plist` de la app construida**, no en la configuración de partida — el equivalente
iOS de lo que §7.1.3 hizo con el APK.

| Comprobación | Valor en el binario |
| --- | --- |
| `NSCameraUsageDescription` | *"HAVIT usa la cámara para que tomes la foto que comprueba tu entrenamiento del día."* |
| `NSPhotoLibraryUsageDescription` | *"HAVIT accede a tus fotos para que elijas la imagen de tu perfil o la evidencia de un entrenamiento."* |
| `NSMicrophoneUsageDescription` | **no existe** — confirmado eliminado |
| `NSAppTransportSecurity` | `NSAllowsArbitraryLoads = false`, `NSAllowsLocalNetworking = true` |
| `MinimumOSVersion` | **16.4** — coincide con el pin de §4.1 |
| `UISupportedInterfaceOrientations` | `Portrait`, `PortraitUpsideDown` |
| `CFBundleIdentifier` | `com.havit.app` |
| Tamaño de `frontend.app` | 159 MB |

Dos salvedades sobre esa tabla:

- **Los 159 MB no dicen nada del tamaño en el iPhone.** Es una build *Debug* para
  *simulador*, con arquitectura de simulador y sin optimizar. El tamaño instalado real
  sigue **sin medir** y solo saldrá del dispositivo.
- **Un simulador no es un dispositivo físico.** Esto demuestra que el proyecto nativo
  compila y que la configuración llega al binario; **no** demuestra que la app funcione en
  un iPhone. Las 14 filas de §10.2 siguen pendientes.

Observación para la prueba de orientación: el `Info.plist` declara también
`UIInterfaceOrientationPortraitUpsideDown`, no solo `Portrait`. Conviene comprobar en el
teléfono si la app gira 180°, porque "orientación vertical" en la matriz debería significar
vertical a secas.

### 9.2.4 El iPhone, reconocido y compilable (B-9 resuelto)

Con el teléfono conectado por cable, confiado y con el Modo de desarrollador activo:

```
$ xcrun devicectl list devices
Name                 State       Model
iPhone de Alejandro  connected   iPhone 16 Pro Max (iPhone17,2)

$ xcrun devicectl device info details --device <uuid>
marketingName:       iPhone 16 Pro Max
productType:         iPhone17,2
osVersionNumber:     26.6.2
developerModeStatus: enabled
```

Y la comprobación que llevaba pendiente desde §7.2, la única que zanja B-9:

```
$ xcodebuild -showdestinations -workspace frontend.xcworkspace -scheme frontend
  Available destinations for the "frontend" scheme:
    { platform:iOS, arch:arm64, id:00008140-000668DC1E11801C, name:iPhone de Alejandro }
```

El dispositivo aparece entre los **disponibles**, no entre los *Ineligible*. Es decir:
**Xcode 26.4.1 acepta un iPhone con iOS 26.6.2 como destino de compilación**, pese a que su
SDK sea el 26.4. **No hace falta actualizar Xcode**, que era el riesgo anotado en B-9.

### 9.2.5 Estado de la firma antes de configurarla

| Comprobación | Valor |
| --- | --- |
| `PRODUCT_BUNDLE_IDENTIFIER` | `com.havit.app` |
| `CODE_SIGN_ENTITLEMENTS` | `frontend/frontend.entitlements`, con `aps-environment = development` |
| `DEVELOPMENT_TEAM` | **sin definir** |
| Perfiles de aprovisionamiento | **0** |
| Identidades de firma en el llavero | **0 valid identities found** |

No hay ninguna cuenta Apple configurada en Xcode, así que la firma está **enteramente
pendiente** y es el siguiente paso que requiere a la persona usuaria. El `aps-environment`
sigue ahí: es lo que una cuenta gratuita rechazará (§8).

### 9.2.6 Firma con cuenta Apple gratuita: lo que costó y lo que cuesta

Se firmó con un **Personal Team** (cuenta Apple gratuita). Dos ajustes fueron necesarios,
los dos **exclusivamente locales** y en archivos que `.gitignore` excluye (`/ios`), sin
tocar nada versionado ni crear ningún commit:

**1. El entitlement de push hubo que retirarlo.** Un Personal Team no puede firmar la
capacidad *Push Notifications*. Se eliminó `aps-environment` de
`ios/frontend/frontend.entitlements`, que queda como `<dict/>`, con copia del original
guardada fuera del repositorio para restaurarlo. `services/notifications/
pushNotifications.ts` **no se tocó**: la funcionalidad push sigue intacta en el código del
producto.

**2. El bundle identifier oficial no se pudo usar.** Al intentar firmar con
`com.havit.app`, Xcode lo rechazó:

```
error: Failed Registering Bundle Identifier: The app identifier "com.havit.app" cannot be
registered to your development team because it is not available.
error: No profiles for 'com.havit.app' were found
```

Ese identificador pertenece a otro equipo de desarrollo. Se compiló con
`com.havit.app.b8local`, pasado **como variable a `xcodebuild`**
(`PRODUCT_BUNDLE_IDENTIFIER=...`), de modo que ni el `pbxproj` ni `app.json` cambiaron: el
identificador oficial del proyecto sigue siendo `com.havit.app`.

Con esos dos ajustes la firma salió adelante: Xcode creó el certificado de desarrollo
(`1 valid identities found`) y el perfil
`iOS Team Provisioning Profile: com.havit.app.b8local`, sin un solo error de
aprovisionamiento.

> **Consecuencia que conviene tener presente al leer los resultados.** La app instalada en
> el iPhone tiene un bundle identifier distinto del de producción. Para los 13 flujos que
> se van a probar eso es indiferente, pero **no** lo sería para nada que dependa del
> identificador: notificaciones push, deep links asociados a dominios o compras.

**Limitaciones de la cuenta gratuita, registradas y no negociables:**

| Límite | Efecto en B8 |
| --- | --- |
| No firma *Push Notifications* | **F13 (notificaciones push) NO SE PUEDE PROBAR.** Queda como **NO COMPLETADO**, nunca como aprobado |
| El perfil caduca a los **7 días** | **Medido**, no citado: el perfil creado el **25-10-2026 15:30** caduca el **01-11-2026 15:30**. Pasado el plazo la app deja de abrirse y hay que reinstalar |
| Bundle identifier distinto | Lo descrito arriba |

A esto se suman, por el entorno de pruebas aislado y no por la cuenta: **F11 (subir
fotografía)** y **F12 (estados de moderación)** tampoco son verificables, porque las
credenciales de Cloudflare R2 y OpenAI se anularon a propósito para no usar servicios
reales (§9.4.2). **F10 (capturar la fotografía)** sí, porque la captura ocurre en el
dispositivo.

Es decir: de los 14 flujos de §10.2, **11 son verificables** en este montaje, y 3 quedan
fuera por límites documentados, no por falta de ejecución.

### 9.3 Paso 3 — generar el proyecto, firmar y ejecutar

```bash
cd frontend
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
export LANG=en_US.UTF-8

# La URL de la API se incrusta AQUI, en el prebuild. Apuntarla al backend local
# es lo que impide que la build de pruebas hable con produccion (§9.4.1).
export EXPO_PUBLIC_API_URL=http://192.168.5.94:3100

npx expo prebuild --platform ios --clean
cd ios && pod install && cd ..   # obligatorio tras cada --clean (§7.1.1)
```

Comprobar **antes de compilar** que la URL incrustada es la local:

```bash
npx expo config --json | python3 -c "import sys,json; print(json.load(sys.stdin)['extra']['apiUrl'])"
# debe imprimir http://192.168.5.94:3100 — si imprime 20.63.84.1, PARAR
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
### 9.4.2 Backend de pruebas local: arrancado y verificado

Arrancado **sin modificar ni un archivo**, solo con variables de entorno temporales en la
invocación, y con `start:dev` en lugar de `dev` para no disparar el hook `predev` que
ejecuta `db:migrate` (la base ya está al día, así que habría sido un no-op, pero no hacía
falta tocarla):

```bash
cd backend
env DB_HOST=127.0.0.1 DB_PORT=5432 DB_USERNAME=ale DB_PASSWORD=local \
    DB_DATABASE=havit_b4_test DB_SSL=false DB_POOL_HOST= DB_POOL_PORT= \
    JWT_SECRET=b8-local-test-only-not-a-production-secret \
    CLOUDFLARE_R2_ACCESS_KEY_ID= CLOUDFLARE_R2_SECRET_ACCESS_KEY= \
    CLOUDFLARE_R2_ACCOUNT_ID= CLOUDFLARE_R2_BUCKET_NAME= CLOUDFLARE_R2_PUBLIC_URL= \
    OPENAI_API_KEY= REDIS_URL= PORT=3100 \
    npm run start:dev
```

Las variables del proceso ganan sobre el `.env` versionado porque `app.module.ts` lee
`process.env` directamente, y `ConfigModule` carga el `.env` sin sobreescribir lo que ya
está en el entorno. Las obligatorias son solo `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD`,
`DB_DATABASE` y `JWT_SECRET` (`src/config/env.validation.ts`); `DB_PASSWORD` tiene que ir
no vacía aunque la PostgreSQL local use autenticación *trust*, porque la validación
rechaza una cadena vacía.

Resultado (**medido**): `Nest application successfully started`, y

```
GET /health        -> {"status":"ok","uptimeSeconds":32}
GET /health/ready  -> {"status":"ok","checks":{"database":"up","redis":"disabled"}}
```

`database: up` confirma que habla con la PostgreSQL local, y `redis: disabled` que el
limitador cayó a memoria en vez de buscar un Redis externo.

**Conflicto de puerto encontrado, y es importante.** En el primer arranque (puerto 3000)
había **otra aplicación del usuario** escuchando en `[::1]:3000` — otra app web, con una
CSP que apunta a `localhost:3001` y una redirección `307` a `/es/login`. El nombre
`MacBook-Pro-de-Alejandro-2.local` resuelve primero a `::1`, así que una petición a ese
nombre llegaba a **esa** app y no al backend de Havit, que había quedado en `*:3000` sobre
IPv4. Un "funciona" por ahí habría sido un falso positivo contra la app equivocada. El
backend de pruebas se movió a **3100**, libre, sin tocar la otra aplicación.

| Ruta | Resultado |
| --- | --- |
| `http://127.0.0.1:3100` | responde |
| `http://192.168.5.94:3100` (IP LAN, la que alcanza el iPhone) | **responde** |
| `http://MacBook-Pro-de-Alejandro-2.local:3100` | desde el propio Mac resuelve a *loopback*, no a la IP LAN; desde el iPhone mDNS debería dar la IP LAN, pero **está sin verificar** |

**Servicios externos desactivados a propósito** (condición: no usar servicios reales). Con
`CLOUDFLARE_R2_*` y `OPENAI_API_KEY` vacíos, el backend arranca igual porque no están entre
las obligatorias, pero eso tiene una consecuencia que hay que aceptar de antemano: **los
flujos F11 (subir foto) y F12 (estado de moderación) no se podrán validar** contra este
entorno, porque dependen de Cloudflare R2 y de OpenAI. F10 (capturar la foto con la cámara)
sí se puede probar, porque la captura es local al dispositivo.

### 9.4.3 Impedir que una build de pruebas caiga en el fallback de producción

El riesgo es el `FALLBACK_API_URL` codificado en `services/api.ts` (§9.4.1). La buena
noticia es que **en iOS la protección ya existe y no hay que programar nada**: el fallback
es `http://20.63.84.1:3000`, texto en claro contra una **IP pública**, y eso es exactamente
lo que ATS rechaza con `NSAllowsArbitraryLoads: false`. Es decir:

- si la configuración resuelve bien, la app habla con el backend local;
- si fallara y cayese al fallback, **ATS corta la petición** y el fallo se ve, en lugar de
  que la app escriba en producción en silencio.

Así que la medida correcta aquí es **no debilitar ATS**, que es justo lo que se pedía: la
misma regla que obliga a usar un backend local es la que bloquea el fallback. No se toca
`services/api.ts`, que además es territorio de B3.

En **Android la situación es la contraria**: el APK lleva `usesCleartextTraffic=true`
(§7.1.2), así que el fallback de producción **sí sería alcanzable**. Para el APK local
conviene no ejecutar flujos que creen datos hasta que B3 cierre el transporte, o
verificarlo antes como se indica abajo.

**Verificación efectiva, sin modificar la app** (y la que responde a la condición de
comprobar la configuración antes de instalar): el propio log del backend local es la
prueba. Si el teléfono está hablando con la API local, sus peticiones aparecen ahí; si no
aparece ninguna, no está usando la API local. Combinado con ATS en iOS, eso cubre los dos
casos: o se ve el tráfico en local, o no hay tráfico en ningún sitio.

### 9.4.5 `havit_b8_test`: base exclusiva de B8, creada y verificada

Resuelve la decisión de §9.4.4: en vez de reutilizar `havit_b4_test` con sus 360 usuarios
de B4, se creó una base nueva y limpia para B8. Comprobaciones hechas **antes** de crear
nada:

| Comprobación | Resultado |
| --- | --- |
| El servidor es local | `listen_addresses = localhost`, `inet_server_addr()` vacío (socket unix). **No se expone fuera de la máquina** |
| Autenticación TCP local | `host all all 127.0.0.1 trust` — por eso el valor de `DB_PASSWORD` lo ignora Postgres y **no es un secreto real** |
| `havit_b8_test` ya existía | **no** (`COUNT(*) = 0` en `pg_database`) |
| Bases existentes intactas tras la operación | `havit_b4_test` sigue con 62 tablas, `havit_perf` con 53 |

Creación, con rol de desarrollo **independiente** (no se reutiliza `ale`):

```sql
CREATE ROLE havit_b8 LOGIN PASSWORD '<valor local, trust lo ignora>';
CREATE DATABASE havit_b8_test OWNER havit_b8;
```

Migraciones aplicadas con el runner del propio proyecto, apuntado explícitamente a esa
base y solo a ella:

```bash
cd backend
env DB_HOST=127.0.0.1 DB_PORT=5432 DB_USERNAME=havit_b8 DB_PASSWORD=<local> \
    DB_DATABASE=havit_b8_test DB_SSL=false DB_POOL_HOST= DB_POOL_PORT= \
    npm run db:migrate
# -> [db] applied 66 file(s)
```

El runner acepta `DB_SSL=false` para una Postgres local (`database/scripts/lib.js`,
`resolveDbSsl`), así que **no hizo falta modificar código**.

Estado resultante (**medido**):

| Comprobación | Resultado |
| --- | --- |
| Estructura | **62 tablas** en el schema `havit` (igual que `havit_b4_test`) |
| Migraciones | **66 registradas** = los 66 ficheros del repositorio |
| Datos de referencia | 27 ejercicios, 6 tipos de métrica, 16 tipos de notificación |
| Datos de usuario | **0 usuarios, 0 retos, 0 registros** — borrón y cuenta nueva |

### 9.4.6 Backend apuntado a `havit_b8_test`

Mismas variables temporales que §9.4.2, cambiando la base y el rol. Verificado:

| Comprobación | Resultado |
| --- | --- |
| `GET /health` | `{"status":"ok"}` |
| `GET /health/ready` | `{"status":"ok","checks":{"database":"up","redis":"disabled"}}` |
| Accesible desde la red local | `http://192.168.5.94:3100/health` responde |
| Sesión vista por Postgres | **`havit_b8 | 127.0.0.1/32`** — el rol propio, por TCP local |
| Conexiones de red del proceso | **una sola**: `*:3100 (LISTEN)`. Ninguna remota, ninguna a Azure |
| Servicios externos | Redis deshabilitado; `CLOUDFLARE_R2_*` y `OPENAI_API_KEY` vacíos |

El puerto sigue siendo **3100**, no 3000, por el conflicto con la otra aplicación del
usuario descrito en §9.4.2.

### 9.4.7 Protección verificable contra conexiones a producción

ATS por sí solo no basta como garantía: bloquea el fallback en iOS, pero no en Android, y
razonar solo sobre él es frágil. Esta es una protección en tres capas, **todas
verificables**, y ninguna modifica código de B3.

**El proyecto ya traía el mecanismo correcto**, y conviene conocerlo porque incluye una
trampa:

- `scripts/dev-local.js` detecta la IP LAN y escribe `.env.local` con
  `EXPO_PUBLIC_API_URL`. `.env.local` está en `.gitignore` (`.env*.local`), así que es
  per-máquina y no ensucia el repositorio.
- `scripts/dev-server.js` **borra** `.env.local` para volver a la URL pública del `.env`.

> **Trampa operativa, y es la más peligrosa de todo B8.** `dev-server.js` se ejecuta
> automáticamente antes de `npm start`, `npm run start:server`, `npm run android`,
> `npm run ios` y `npm run web`. Cualquiera de esos comandos **borra `.env.local` y
> devuelve la app a la URL pública de producción**, en silencio. Durante las pruebas hay
> que arrancar con **`npx expo start --dev-client`**, nunca con `npm start`.
>
> Además `dev-local.js` fija `BACKEND_PORT = 3000`, así que `npm run start:local` generaría
> `http://192.168.5.94:3000` — que en esta máquina es **la otra aplicación del usuario**,
> no Havit (§9.4.2). Por eso `.env.local` se escribió a mano con el puerto 3100.

**Capa 1 — configuración (verificable antes de compilar).**

```bash
cat .env.local
# EXPO_PUBLIC_API_URL=http://192.168.5.94:3100

npx expo config --json | python3 -c "import sys,json; print(json.load(sys.stdin)['extra']['apiUrl'])"
# http://192.168.5.94:3100        <- si imprime 20.63.84.1, PARAR
```

**Capa 2 — lo que Metro sirve en ejecución (verificable con la app ya instalada).** En una
development build el JS y la configuración vienen del servidor de Metro, así que esta es la
verdad operativa, no la teoría:

```bash
curl -s -H "expo-platform: ios" http://127.0.0.1:8081/ | grep -o '"apiUrl":"[^"]*"'
# "apiUrl":"http://192.168.5.94:3100"
```

Verificado: el manifiesto servido contiene la URL local, y el log de Metro confirma
`env: load .env.local .env`.

**Capa 3 — prueba observable, la que no se puede falsear.** `havit_b8_test` arranca con
**0 usuarios, 0 retos y 0 registros** (§9.4.5). Por tanto:

```bash
# antes de cada flujo que cree datos
psql -d havit_b8_test -t -A -c "SELECT COUNT(*) FROM havit.users;"
```

Si tras registrarse en el teléfono ese contador **sube**, la app escribió en la base local:
queda demostrado, no supuesto. Si **no sube**, la app no está hablando con el backend local
y hay que parar antes de seguir. El log del backend local da la misma señal en tiempo real.

**Cómo se comporta el fallback si falta la configuración** (condición 4.4). Hay dos capas
de respaldo y **las dos apuntan a producción**:

1. `app.config.js`: `process.env.EXPO_PUBLIC_API_URL ?? 'http://20.63.84.1:3000'`. Sin la
   variable, `extra.apiUrl` **es** la URL pública. Medido en §9.4.1.
2. `services/api.ts`: `extra.apiUrl ?? FALLBACK_API_URL`. Solo actúa si la resolución de
   configuración falla por completo.

Con `.env.local` presente, la capa 1 nunca cae al respaldo, y como `extra.apiUrl` queda
definido, la capa 2 tampoco. Eso es determinista, no probabilístico: es lo que verifican las
capas 1 y 2 de arriba.

**ATS queda como red de seguridad, no como garantía.** En iOS rechaza texto en claro contra
la IP pública, así que un fallback accidental fallaría de forma visible en lugar de escribir
en producción. En **Android no protege**: el APK lleva `usesCleartextTraffic=true`
(§7.1.2), de modo que allí la garantía son exclusivamente las capas 1 a 3.

### 9.4.4 La decisión que falta sobre la base de datos

`havit_b4_test` **es local y de pruebas**, comprobado: servidor por socket unix
(`inet_server_addr()` vacío), propietario `ale`, 13 MB, y 66 migraciones al día.

Pero **contiene datos**: 360 usuarios, 52 retos y 26 registros de entrenamiento, de las
pruebas de B4. Por eso B8 la ha usado **solo en lectura** para verificar conectividad, y no
ha ejecutado ningún flujo que escriba. Decidir si esos datos son prescindibles no le
corresponde a B8: hace falta confirmación antes de ejecutar F1, F7, F9 o F11 contra ella, o
bien crear una base nueva para B8.

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

## 9.5 Incidencia B8-I1: `POST /challenges` devuelve 500 en el entorno de pruebas

Detectada durante la prueba física en el iPhone, al crear un reto desde la app.

### Evidencia del backend

```
9:44:07 PM  LOG [ChallengesService] Creating challenge with name: Holy fuck
9:44:07 PM  LOG [HTTP] POST /challenges 500 +3ms
9:44:47 PM  LOG [ChallengesService] Creating challenge with name: Holy fuck
9:44:47 PM  LOG [HTTP] POST /challenges 500 +5ms
```

El dato que orienta el diagnóstico: **3 y 5 ms**. Demasiado rápido para un fallo de base de
datos o un tiempo de espera de red; es una excepción lanzada de inmediato.

### Excepción real y cadena de llamada

```
src/challenges/challenges.service.ts:107  async create(dto, userId)
                                   :108    logger.log('Creating challenge with name: ...')  ← última línea que se ve
                                   :120    await this.moderationService.assertTextAllowed([dto.name, ...])
src/openai/moderation.service.ts   :236  assertTextAllowed -> validateText -> getClient()
                                   :77     const apiKey = process.env.OPENAI_API_KEY;
                                   :79     if (!apiKey) throw new InternalServerErrorException(
                                              'OPENAI_API_KEY is not configured');
```

La creación de un reto **modera sincrónicamente** los textos públicos antes de persistir
nada. Es trabajo de B3, según el comentario del propio código
(*"B3: moderate the public text fields synchronously"*), y el diseño es **fail-closed** a
propósito: *"if OpenAI can't be reached, validateText()'s 503 propagates and nothing is
saved."*

### Causa

`OPENAI_API_KEY` está **vacía**, porque B8 la anuló deliberadamente al montar el entorno
aislado, para cumplir la condición de no usar servicios externos reales (§9.4.2). Con la
clave vacía, `getClient()` lanza antes de hacer ninguna llamada de red.

### Clasificación

| Pregunta | Respuesta |
| --- | --- |
| ¿Es un defecto del código? | **No.** Es comportamiento intencionado, especificado y **cubierto por un test**: `src/openai/moderation.service.spec.ts:107`, *"should throw 500 when OPENAI_API_KEY is missing"* |
| ¿Lo introdujo B8? | **No en el código.** B8 no ha tocado el backend. Lo provoca la **configuración del entorno de pruebas** que B8 montó, al vaciar la clave a propósito |
| ¿Es preexistente? | **No** en un entorno con la clave configurada. En producción, con clave real, este camino no falla |
| ¿Específico del entorno? | **Sí.** Es la consecuencia esperada de aislar los servicios externos |
| ¿Relacionado con `havit_b8_test`, migraciones o datos de referencia? | **No.** Ni la base ni los seeds intervienen: la excepción ocurre antes de abrir transacción |

### Qué bloquea, y qué no

**Crear un reto no es ninguno de los 14 flujos** exigidos por el criterio de B8. Pero sí
bloquea indirectamente a dos que sí lo son, porque `havit_b8_test` tiene **0 retos** y no
hay forma de crear uno desde la app:

- **F7 (unirse a retos)** — necesita que exista al menos un reto.
- **F9 (registrar entrenamientos)** — el progreso se registra contra un reto.

### Solución mínima recomendada

No hay salida por configuración: `OPENAI_API_KEY` es la **única** variable de entorno en
toda esa ruta (comprobado sobre `src/openai/` y `src/challenges/`), y **no existe ningún
flag para desactivar la moderación**.

| Opción | Valoración |
| --- | --- |
| **Insertar un reto de prueba directamente en `havit_b8_test`** | **Recomendada.** No toca código, ni migraciones versionadas, ni servicios externos; son datos en una base local aislada creada para esto. Desbloquea F7 y F9. **Requiere autorización** |
| Configurar una `OPENAI_API_KEY` real | Descartada: contradice la condición de no usar servicios externos reales |
| Añadir un flag de bypass de moderación en el backend | Descartada: modifica el backend, queda fuera del alcance de B8 y debilitaría una comprobación de seguridad de B3 |

Mientras no se decida, F7 y F9 quedan **NO EJECUTADOS**, no fallidos.

### Hallazgo secundario: el 500 no deja rastro en el log

`grep -c "ExceptionsHandler"` sobre el log del backend devuelve **0**. El filtro
`src/common/filters/http-exception.filter.ts` registra `warn` para los 4xx y `error` con
stack para las excepciones no controladas, pero una `HttpException` **con estado 500**
—como esta `InternalServerErrorException`— entra por la primera rama, que extrae el mensaje
**sin registrar nada**. Es decir: un 500 lanzado deliberadamente es invisible en el log del
servidor.

Diagnosticarlo requirió leer el código, no el log. Es una laguna de observabilidad real,
**fuera del alcance de B8** y sin corregir: queda anotada para quien corresponda.

## 9.6 Datos de prueba B8: el reto `[B8-TEST]`

Creados para desbloquear F6, F7, F8 y F9, que quedaban bloqueados por la incidencia B8-I1
(§9.5). **Solo datos**: ni código, ni migraciones, ni seeds versionados, ni configuración de
seguridad. La moderación del backend **no** se ha desactivado ni evadido.

### Verificación de destino antes de escribir

```
base: havit_b8_test | usuario: havit_b8 | host: 127.0.0.1/32 | puerto: 5432
listen_addresses: localhost
```

`havit_b4_test`, `havit_perf` y `havit_b4_audit_…` no se tocaron: 0 conexiones y sus
conteos intactos.

### Por qué no basta una fila en `challenges`

La estructura coherente se tomó de `ChallengesService.create()`
(`src/challenges/challenges.service.ts:107`), que es la definición autorizada de lo que es
un reto válido: fila en `challenges`, fila de **propietario** en `challenge_user_map`, y
por cada día del ciclo una `routines` + `routine_exercises` + `routine_exercise_sets` +
`routine_exercise_set_targets`, más la fila en `challenge_cycle_days`.

**El propietario es un usuario de prueba aparte, no el del iPhone.** Si el reto fuese suyo,
ya sería miembro y **no podría unirse**, que es justo lo que F7 valida.

### Qué se insertó

| Tabla | Filas | Contenido |
| --- | --- | --- |
| `users` | 1 | `b8_test_owner` / `b8-test-owner@b8.local`. `password_hash` **no es un bcrypt válido**: iniciar sesión con esa cuenta es imposible |
| `challenges` | 1 | `[B8-TEST] Reto de prueba fisica` — `public`, `open`, activo, 7 días, ciclo de 3 |
| `challenge_user_map` | 1 | solo el propietario (`owner`/`active`) |
| `routines` | 2 | `[B8-TEST] Dia 1 - Fuerza`, `[B8-TEST] Dia 3 - Circuito` |
| `routine_exercises` | 3 | ejercicios 9, 23 y 27 del catálogo sembrado, modo `sets` |
| `routine_exercise_sets` | 9 | 3 series por ejercicio |
| `routine_exercise_set_targets` | 9 | objetivo de `reps` (12 y 10) |
| `challenge_cycle_days` | 3 | día 1 entrenamiento, día 2 **descanso** sin rutina, día 3 entrenamiento |
| `workout_logs` | **0** | ninguno: F9 debe ejecutarse desde el iPhone |

Todo en **una transacción** con 9 aserciones de integridad **antes** del `COMMIT`: número de
días, que ningún día de entrenamiento quede sin rutina, que el de descanso no tenga rutina,
conteos de ejercicios y series, que ninguna serie quede sin objetivo, que todos los
ejercicios existan y estén activos, que no haya participaciones ajenas al propietario, y que
no se haya creado ningún registro de entrenamiento.

Hubo un primer intento que **abortó** por suponer mal un tipo de columna
(`routines`/`routine_exercises` usan `bigint`, no `uuid`). La transacción hizo su trabajo:
`retos: 0 | rutinas: 0` tras el fallo, sin datos a medias.

### Confirmado en la API local

```
GET /challenges?limit=50   -> 1 reto: [B8-TEST] Reto de prueba fisica | public | open
GET /challenges/{id}       -> duracion 7, ciclo 3, 3 dias de ciclo con sus rutinas
```

Los endpoints que usarán las pruebas existen: `POST /challenges/:id/join` (F7) y
`POST /challenges/progress` (F9).

### Cómo eliminar estos datos después

Las claves ajenas hacen casi todo el trabajo. `challenges` cascadea a `challenge_cycle_days`,
`challenge_user_map`, `challenge_category_map`, `challenge_location_map`,
`challenge_invites` y `challenge_join_requests`; `routines` cascadea a `routine_exercises` →
`routine_exercise_sets` → `routine_exercise_set_targets`.

```sql
-- En havit_b8_test, como havit_b8. En este orden.
BEGIN;
DELETE FROM havit.challenges WHERE name LIKE '[B8-TEST]%';
DELETE FROM havit.routines   WHERE name LIKE '[B8-TEST]%';
DELETE FROM havit.users      WHERE username = 'b8_test_owner';
COMMIT;
```

> **Antes de borrar, dos advertencias.** `workout_logs.challenge_id` y
> `workout_logs.routine_id` son `ON DELETE SET NULL`: si el iPhone llegó a registrar
> entrenamientos (F9), esas filas **no se borran**, se quedan huérfanas con las referencias a
> `NULL`. Y no se puede borrar al propietario antes del reto, porque `challenges` lo
> referencia. Nada de esto afecta al usuario creado desde el iPhone ni a sus datos, que se
> identifican por su propio `id`.

Todo lo insertado lleva el prefijo `[B8-TEST]` en el nombre, o el dominio `b8.local` en el
caso del usuario, precisamente para que el borrado sea inequívoco.

### Lo que sigue bloqueado, y no se marca como aprobado

**Crear un reto desde la aplicación continúa fallando con HTTP 500** en este entorno, por la
ausencia de `OPENAI_API_KEY` (§9.5). Estos datos **no arreglan** esa incidencia: la rodean
para poder validar F6 a F9. El flujo de creación de retos **no se marca como aprobado** y la
causa queda registrada.

## 9.7 Incidencia B8-I2: `POST /uploads/sign` devuelve 500

Detectada al intentar subir la fotografía de evidencia desde el iPhone.

### Evidencia del backend

Aquí el backend **sí** registró el error, y con detalle estructurado:

```
10:00:54 PM ERROR [UploadsService] external_call service=r2 operation=presign
                   outcome=failure attempts=1 durationMs=15 error=Error
10:00:54 PM   LOG [HTTP] POST /uploads/sign 500 +18ms
```

### Endpoint y causa

**Endpoint exacto: `POST /uploads/sign`** — la firma previa (*presign*) de la URL de subida.

```
src/uploads/uploads.service.ts:203  private s3 = new S3Client({
                             :205    endpoint: `https://${process.env['CLOUDFLARE_R2_ACCOUNT_ID']}.r2.cloudflarestorage.com`,
                             :207    accessKeyId:     process.env['CLOUDFLARE_R2_ACCESS_KEY_ID'],
                             :208    secretAccessKey: process.env['CLOUDFLARE_R2_SECRET_ACCESS_KEY'],
```

Comprobado sobre el entorno del **proceso en ejecución**, no sobre un archivo:

```
CLOUDFLARE_R2_ACCOUNT_ID=(vacia)        CLOUDFLARE_R2_BUCKET_NAME=(vacia)
CLOUDFLARE_R2_ACCESS_KEY_ID=(vacia)     CLOUDFLARE_R2_PUBLIC_URL=(vacia)
CLOUDFLARE_R2_SECRET_ACCESS_KEY=(vacia) OPENAI_API_KEY=(vacia)
```

Con el id de cuenta vacío el *endpoint* queda como `https://.r2.cloudflarestorage.com`, y sin
credenciales la firma no puede generarse.

**No es OpenAI.** Era razonable sospecharlo, pero el log nombra `service=r2
operation=presign`, y la moderación actúa **después**, sobre la publicación. Al fallar la
subida, nunca se llegó a ella. En este 500 OpenAI no interviene.

### Clasificación

**Problema de configuración del entorno local**, no defecto funcional. Fundamento: la propia
instrumentación del servicio identifica el servicio y la operación que fallan, las seis
variables de R2 están demostrablemente vacías en el proceso, y se vaciaron a propósito al
montar el entorno aislado (§9.4.2). En un entorno con credenciales de R2 este camino no
falla.

## 9.8 F9 sí se registró: lo que dice la base frente a lo que se vio

Durante la prueba se percibió que el registro de entrenamiento **no llegó a completarse**,
porque el flujo se interrumpió al subir la fotografía. **La evidencia dice otra cosa.**

Secuencia real del log, siete segundos después del fallo de subida:

```
10:00:54 PM  POST /uploads/sign          500   <- falla la firma de subida (B8-I2)
10:01:01 PM  GET  /challenges/progress   200
10:01:03 PM  POST /workout-logs/progress 201   <- el progreso SI se registro
```

Y en la base local:

| Comprobación | Valor |
| --- | --- |
| `workout_logs` | **1 fila** (antes 0) |
| estado | **`completed`** |
| usuario | `pruebitaxd` (el del iPhone) |
| reto | `[B8-TEST] Reto de prueba fisica` |
| `local_day` | `2026-10-25` |
| `routine_id` / `challenge_cycle_day_id` | `NULL` |
| `workout_log_exercises` / métricas por serie | **0** |
| `workout_posts` | **0** (coherente: no hubo foto) |

**Y registrar un entrenamiento sin fotografía es un camino legítimo**, no un apaño: en
`src/workout-log/dto/create-workout-progress.dto.ts:60`, `imageUrl?: string` lleva
`@IsOptional()`. La app hizo exactamente eso — reintentó sin imagen — y el backend respondió
`201`. No se ha saltado ninguna regla de negocio.

Lo que **no** quedó registrado es el detalle por ejercicio: cero filas en
`workout_log_exercises` y cero métricas por serie. Ese detalle lo escribe la app por
separado (`services/metrics/applyExerciseMetrics.ts`) y en el log no hay ninguna llamada
correspondiente.

### Discrepancia resuelta: era el aviso, no el registro

Comprobado en el dispositivo: **la app muestra el día 1 del reto como completado.** Así que
el registro funcionó de extremo a extremo —backend, base de datos y interfaz coinciden— y
lo único que falló fue la subida de la fotografía (B8-I2).

Con eso, **F9 pasa a APROBADO**, con una salvedad que se mantiene: en esta ejecución no se
registró el detalle por ejercicio (0 filas en `workout_log_exercises`, 0 métricas por
serie). El día se marcó como completado, que es lo que la regla de negocio exige y lo que
F9 pide; el registro serie a serie es un camino distinto de la interfaz que no se
ejercitó.

> **Observación de usabilidad surgida de la prueba física, no de la lectura del código.**
> Durante la prueba se concluyó que el registro de entrenamiento había fallado, cuando en
> realidad se había guardado. El aviso de error de la subida de la foto tapó el éxito del
> registro, hasta el punto de que la persona que probaba dio por perdido el flujo completo.
> Es exactamente el tipo de hallazgo que solo aparece probando en un dispositivo real, y la
> clase de confusión que en producción llevaría a reintentos innecesarios.
>
> Queda como observación para el equipo de la app (territorio de B5/B9, no de B8). **No se
> ha corregido**: B8 no toca ese código.

## 10. Matriz de validación en dispositivos

Ningún dispositivo físico se ha probado. Toda la columna de resultado está **pendiente**.
Ninguna fila debe marcarse sin ejecutar el flujo en el teléfono.

### 10.1 Dispositivos

| # | Dispositivo | Modelo | SO | Tipo | Build | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| D1 | iPhone de Alejandro | iPhone 16 Pro Max (`iPhone17,2`) | **iOS 26.6.2** (confirmado por `devicectl`) | **físico** | development firmada localmente | **PENDIENTE DE VALIDACIÓN** — conectado y reconocido como destino compilable; falta **solo** la firma |
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

Resultados reales de la sesión del **25-10-2026** en **D1 (iPhone 16 Pro Max, iOS 26.6.2)**,
con build de desarrollo firmada localmente (`com.havit.app.b8local`) contra el backend local
`192.168.5.94:3100` y la base `havit_b8_test`. La evidencia es el log HTTP del backend más
los contadores de la base.

| # | Flujo | D1 iPhone | D2 Android | Evidencia / motivo |
| --- | --- | --- | --- | --- |
| F1 | Registro | **APROBADO** | pendiente | `POST /auth/register 200` y el usuario aparece en `havit_b8_test` (`9b31664d-…`, `pruebitaxd`). Contador **0 → 1 usuarios** |
| F2 | Login | **NO EJECUTADO** | pendiente | Los 5 `POST /auth/login 401` del log son intentos **previos** al registro, con una cuenta que no existía. Falta un login con credenciales válidas |
| F3 | Restauración de sesión | **NO EJECUTADO** | pendiente | Requiere cerrar y reabrir la app |
| F4 | Refresh de token (B4) | **NO EJECUTADO** | pendiente | Hay 1 fila en `refresh_tokens`, creada por el registro, pero **ninguna llamada a `/auth/refresh`** en el log |
| F5 | Logout | **NO EJECUTADO** | pendiente | Ninguna llamada a `/auth/logout` |
| F6 | Explorar retos | **APROBADO** | pendiente | Observado en el dispositivo: el reto `[B8-TEST]` aparece en la lista. `GET /challenges?limit=50 200` con 1 reto devuelto |
| F7 | Unirse a un reto | **APROBADO** | pendiente | `POST /challenges/{id}/join 201` y la fila existe en la base: `pruebitaxd | participant | active | 16:00:16`. **No la insertó B8**: solo se había insertado el propietario |
| F8 | Consultar rutinas | **APROBADO** | pendiente | Observado con datos reales. `GET /routine/today/{id} 200`, `GET /routine/2 200`, y además se ejercitó la sustitución de ejercicios: `/exercises/location-availability?exerciseIds=9,23`, `/exercises/9/alternatives?location=home`, `/routine/today/{id}?location=home&substitutions=9:26` |
| F9 | Registrar entrenamiento | **APROBADO** | pendiente | `POST /workout-logs/progress 201`, **1 fila `completed`** en la base y **la app muestra el día 1 como completado**: backend, base e interfaz coinciden. Sin fotografía, que es camino legítimo (`imageUrl` es `@IsOptional()`). Salvedad: no se registró el detalle por ejercicio (§9.8) |
| F10 | Capturar foto con la cámara | **APROBADO** | pendiente | Observado en el dispositivo: la app solicita el permiso de cámara y permite capturar. Valida los textos en español de §9.2.3 |
| F11 | Subir foto de evidencia | **NO COMPLETADO** | pendiente | Ejecutado y **fallido**: `POST /uploads/sign 500`, con `ERROR [UploadsService] external_call service=r2 operation=presign outcome=failure`. Causa: credenciales de R2 vacías a propósito (§9.7). Problema de **configuración local**, no defecto funcional |
| F12 | Estado de moderación | **NO COMPLETADO** | pendiente | Fuera de alcance: `OPENAI_API_KEY` anulada a propósito. Es la misma causa que B8-I1 |
| F13 | Notificaciones push | **NO COMPLETADO** | pendiente | Un Personal Team gratuito no puede firmar la capacidad (§9.2.6). **No se marcará como aprobado** |
| F14 | Navegación principal y perfil | **APROBADO** | pendiente | Recorrido real con respuestas 200: `GET /users/me`, `/feed`, `/users/me/challenges`, `/workout-posts/mine`, `/follows/following/streaks`, `/notifications/unread-count`, `PATCH /users/me/profile`, `GET /workout-posts/user/9b31664d-…` |

**Recuento tras la segunda sesión: 7 aprobados, 4 no ejecutados y 3 no completables.**
Aprobados: **F1** registro, **F6** explorar retos, **F7** unirse, **F8** consultar rutinas,
**F9** registrar entrenamiento, **F10** cámara y **F14** navegación y perfil. Eso cubre el
camino principal de la app, de principio a fin, en un dispositivo físico real y contra un
backend local aislado.

Sin ejecutar siguen F2 (login con credenciales válidas), F3 (restauración de sesión), F4
(refresh) y F5 (logout) — los cuatro de B4, que **no dependen de ningún bloqueo** y pueden
hacerse en cualquier momento.

No completables por límites documentados: F11 (R2 vacío), F12 (OpenAI vacío) y F13 (cuenta
Apple gratuita).

> **Lo que esta sesión demostró sobre el aislamiento.** Los contadores pasaron de
> `0 usuarios / 0 tokens` a `1 usuario / 1 token` **en `havit_b8_test`**, mientras
> `havit_b4_test` sigue con sus 360 usuarios sin tocar. La capa 3 de §9.4.7 funcionó: la app
> del teléfono escribió en la base local y en ninguna otra. Ninguna petición salió hacia
> `20.63.84.1`.

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
| B-6 | ~~iPhone no conectado~~ | — | **RESUELTO**: conectado, confiado y con Modo de desarrollador `enabled` (§9.2.4) |
| B-7 | B3 sin mergear + API en HTTP | que iOS llegue al backend (§4.4, §9.4) | merge de B3 o backend en red local |
| B-8 | Toolchain Android local incompleto | la build local y el emulador | plataforma `android-35` + `cmdline-tools` |
| B-11 | ~~Componente de plataforma iOS no instalado en Xcode~~ | — | **RESUELTO**: runtime `iOS 26.4.1 (23E254a)` instalado (7,9 GB, *Ready*) y `-showdestinations` ya ofrece `Any iOS Device` |
| B-9 | ~~Soporte de iOS 26.6.2 en Xcode 26.4.1 sin confirmar~~ | — | **RESUELTO**: el iPhone aparece como destino disponible en `-showdestinations` (§9.2.4). No hace falta actualizar Xcode |
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
| 3. iOS | **IMPLEMENTADO, PENDIENTE DE FIRMA Y DISPOSITIVO** | **El proyecto compila**: `BUILD SUCCEEDED` contra simulador iOS 26.4.1, y los cambios de B8 verificados en el `Info.plist` del binario (§9.2.3). B-11 resuelto. Falta conectar el teléfono (B-6), la firma con cuenta Apple, y —solo para push— cuenta de pago (B-5). El soporte de Xcode 26.4.1 para iOS 26.6.2 sigue sin confirmar (B-9) |
| 4. Hardware y mínimos | **PARCIAL** | mínimos reales **medidos y confirmados en el APK** (API 24 / target 36 / iOS 16.4). Tamaño del APK universal medido (173 MB, con el desglose por ABI). Memoria, tamaño instalado, arranque, Wi-Fi y datos móviles: **pendientes**, requieren la app corriendo |
| 5. Configuración nativa (permisos, plugins) | **COMPLETADO Y VERIFICADO** en Android; **pendiente de prueba física** en iOS | los tres permisos sobrantes **se comprobaron ausentes del APK construido** (§7.1.3), no solo del manifest de partida. En iOS los textos están en el `Info.plist` generado, pero el diálogo real no se ha visto |
| 6. Documentación y matriz | **COMPLETADO** | este documento; la matriz está creada con todas sus filas en pendiente, como corresponde |

**B8 no está terminado.** Lo que depende de dependencias, configuración y herramientas
está hecho y verificado, y en Android la verificación llega hasta un APK real construido y
analizado. Lo que depende de un dispositivo físico, de una cuenta de Apple o de B3 no está
hecho, y no se presenta como si lo estuviera: las 14 filas de flujos de §10.2 siguen todas
en pendiente para los dos dispositivos.
