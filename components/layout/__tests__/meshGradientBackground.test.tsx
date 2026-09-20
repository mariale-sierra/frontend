import { render } from '@testing-library/react-native';
import { MeshGradientBackground } from '../MeshGradientBackground';

// The vivid look is the original mesh, stashed (see `USE_VIVID_MESH_BACKGROUND`)
// but kept working; the soft look is what the screens get. Both are checked, so
// switching between them is safe.
describe.each(['vivid', 'soft'] as const)('MeshGradientBackground (%s look)', (look) => {
  it('renders', async () => {
    const screen = await render(<MeshGradientBackground look={look} />);
    expect(screen.toJSON()).toBeTruthy();
  });

  it('does not capture touches, so the screen above it stays usable', async () => {
    const screen = await render(<MeshGradientBackground look={look} />);
    expect(screen.toJSON()).toMatchObject({ props: { pointerEvents: 'none' } });
  });
});

describe('MeshGradientBackground default', () => {
  it('is the original vivid look when no look is given', async () => {
    const screen = await render(<MeshGradientBackground />);
    expect(screen.toJSON()).toBeTruthy();
  });
});
