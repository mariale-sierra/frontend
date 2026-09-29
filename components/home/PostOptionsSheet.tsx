import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheetModal } from '../ui/bottomSheetModal';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { Row } from '../layout/row';
import { colors, radius, spacing } from '../../constants/theme';

interface PostOptionsSheetProps {
  visible: boolean;
  onClose: () => void;
  onReport: () => void;
}

/**
 * The "..." menu on someone else's feed post. Report is the only option for
 * now; new ones go in as more rows here, styled the same way.
 */
export function PostOptionsSheet({ visible, onClose, onReport }: PostOptionsSheetProps) {
  const { t } = useTranslation();

  return (
    <BottomSheetModal visible={visible} onClose={onClose} glass>
      <Text variant="subheader" align="center" style={styles.header}>
        {t('home.postOptions.title')}
      </Text>

      <View style={styles.list}>
        <Row
          pressable
          onPress={onReport}
          gap="md"
          justify="flex-start"
          align="center"
          style={styles.option}
          accessibilityRole="button"
          accessibilityLabel={t('reports.reportPostA11y')}
          testID="post-options-report"
        >
          <Icon name="flag-outline" size={20} color={colors.error} />
          <Text variant="body" style={styles.destructiveLabel}>
            {t('home.postOptions.report')}
          </Text>
        </Row>
      </View>

      {/* BottomSheetModal sizes to content by default, and one row alone
          reads as a cramped sliver. This bottom spacer gives the sheet some
          presence without pinning it to a fixed height — new rows will
          fill this space in naturally as they're added. */}
      <View style={styles.bottomSpacer} />
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  option: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.base,
    borderRadius: radius.medium,
  },
  destructiveLabel: {
    color: colors.error,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});
