import { screen } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import Metrics from '../metrics';
import { useMetricsScreen } from '../../../hooks/useMetricsScreen';
import { colors } from '../../../constants/theme';
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
jest.mock('../../../hooks/useMetricsScreen', () => ({ useMetricsScreen: jest.fn() }));
// What the backdrop is told is what matters here; the mesh itself is tested on its own.
jest.mock('../../../components/challenge/challengeMeshBackdrop', () => ({
  ChallengeMeshBackdrop: ({ category }: { category: string | null | undefined }) => {
    const { Text } = require('react-native');
    return <Text testID="mesh-backdrop">{String(category ?? 'none')}</Text>;
  },
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
  it("hangs its header on the challenge's own activity mesh gradient", async () => {
    mockScreen();
    await renderWithTheme(<Metrics />);

    expect(screen.getByTestId('mesh-backdrop')).toHaveTextContent('strength');
  });

  it('follows the challenge that was picked, not the first one', async () => {
    mockScreen({ selectedChallengeId: '2' });
    await renderWithTheme(<Metrics />);

    expect(screen.getByTestId('mesh-backdrop')).toHaveTextContent('cardioLow');
  });

  it('has the neutral gradient for a challenge with no dominant activity yet', async () => {
    mockScreen({ challenges: [option('1', 'Fresh start', null)] });
    await renderWithTheme(<Metrics />);

    expect(screen.getByTestId('mesh-backdrop')).toHaveTextContent('none');
  });

  it('falls back to the first challenge when the picked one is not there', async () => {
    mockScreen({ selectedChallengeId: '99' });
    await renderWithTheme(<Metrics />);

    expect(screen.getByTestId('mesh-backdrop')).toHaveTextContent('strength');
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

  it('draws the gradient first, behind the header', async () => {
    mockScreen();
    await renderWithTheme(<Metrics />);

    const json = JSON.stringify(screen.toJSON());

    expect(json.indexOf('mesh-backdrop')).toBeGreaterThan(-1);
    expect(json.indexOf('mesh-backdrop')).toBeLessThan(json.indexOf('Morning Strength'));
  });
});
