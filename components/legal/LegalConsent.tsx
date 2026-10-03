import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import { Icon } from '../ui/icon';
import { colors, radius, spacing } from '../../constants/theme';
import type { LegalDocKey } from '../../constants/legal/legalDocs';

export interface LegalConsentValue {
  acceptTerms: boolean;
  confirmAge16: boolean;
}

interface LegalConsentProps {
  value: LegalConsentValue;
  onChange: (next: LegalConsentValue) => void;
}

const DOC_LINKS: LegalDocKey[] = ['terms', 'privacy', 'community'];

function Checkbox({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={styles.row}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked && <Icon name="checkmark" size={16} color={colors.ink} />}
      </View>
      <Text variant="body" style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * The two mandatory consents shown on the last register step (and on the
 * "updated terms" screen for pre-existing accounts): accept T&C + Privacy
 * Policy + Community Guidelines, and confirm being 16+. Both are required —
 * the backend rejects the request otherwise (RegisterDto / AcceptTermsDto).
 */
export function LegalConsent({ value, onChange }: LegalConsentProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Checkbox
        checked={value.acceptTerms}
        onToggle={() => onChange({ ...value, acceptTerms: !value.acceptTerms })}
        label={t('legal.consent.accept')}
      />
      <View style={styles.links}>
        {DOC_LINKS.map((doc) => (
          <Pressable
            key={doc}
            onPress={() => router.push({ pathname: '/(auth)/legal', params: { doc } })}
            accessibilityRole="link"
          >
            <Text variant="caption" style={styles.link}>
              {t(`legal.docs.${doc}`)}
            </Text>
          </Pressable>
        ))}
      </View>
      <Checkbox
        checked={value.confirmAge16}
        onToggle={() => onChange({ ...value, confirmAge16: !value.confirmAge16 })}
        label={t('legal.consent.age')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: radius.small,
    borderWidth: 1.5,
    borderColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    flex: 1,
  },
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingLeft: 24 + spacing.md,
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
