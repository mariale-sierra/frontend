import { Text as RNText } from 'react-native';
import { render } from '@testing-library/react-native';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// A stand-in that says which look of the mesh was chosen.
jest.mock('../MeshGradientBackground', () => {
  const { Text } = require('react-native');
  return { MeshGradientBackground: ({ look }: { look?: string }) => <Text>{`mesh-${look}`}</Text> };
});

// The switch is read once, when the module loads, so each case loads
// `ScreenBackground` fresh with the flag set the way it wants.
function loadScreenBackground(useVivid: boolean) {
  let ScreenBackground: typeof import('../screenBackground').default;
  jest.isolateModules(() => {
    jest.doMock('../../../constants/screenBackground', () => ({ USE_VIVID_MESH_BACKGROUND: useVivid }));
    ScreenBackground = require('../screenBackground').default;
  });
  return ScreenBackground!;
}

describe('ScreenBackground', () => {
  it('gives a gradient-background screen the soft mesh by default', async () => {
    const ScreenBackground = loadScreenBackground(false);
    const screen = await render(
      <ScreenBackground gradientBackground>
        <RNText>content</RNText>
      </ScreenBackground>,
    );

    expect(screen.getByText('mesh-soft')).toBeTruthy();
    expect(screen.getByText('content')).toBeTruthy();
  });

  it('brings the original vivid mesh back when the switch is turned on', async () => {
    const ScreenBackground = loadScreenBackground(true);
    const screen = await render(
      <ScreenBackground gradientBackground>
        <RNText>content</RNText>
      </ScreenBackground>,
    );

    expect(screen.getByText('mesh-vivid')).toBeTruthy();
    expect(screen.queryByText('mesh-soft')).toBeNull();
  });

  it('leaves every other screen on the default two-glow background, whichever way the switch is set', async () => {
    for (const useVivid of [false, true]) {
      const ScreenBackground = loadScreenBackground(useVivid);
      const screen = await render(
        <ScreenBackground>
          <RNText>content</RNText>
        </ScreenBackground>,
      );

      expect(screen.queryByText('mesh-soft')).toBeNull();
      expect(screen.queryByText('mesh-vivid')).toBeNull();
      expect(screen.getByText('content')).toBeTruthy();
      await screen.unmount();
    }
  });
});
