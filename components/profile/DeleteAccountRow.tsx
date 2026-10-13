import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { Card } from '../ui/card';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { Row } from '../layout/row';

/** Settings-style row (same look as LogoutButton) that opens the delete-account screen. */
export function DeleteAccountRow() {
  const { t } = useTranslation();

  return (
    <Card
      variant="basic"
      radius="medium"
      onPress={() => router.push('/profile/delete-account')}
      accessibilityRole="button"
      accessibilityLabel={t('deleteAccount.rowA11y')}
    >
      <Row justify="space-between" align="center">
        <Row gap="sm" align="center">
          <Icon name="trash-outline" size={20} color={colors.error} />
          <Text variant="body" style={styles.label}>
            {t('deleteAccount.row')}
          </Text>
        </Row>
        <Icon name="chevron-forward-outline" size={18} color={withAlpha(colors.paper, textOpacity.tertiary)} />
      </Row>
    </Card>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.error },
});
