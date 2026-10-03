import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { Row } from '../../components/layout/row';
import { BackButton } from '../../components/ui/backButton';
import { Button } from '../../components/ui/button';
import { ConfirmationPopup } from '../../components/ui/confirmationPopup';
import { Icon } from '../../components/ui/icon';
import { Text } from '../../components/ui/text';
import { colors, radius, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { listPendingReports, resolveReport } from '../../services/reports/reports.service';
import { useErrorNotificationStore } from '../../store/errorNotificationStore';
import type { ReportContract, ResolveReportRequest } from '../../types/content-report';

type PendingDecision = { report: ReportContract; request: ResolveReportRequest };

/**
 * Admin-only review queue for reported workout posts and comments (Sprint 8,
 * B2). The backend's AdminGuard is the real gate — `useIsAdmin` only decides
 * what to render, so a non-admin who deep-links here just sees the notice.
 * Every resolution asks for confirmation first, since hiding content and
 * issuing a strike are not undoable from the app.
 */
export default function ModerationScreen() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const showSuccess = useErrorNotificationStore((s) => s.showSuccess);

  const [reports, setReports] = useState<ReportContract[]>([]);
  const [nextAfter, setNextAfter] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [decision, setDecision] = useState<PendingDecision | null>(null);
  const [resolving, setResolving] = useState(false);

  const load = useCallback(async (after?: number) => {
    setError(false);
    try {
      const page = await listPendingReports(after);
      setReports((prev) => (after === undefined ? page.reports : [...prev, ...page.reports]));
      setNextAfter(page.nextAfter);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  async function handleConfirm() {
    if (!decision) return;
    const { report, request } = decision;
    setResolving(true);
    try {
      const result = await resolveReport(report.id, request);
      const removed = new Set([result.reportId, ...result.alsoResolvedReportIds]);
      setReports((prev) => prev.filter((r) => !removed.has(r.id)));
      showSuccess({
        message:
          request.action === 'dismiss'
            ? t('moderation.dismissedMessage')
            : result.penaltyRecorded
              ? t('moderation.hiddenPenalizedMessage')
              : t('moderation.hiddenMessage'),
      });
      setDecision(null);
    } catch (err) {
      // 409: another admin already resolved it — drop it from the queue. Any
      // other error is already toasted by the global axios interceptor.
      if ((err as { response?: { status?: number } })?.response?.status === 409) {
        setReports((prev) => prev.filter((r) => r.id !== report.id));
        setDecision(null);
      }
    } finally {
      setResolving(false);
    }
  }

  const header = (
    <Row justify="space-between" align="center" style={styles.topBar}>
      <BackButton style={styles.backButton} />
      <Text variant="body" weight="bold" align="center" style={styles.headerTitle}>
        {t('moderation.title')}
      </Text>
      <View style={styles.trailingSpacer} />
    </Row>
  );

  if (!isAdmin) {
    return (
      <ScreenBackground variant="top">
        {header}
        <View style={styles.centered}>
          <Icon name="lock-closed-outline" size={34} color={withAlpha(colors.paper, textOpacity.tertiary)} />
          <Text variant="body" tone="secondary" align="center">
            {t('moderation.adminOnly')}
          </Text>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground variant="top">
      {header}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.paper} />
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={colors.primary}
            />
          }
          onEndReached={() => {
            if (nextAfter !== null) void load(nextAfter);
          }}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Icon
                name={error ? 'cloud-offline-outline' : 'shield-checkmark-outline'}
                size={34}
                color={withAlpha(colors.paper, textOpacity.tertiary)}
              />
              <Text variant="body" tone="secondary" align="center">
                {error ? t('moderation.errorMessage') : t('moderation.emptyMessage')}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ReportCard
              report={item}
              onDecide={(request) => setDecision({ report: item, request })}
            />
          )}
        />
      )}

      <ConfirmationPopup
        visible={decision !== null}
        title={
          decision?.request.action === 'dismiss'
            ? t('moderation.confirmDismissTitle')
            : decision?.request.penalize
              ? t('moderation.confirmHidePenalizeTitle')
              : t('moderation.confirmHideTitle')
        }
        primaryButton={{
          label: t('moderation.confirmCta'),
          onPress: handleConfirm,
          variant: decision?.request.action === 'dismiss' ? 'primary' : 'danger',
          loading: resolving,
        }}
        secondaryButton={{
          label: t('comments.cancelCta'),
          onPress: () => setDecision(null),
          variant: 'neutral',
          disabled: resolving,
        }}
        onDismiss={() => setDecision(null)}
      />
    </ScreenBackground>
  );
}

function ReportCard({
  report,
  onDecide,
}: {
  report: ReportContract;
  onDecide: (request: ResolveReportRequest) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.card} testID={`report-card-${report.id}`}>
      <Row justify="space-between" align="center">
        <Text variant="label" weight="bold">
          {report.targetType === 'post' ? t('moderation.targetPost') : t('moderation.targetComment')}
        </Text>
        <Text variant="caption" tone="secondary">
          {t(`reports.reasons.${report.reason}`)}
        </Text>
      </Row>

      <Row gap="sm" align="flex-start" justify="flex-start">
        {report.target.imageUrl ? (
          <Image source={{ uri: report.target.imageUrl }} style={styles.thumb} resizeMode="cover" />
        ) : null}
        <View style={styles.previewText}>
          <Text variant="body" numberOfLines={4}>
            {report.target.text || t('moderation.noText')}
          </Text>
          {!report.target.exists ? (
            <Text variant="caption" tone="tertiary">{t('moderation.contentDeleted')}</Text>
          ) : null}
        </View>
      </Row>

      <Text variant="caption" tone="secondary">
        {t('moderation.authorLine', {
          author: report.targetOwner.username,
          count: report.targetOwner.strikeCount,
        })}
      </Text>
      <Text variant="caption" tone="secondary">
        {t('moderation.reporterLine', { reporter: report.reporter.username })}
      </Text>
      {report.details ? (
        <Text variant="caption" tone="secondary">“{report.details}”</Text>
      ) : null}

      <Row gap="sm" justify="flex-start" style={styles.actions}>
        <Button size="sm" variant="neutral" onPress={() => onDecide({ action: 'dismiss' })} testID="report-dismiss">
          {t('moderation.dismissCta')}
        </Button>
        <Button size="sm" variant="dangerSubtle" onPress={() => onDecide({ action: 'hide' })} testID="report-hide">
          {t('moderation.hideCta')}
        </Button>
        <Button
          size="sm"
          variant="danger"
          onPress={() => onDecide({ action: 'hide', penalize: true })}
          testID="report-hide-penalize"
        >
          {t('moderation.hidePenalizeCta')}
        </Button>
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.base,
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    flex: 1,
  },
  trailingSpacer: {
    width: 44,
    height: 44,
  },
  content: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.base,
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.small,
  },
  previewText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  actions: {
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
});
