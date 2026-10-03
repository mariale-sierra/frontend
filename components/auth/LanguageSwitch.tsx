import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Row } from '../layout/row';
import { Text } from '../ui/text';
import i18n, { PREFERRED_LANGUAGE_KEY } from '../../i18n';
import type { SupportedLanguage } from '../../i18n';
import { storage } from '../../utils/storage';

const LANGUAGES: { code: SupportedLanguage; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
];

/**
 * The login/register flow's own language switch — plain text links, no
 * pill/segmented-control background, per explicit "besides each other and
 * centered... I want the selected option marked in paper, no button shaped
 * pills." Deliberately NOT `profile/edit.tsx`'s existing toggle
 * (`languageToggle`/`languageOption` styles there): that one is a real
 * segmented control with a filled pill per option, exactly the look this
 * was asked NOT to have — this is a new, separate visual treatment for a
 * different spot, not a copy of that one.
 *
 * Reuses that screen's own underlying mechanism as-is, though — not a
 * second implementation of it: `i18n.changeLanguage` (live-switches every
 * mounted screen's strings immediately) + persisting the choice under
 * `PREFERRED_LANGUAGE_KEY` (restored on boot in app/_layout.tsx), the exact
 * same two calls `profile/edit.tsx`'s toggle already makes.
 */
export function LanguageSwitch() {
  const { i18n: i18nInstance } = useTranslation();
  const current: SupportedLanguage = i18nInstance.language === 'es' ? 'es' : 'en';

  function selectLanguage(code: SupportedLanguage) {
    if (code === current) return;
    i18n.changeLanguage(code);
    storage.setItem(PREFERRED_LANGUAGE_KEY, code).catch((error) => {
      console.error('[LanguageSwitch] failed to persist language choice', error);
    });
  }

  return (
    <Row gap="sm" align="center" justify="center">
      {LANGUAGES.map(({ code, label }, index) => (
        <Row key={code} gap="sm" align="center">
          {index > 0 && (
            <Text variant="label" tone="tertiary">
              /
            </Text>
          )}
          <Pressable
            onPress={() => selectLanguage(code)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityState={{ selected: current === code }}
          >
            {/* Selected: default (`primary`) tone, at full weight — reads as
                the brighter, "marked in paper" option. Unselected: `tertiary`
                tone (dimmer) and regular weight — no pill, no border, just
                less visual weight than the active one. */}
            <Text variant="label" weight={current === code ? 'bold' : 'regular'} tone={current === code ? 'primary' : 'tertiary'}>
              {label}
            </Text>
          </Pressable>
        </Row>
      ))}
    </Row>
  );
}
