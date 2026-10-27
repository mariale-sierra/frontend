import { screen } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import Metrics from '../metrics';
import { useMetricsScreen } from '../../../hooks/useMetricsScreen';
import { activityColors, colors } from '../../../constants/theme';
import type { ChallengeOption } from '../../../types/metrics';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: { day?: number; routine?: string }) =>
      values?.routine ? `${key}:${values.day}:${values.routine}` : key,
  }),
}));
// What the background is told is what matters here; the gradient itself is tested on its own.
jest.mock('../../../components/layout/screenBackground', () => ({
  __esModule: true,
  default: ({ children, gradientPages, gradientEdge }: {
    children: React.ReactNode;
    gradientPages?: { colors: string[] };
    gradientEdge?: string;
  }) => {
    const { Text, View } = require('react-native');
    return (
      <View>
        <Text testID="background-light">{`${gradientEdge}:${gradientPages?.colors.join(',')}`}</Text>
        {children}
      </View>
    );
  },
}));
jest.mock('../../../hooks/useMetricsScreen', () => ({ useMetricsScreen: jest.fn() }));
// The location sheet has its own tests; here it is just a marker.
jest.mock('../../../components/challenge/detail/LocationSwitchSheet', () => ({ LocationSwitchSheet: () => null }));
// Stage 5's log-screen coach mark — not under test here, and pulls in the
// real AsyncStorage native module (via utils/storage.ts) if left unmocked.
jest.mock('../../../utils/logScreenCoachMark', () => ({
  hasSeenLogScreenCoachMark: jest.fn().mockResolvedValue(true),
  markLogScreenCoachMarkSeen: jest.fn(),
}));

const option = (id: string, label: string, dominantActivityCategory: ChallengeOption['dominantActivityCategory']): ChallengeOption => ({
  id,
  label,
  activityCategories: [],
  locations: [],
  dominantActivityCategory,
});

function mockScreen(overrides: Partial<ReturnType<typeof useMetricsScreen>> = {}) {
  (useMetricsScreen as jest.Mock).mockReturnValue({
    challenges: [option('1', 'Morning Strength', 'strength'), option('2', 'Evening Run', 'cardioLow')],
    selectedChallengeId: '1',
    exerciseMetrics: [],
    isLoadingData: false,
    challengeLoadError: null,
    currentDay: 3,
    routineName: 'Push',
    adaptation: null,
    adaptationInvalid: false,
    routineId: null,
    baseExercises: [],
    applyLocation: jest.fn(),
    resetLocation: jest.fn(),
    updateMetricValue: jest.fn(),
    goToCamera: jest.fn(),
    goToRestDay: jest.fn(),
    goBack: jest.fn(),
    ...overrides,
  });
}

type Node = { type?: string; props?: { style?: unknown }; children?: (Node | string)[] | null };

function flattenStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flattenStyle));
  return style && typeof style === 'object' ? (style as Record<string, unknown>) : {};
}

// Every node of the rendered tree whose own style has this background color.
function withBackground(node: Node | string | null | undefined, color: string): Node[] {
  if (!node || typeof node === 'string') return [];
  const own = flattenStyle(node.props?.style).backgroundColor === color ? [node] : [];
  return own.concat((node.children ?? []).flatMap((child) => withBackground(child, color)));
}

function textOf(node: Node | string): string {
  if (typeof node === 'string') return node;
  return (node.children ?? []).map(textOf).join(' ');
}

describe('the Log Metrics screen', () => {
  it("has Home's background upside down: the light from the bottom, in the challenge's own color", async () => {
    mockScreen();
    await renderWithTheme(<Metrics />);

    expect(screen.getByTestId('background-light')).toHaveTextContent(`bottom:${activityColors.strength}`);
  });

  it('follows the challenge that was picked, not the first one', async () => {
    mockScreen({ selectedChallengeId: '2' });
    await renderWithTheme(<Metrics />);

    expect(screen.getByTestId('background-light')).toHaveTextContent(`bottom:${activityColors.cardioLow}`);
  });

  it('uses the neutral `primary` light for a challenge with no dominant activity yet', async () => {
    mockScreen({ challenges: [option('1', 'Fresh start', null)] });
    await renderWithTheme(<Metrics />);

    expect(screen.getByTestId('background-light')).toHaveTextContent(`bottom:${colors.primary}`);
  });

  // Sprint 10: pure white (`paper`), not the cream `primary`.
  it('shows the challenge name in white', async () => {
    mockScreen();
    await renderWithTheme(<Metrics />);

    expect(flattenStyle(screen.getByText('Morning Strength').props.style).color).toBe(colors.paper);
  });

  it('shows the challenge and the day over the gradient', async () => {
    mockScreen();
    await renderWithTheme(<Metrics />);

    expect(screen.getByText('Morning Strength')).toBeTruthy();
    expect(screen.getByText('logMetrics.entry.dayWithRoutine:3:Push')).toBeTruthy();
  });

  it('has no surface-colored header any more — only the bottom bar with the CTA is on `surface`', async () => {
    mockScreen();
    await renderWithTheme(<Metrics />);

    const onSurface = withBackground(screen.toJSON() as Node, colors.surface);

    expect(onSurface).toHaveLength(1);
    expect(textOf(onSurface[0])).toContain('logMetrics.entry.logDayCta');
    expect(textOf(onSurface[0])).not.toContain('Morning Strength');
  });

  describe('where you train (B7 on the register screen)', () => {
    it('offers the location question when the routine has exercises', async () => {
      mockScreen({ routineId: 7, baseExercises: [{ exerciseId: 9, name: 'Squat' }] });
      const screen = await renderWithTheme(<Metrics />);
      expect(screen.getByTestId('metrics-change-location')).toBeTruthy();
      expect(screen.getByText('challengeRoutineDay.location.sheetTitle')).toBeTruthy();
    });

    it("shows the chosen location instead of the question once the user picked one", async () => {
      mockScreen({
        routineId: 7,
        baseExercises: [{ exerciseId: 9, name: 'Squat' }],
        adaptation: { routineId: 7, locationCode: 'home', locationName: 'Home', substitutions: [] },
      });
      const screen = await renderWithTheme(<Metrics />);
      expect(screen.getByText('challengeRoutineDay.location.trainingAt')).toBeTruthy();
    });

    it('hides it on a rest day (no routine)', async () => {
      mockScreen();
      const screen = await renderWithTheme(<Metrics />);
      expect(screen.queryByTestId('metrics-change-location')).toBeNull();
    });
  });
});
