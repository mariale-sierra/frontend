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
  // Pinned to what Expo SDK 57 resolves to on its own (minSdk 24 / target 35 /
  // compile 35, iOS 16.4). Pinning does not change the build; it makes a future
  // patch bump that moves the floor show up as a failing test rather than as a
  // silently narrower device list.
  const buildProperties = plugin('expo-build-properties');

  it('pins the Android SDK levels measured from prebuild', () => {
    expect(buildProperties.android).toMatchObject({
      minSdkVersion: 24,
      compileSdkVersion: 35,
      targetSdkVersion: 35,
    });
  });

  it('pins the iOS deployment target measured from prebuild', () => {
    expect(buildProperties.ios).toMatchObject({ deploymentTarget: '16.4' });
  });
});

describe('B8 — iOS permission prompts', () => {
  // iOS shows these strings in the system prompt. Without them the app crashes the
  // first time it touches the camera; with Expo's English defaults it would prompt in
  // English inside a Spanish-first app (i18n/index.ts falls back to 'es').
  const locales = expoConfig.locales as Record<string, string>;

  it('registers a locale file per supported language', () => {
    expect(Object.keys(locales).sort()).toEqual(['en', 'es']);
  });

  it.each(Object.entries(locales))('%s describes every permission it prompts for', (_lang, file) => {
    const strings = JSON.parse(readFileSync(join(__dirname, '..', file), 'utf8')) as Record<
      string,
      string
    >;
    expect(Object.keys(strings).sort()).toEqual([
      'NSCameraUsageDescription',
      'NSPhotoLibraryAddUsageDescription',
      'NSPhotoLibraryUsageDescription',
    ]);
    for (const value of Object.values(strings)) expect(value.trim()).not.toBe('');
  });

  it('keeps the same keys in both languages', () => {
    const keysFor = (file: string) =>
      Object.keys(
        JSON.parse(readFileSync(join(__dirname, '..', file), 'utf8')) as Record<string, string>,
      ).sort();
    expect(keysFor(locales.es)).toEqual(keysFor(locales.en));
  });

  it('does not declare a microphone description it no longer needs', () => {
    for (const file of Object.values(locales)) {
      const strings = JSON.parse(readFileSync(join(__dirname, '..', file), 'utf8')) as Record<
        string,
        string
      >;
      expect(strings.NSMicrophoneUsageDescription).toBeUndefined();
    }
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
