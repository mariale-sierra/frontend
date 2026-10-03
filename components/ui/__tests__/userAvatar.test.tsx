import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { UserAvatar } from '../userAvatar';
import { radius } from '../../../constants/theme';

const tree = async (element: React.ReactElement) => JSON.stringify((await renderWithTheme(element)).toJSON());

describe('UserAvatar', () => {
  it('is, by default, the flat `big` corner radius: a big avatar is a rounded square', async () => {
    const json = await tree(<UserAvatar username="alice" size={96} />);

    expect(json).toContain(`"borderRadius":${radius.big}`);
    expect(json).not.toContain('"borderRadius":48');
  });

  it('is a true circle when asked — a radius of half its size, at any size', async () => {
    for (const size of [40, 64, 96, 120]) {
      const json = await tree(<UserAvatar username="alice" size={size} circle />);

      expect(json).toContain(`"borderRadius":${size / 2}`);
    }
  });

  it('is a circle for a photo as well as for the initial', async () => {
    const withPhoto = await tree(<UserAvatar username="alice" size={96} circle imageUrl="https://example.com/a.jpg" />);
    const initial = await tree(<UserAvatar username="alice" size={96} circle />);

    expect(withPhoto).toContain('"borderRadius":48');
    expect(initial).toContain('"borderRadius":48');
  });
});
