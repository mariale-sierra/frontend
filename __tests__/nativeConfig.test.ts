// B8: the native-compatibility invariants of app.json.
//
// These are config assertions, not device tests: they fix the values that a physical
// Android/iOS build depends on, so a dependency bump or a careless edit to app.json
// fails here instead of in an APK nobody re-checked. The measured values they pin come
// from `expo prebuild` against Expo SDK 57 (android/gradle.properties and
// ios/*.xcodeproj/project.pbxproj) — see docs/sprint-10/B8-compatibilidad-movil.md.
import { readFileSync } from 'fs';
import { join } from 'path';
import appJson from '../app.json';

const expoConfig = appJson.expo;

// app.json is imported as a value, so TypeScript narrows every plugin entry to its own
// literal tuple type. Widen once here instead of fighting that at each call site.
type PluginEntry = string | [string, Record<string, unknown>];

function plugin(name: string): Record<string, unknown> {
  const entries = expoConfig.plugins as unknown as PluginEntry[];
  const entry = entries.find((p) => Array.isArray(p) && p[0] === name);
  if (!Array.isArray(entry)) {
    throw new Error(`app.json declares no "${name}" plugin entry with props`);
  }
  return entry[1];
}

describe('B8 — Android permissions', () => {
  // HAVIT photographs workout evidence and picks a profile image. It never records
  // video or audio, never writes to the gallery, and never draws over other apps —
  // but Expo's base manifest template ships SYSTEM_ALERT_WINDOW,
  // WRITE_EXTERNAL_STORAGE and RECORD_AUDIO as "optional" defaults. Declaring the
  // permission list explicitly is what keeps them out of the built manifest.
  it('declares only the permissions the app actually uses', () => {
    expect(expoConfig.android.permissions).toEqual([
      'android.permission.INTERNET',
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.VIBRATE',
    ]);
  });

  it('blocks the unused permissions inherited from the Expo template', () => {
    expect(expoConfig.android.blockedPermissions).toEqual([
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.RECORD_AUDIO',
    ]);
  });

  it('does not ask for the microphone: the camera takes photos, not video', () => {
    expect(plugin('expo-camera').microphonePermission).toBe(false);
    expect(plugin('expo-camera').recordAudioAndroid).toBe(false);
    expect(plugin('expo-image-picker').microphonePermission).toBe(false);
  });
});

describe('B8 — minimum supported OS versions', () => {
  // Pinned to what Expo SDK 57 resolves to on its own, read from Gradle's own
  // `[ExpoRootProject] Using the following versions` line with the pins removed
  // (minSdk 24 / compile 36 / target 36) and from the generated pbxproj (iOS 16.4).
  // Do NOT lower compileSdk: expo-camera pulls androidx.camera 1.6.0, which refuses
  // to be compiled against anything below 36 — `:app:checkReleaseAarMetadata` fails.
  // Pinning does not change the build; it makes a future patch bump that moves the
  // floor show up as a failing test rather than as a silently narrower device list.
  const buildProperties = plugin('expo-build-properties');

  it('pins the Android SDK levels measured from prebuild', () => {
    expect(buildProperties.android).toMatchObject({
      minSdkVersion: 24,
      compileSdkVersion: 36,
      targetSdkVersion: 36,
    });
  });

  it('pins the iOS deployment target measured from prebuild', () => {
    expect(buildProperties.ios).toMatchObject({ deploymentTarget: '16.4' });
  });
});

describe('B8 — iOS permission prompts', () => {
  // iOS shows these strings in the system prompt, and without them the app crashes the
  // first time it touches the camera. They come from the expo-camera / expo-image-picker
  // plugin props, which is what writes them into the generated Info.plist.
  //
  // They are deliberately NOT localised through app.json's `locales` key. That key is for
  // the app name: Expo applies it to Android too, writing every key into
  // res/values-b+<lang>/strings.xml with no counterpart in the default locale, and
  // `:app:lintVitalRelease` then fails a release build with ExtraTranslation. The app's
  // fallback language is Spanish (i18n/index.ts), so Spanish is the right single text.
  const descriptions = [
    ['expo-camera', 'cameraPermission'],
    ['expo-image-picker', 'photosPermission'],
  ] as const;

  it.each(descriptions)('%s describes why HAVIT needs the permission', (name, prop) => {
    const value = plugin(name)[prop];
    expect(typeof value).toBe('string');
    expect((value as string).trim().length).toBeGreaterThan(20);
    expect(value).toMatch(/HAVIT/);
  });

  it('does not reintroduce the locales key, which breaks the Android release build', () => {
    expect('locales' in expoConfig).toBe(false);
  });
});

describe('B8 — hardware expectations', () => {
  it('is portrait-only', () => {
    expect(expoConfig.orientation).toBe('portrait');
  });

  it('keeps one application identifier across both platforms', () => {
    expect(expoConfig.ios.bundleIdentifier).toBe('com.havit.app');
    expect(expoConfig.android.package).toBe('com.havit.app');
  });

  it('carries the EAS project id that push notifications need', () => {
    expect(expoConfig.extra.eas.projectId).toMatch(/^[0-9a-f-]{36}$/);
  });
});
