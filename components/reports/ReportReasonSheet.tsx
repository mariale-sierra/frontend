import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheetModal } from '../ui/bottomSheetModal';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';
import { Input } from '../ui/input';
import { Text } from '../ui/text';
import { Row } from '../layout/row';
import { colors, radius, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { createReport } from '../../services/reports/reports.service';
import { useErrorNotificationStore } from '../../store/errorNotificationStore';
import { REPORT_REASONS } from '../../types/content-report';
import type { ReportReason, ReportTargetType } from '../../types/content-report';

const MAX_DETAILS_LENGTH = 500;

interface ReportReasonSheetProps {
  visible: boolean;
  targetType: ReportTargetType;
  /** Post UUID, or the comment's numeric id as a string. */
  targetId: string | null;
  onClose: () => void;
}

/**
 * Reason picker for reporting a workout post or a comment (Sprint 8, B2).
 * Success goes through the shared toast (`showSuccess`); failures are
 * already toasted by the global axios interceptor, so the catch only keeps
 * the sheet open for another try.
 */
export function ReportReasonSheet({ visible, targetType, targetId, onClose }: ReportReasonSheetProps) {
  const { t } = useTranslation();
  const showSuccess = useErrorNotificationStore((s) => s.showSuccess);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Every opening starts from a clean slate.
  useEffect(() => {
    if (visible) {
      setReason(null);
      setDetails('');
    }
  }, [visible]);

  async function handleSubmit() {
    if (!reason || !targetId || submitting) return;
    setSubmitting(true);
    try {
      await createReport({
        targetType,
        targetId,
        reason,
        details: details.trim() || undefined,
      });
      showSuccess({ message: t('reports.submittedMessage') });
      onClose();
    } catch {
      // Global axios interceptor already shows the error toast.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BottomSheetModal visible={visible} onClose={onClose} maxHeight="80%" glass>
      <Text variant="subheader" align="center" style={styles.header}>
        {targetType === 'post' ? t('reports.titlePost') : t('reports.titleComment')}
      </Text>
      <Text variant="caption" tone="secondary" align="center" style={styles.subtitle}>
        {t('reports.subtitle')}
      </Text>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {REPORT_REASONS.map((r) => {
          const selected = r === reason;
          return (
            <Row
              key={r}
              pressable
              onPress={() => setReason(r)}
              justify="space-between"
              align="center"
              style={[styles.option, selected && styles.optionSelected]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              testID={`report-reason-${r}`}
            >
              <Text variant="body">{t(`reports.reasons.${r}`)}</Text>
              <Icon
                name={selected ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={selected ? colors.primary : withAlpha(colors.paper, textOpacity.tertiary)}
              />
            </Row>
          );
        })}

        <Input
          containerStyle={styles.detailsInput}
          placeholder={t('reports.detailsPlaceholder')}
          placeholderVariant="caption"
          value={details}
          onChangeText={setDetails}
          maxLength={MAX_DETAILS_LENGTH}
          multiline
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          testID="report-submit"
          variant="danger"
          onPress={handleSubmit}
          loading={submitting}
          disabled={!reason || submitting}
        >
          {t('reports.submitCta')}
        </Button>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.md,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: spacing.sm,
  },
  option: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  detailsInput: {
    backgroundColor: colors.surface,
  },
  footer: {
    marginTop: spacing.lg,
  },
});
