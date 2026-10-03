import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { TagParticipantsSheet } from '../TagParticipantsSheet';
import { colors, fillOpacity, radius } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import type { ChallengeParticipantContract } from '../../../types/challenge';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: { count?: number }) => (values?.count !== undefined ? `${key}:${values.count}` : key),
  }),
}));

const people = ['ana', 'bruno', 'carla'].map(
  (username) => ({ id: `id-${username}`, username, role: 'member' }) as ChallengeParticipantContract,
);

async function renderSheet(overrides: Partial<Parameters<typeof TagParticipantsSheet>[0]> = {}) {
  const props = {
    visible: true,
    participants: people,
    selectedIds: [] as string[],
    onChange: jest.fn(),
    onClose: jest.fn(),
    ...overrides,
  };
  const screen = await renderWithTheme(<TagParticipantsSheet {...props} />);
  return { screen, ...props };
}

// The search field's animated values hold references back to themselves; leave those out.
const stringify = (value: unknown) => {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (_key, item) => {
    if (typeof item === 'object' && item !== null) {
      if (seen.has(item)) return undefined;
      seen.add(item);
    }
    return item;
  });
};

describe('TagParticipantsSheet', () => {
  it('lists the participants, with a title', async () => {
    const { screen } = await renderSheet();

    expect(screen.getByText('challengeProgress.tagParticipantsLabel')).toBeTruthy();
    for (const person of people) {
      expect(screen.getByText(`@${person.username}`)).toBeTruthy();
    }
  });

  it('renders nothing while it is closed', async () => {
    const { screen } = await renderSheet({ visible: false });

    expect(screen.queryByText('@ana')).toBeNull();
  });

  // Real, reported crash this fixes: this sheet opens from
  // app/(add)/camera.tsx, itself a native `fullScreenModal` route — nesting
  // RN's own `<Modal>` inside that is a documented React Native footgun
  // (see BottomSheetModal's own doc comment on `renderInPlace`).
  it("does not nest RN's own <Modal>, unlike every other sheet built on BottomSheetModal", async () => {
    const { screen } = await renderSheet();

    expect(stringify(screen.toJSON())).not.toContain('"type":"Modal"');
  });

  describe('a glass sheet, like the comments sheet', () => {
    it('is frosted glass, so the photo it is opened over shows through', async () => {
      const { screen } = await renderSheet();

      expect(stringify(screen.toJSON())).toContain('ExpoBlur');
    });

    it('has the glass outline along its top edge', async () => {
      const { screen } = await renderSheet();

      expect(stringify(screen.toJSON())).toContain('glassRim');
    });

    it('closes with a tap outside it, like the other sheets', async () => {
      const { screen, onClose } = await renderSheet();

      await fireEvent.press(screen.getByTestId('bottom-sheet-backdrop'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('has no close icon: "Done" is the way out', async () => {
      const { screen } = await renderSheet();

      expect(stringify(screen.toJSON())).not.toContain('close-outline');
    });

    it('dims what is behind it with the sheets\' token, not a hard-coded black', async () => {
      const { screen } = await renderSheet();
      const tree = stringify(screen.toJSON());

      expect(tree).toContain(withAlpha(colors.ink, fillOpacity.dim));
      expect(tree).not.toContain('rgba(0,0,0');
    });
  });

  describe('picking', () => {
    it('selects a participant that is tapped', async () => {
      const { screen, onChange } = await renderSheet();

      await fireEvent.press(screen.getByText('@bruno'));

      expect(onChange).toHaveBeenCalledWith(['id-bruno']);
    });

    it('adds to what is already picked, and takes one back off when tapped again', async () => {
      const { screen, onChange } = await renderSheet({ selectedIds: ['id-ana'] });

      await fireEvent.press(screen.getByText('@carla'));
      expect(onChange).toHaveBeenLastCalledWith(['id-ana', 'id-carla']);

      await fireEvent.press(screen.getByText('@ana'));
      expect(onChange).toHaveBeenLastCalledWith([]);
    });

    it('marks who is picked, for a screen reader too', async () => {
      const { screen } = await renderSheet({ selectedIds: ['id-bruno'] });
      const boxes = screen.getAllByRole('checkbox');

      expect(boxes.map((box) => box.props.accessibilityState?.checked)).toEqual([false, true, false]);
    });

    it('draws the check in the app\'s own selection mark: a filled `primary` circle with an `ink` tick', async () => {
      const { screen } = await renderSheet({ selectedIds: ['id-bruno'] });
      const tree = stringify(screen.toJSON());

      expect(tree).toContain(`"backgroundColor":"${colors.primary}"`);
      expect(tree).toContain(`"name":"checkmark-outline","size":14,"color":"${colors.ink}"`);
      expect(tree).toContain(`"borderRadius":${radius.big}`);
    });

    it('says how many are picked, under the title, and nothing when none is', async () => {
      const none = await renderSheet();
      expect(none.screen.queryByText(/tagParticipantsSelectedCount/)).toBeNull();

      const some = await renderSheet({ selectedIds: ['id-ana', 'id-carla'] });
      expect(some.screen.getByText('challengeProgress.tagParticipantsSelectedCount:2')).toBeTruthy();
    });
  });

  describe('finishing', () => {
    it('is "Done", whether or not anyone is picked, and closes', async () => {
      const { screen, onClose } = await renderSheet({ selectedIds: ['id-ana'] });

      // The count is a line under the title; the button always reads the same.
      await fireEvent.press(screen.getByText('common.actions.done'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('searching', () => {
    it('narrows the list to who matches, whatever the case', async () => {
      const { screen } = await renderSheet();

      await fireEvent.changeText(screen.getByPlaceholderText('challengeProgress.tagParticipantsSearchPlaceholder'), 'BR');

      expect(screen.getByText('@bruno')).toBeTruthy();
      expect(screen.queryByText('@ana')).toBeNull();
      expect(screen.queryByText('@carla')).toBeNull();
    });

    it('says so, with an icon, when nobody matches', async () => {
      const { screen } = await renderSheet();

      await fireEvent.changeText(screen.getByPlaceholderText('challengeProgress.tagParticipantsSearchPlaceholder'), 'zzz');

      expect(screen.getByText('challengeProgress.tagParticipantsEmpty')).toBeTruthy();
      expect(stringify(screen.toJSON())).toContain('people-outline');
    });

    it('keeps what is picked while the list is narrowed', async () => {
      const { screen, onChange } = await renderSheet({ selectedIds: ['id-ana'] });

      await fireEvent.changeText(screen.getByPlaceholderText('challengeProgress.tagParticipantsSearchPlaceholder'), 'carl');
      await fireEvent.press(screen.getByText('@carla'));

      expect(onChange).toHaveBeenCalledWith(['id-ana', 'id-carla']);
    });
  });

  it('is empty, with the same line, when the challenge has nobody to tag', async () => {
    const { screen } = await renderSheet({ participants: [] });

    expect(screen.getByText('challengeProgress.tagParticipantsEmpty')).toBeTruthy();
  });
});
