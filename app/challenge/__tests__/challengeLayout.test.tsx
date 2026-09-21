import { render } from '@testing-library/react-native';
import ChallengeLayout from '../[id]/_layout';

// Every screen of the challenge stack has to be registered here with its header hidden: an
// unregistered one gets Expo Router's default navigation header, stacked on top of the
// screen's own. (Manage challenge was added without being.) Join requests used to be its
// own screen too, but now renders directly inside Manage — no separate route any more.
const fs = jest.requireActual('fs');
const path = jest.requireActual('path');

jest.mock('expo-router', () => {
  const Stack = ({ children }: { children: React.ReactNode }) => children;
  Stack.Screen = (props: { name: string; options?: { headerShown?: boolean } }) => {
    const { Text } = require('react-native');
    return <Text testID={`screen-${props.name}`}>{String(props.options?.headerShown)}</Text>;
  };
  return { Stack };
});

const STACK_DIR = path.resolve(__dirname, '..', '[id]');

// The screens that exist as files: `index.tsx`, `members.tsx`, `routine/[day].tsx`...
function routes(dir: string, prefix = ''): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry: { name: string; isDirectory(): boolean }) => {
    if (entry.name.startsWith('_') || entry.name === '__tests__') return [];
    if (entry.isDirectory()) return routes(path.join(dir, entry.name), `${prefix}${entry.name}/`);
    return [`${prefix}${entry.name.replace(/\.tsx?$/, '')}`];
  });
}

describe('the challenge stack', () => {
  it.each(routes(STACK_DIR))('registers the %s screen, with its header hidden', async (route) => {
    const screen = await render(<ChallengeLayout />);

    expect(screen.getByTestId(`screen-${route}`)).toHaveTextContent('false');
  });

  it('has Manage challenge among them', () => {
    expect(routes(STACK_DIR)).toEqual(expect.arrayContaining(['manage']));
  });

  it('no longer has a separate Join requests screen — it is inline in Manage now', () => {
    expect(routes(STACK_DIR)).not.toContain('join-requests');
  });
});
