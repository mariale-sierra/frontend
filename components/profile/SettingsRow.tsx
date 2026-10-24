import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { Card } from '../ui/card';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { Row } from '../layout/row';

interface SettingsRowProps {
  icon: ComponentProps<typeof Icon>['name'];
  label: string;
  /** One line under the label saying what is inside. */
  hint?: string;
  onPress: () => void;
  /** 'danger' paints the icon and label `error` (log out, delete account). */
  tone?: 'default' | 'danger';
  accessibilityLabel?: string;
  testID?: string;
}

/**
 * One settings entry: a subtle tappable card (icon + label + optional hint +
 * chevron). Shared by the Settings screen and the session rows (LogoutButton,
 * DeleteAccountRow) so every entry looks and behaves the same.
 */
export function SettingsRow({ icon, label, hint, onPress, tone = 'default', accessibilityLabel, testID }: SettingsRowProps) {
  const danger = tone === 'danger';
  return (
    <Card
      variant="basic"
      radius="medium"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
    >
      <Row justify="space-between" align="center" gap="sm">
        <Row gap="sm" align="center" style={styles.main}>
          <Icon name={icon} size={20} color={danger ? colors.error : colors.paper} />
          <View style={styles.text}>
            <Text variant="body" style={danger ? styles.danger : undefined}>
              {label}
            </Text>
            {hint ? (
              <Text variant="caption" tone="secondary">
                {hint}
              </Text>
            ) : null}
          </View>
        </Row>
        <Icon name="chevron-forward-outline" size={18} color={withAlpha(colors.paper, textOpacity.tertiary)} />
      </Row>
    </Card>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1 },
  // Same label/hint gap as the edit-profile rows (privacyText).
  text: { flex: 1, gap: 2 },
  danger: { color: colors.error },
});
