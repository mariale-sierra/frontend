import { StyleSheet } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import {
  ChallengeParticipantManageRow,
  PARTICIPANT_AVATAR_SIZE,
  PARTICIPANT_REMOVE_BUTTON_SIZE,
} from '../ChallengeParticipantManageRow';
import { ChallengeParticipantManageRowSkeleton } from '../ChallengeParticipantManageRowSkeleton';
import { colors, fillOpacity, radius } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import type { ChallengeParticipantContract } from '../../../types/challenge';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useRouter: () => require('expo-router').router,
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const participant = { id: 'user-7', username: 'carlos', role: 'member' } as ChallengeParticipantContract;
const flat = (node: { props: { style?: unknown } }) => StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;

describe('ChallengeParticipantManageRow', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows who it is: the avatar and @username', async () => {
    const screen = await renderWithTheme(<ChallengeParticipantManageRow participant={participant} onRemove={jest.fn()} />);

    expect(screen.getByText('@carlos')).toBeTruthy();
  });

  it('opens their profile from the name', async () => {
    const screen = await renderWithTheme(<ChallengeParticipantManageRow participant={participant} onRemove={jest.fn()} />);

    await fireEvent.press(screen.getByText('@carlos'));

    expect(router.push).toHaveBeenCalledWith('/profile/user-7');
  });

  it('removes with the trailing button, and that does not open the profile', async () => {
    const onRemove = jest.fn();
    const screen = await renderWithTheme(<ChallengeParticipantManageRow participant={participant} onRemove={onRemove} />);

    await fireEvent.press(screen.getByLabelText('challengeProgress.removeParticipantA11y'));

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(router.push).not.toHaveBeenCalled();
  });

  // A solid red circle on every row of a long list shouts; removal is confirmed in a popup anyway.
  it('has a soft `error` chip to remove with, not a solid red circle', async () => {
    const screen = await renderWithTheme(<ChallengeParticipantManageRow participant={participant} onRemove={jest.fn()} />);
    const button = flat(screen.getByLabelText('challengeProgress.removeParticipantA11y'));

    expect(button.backgroundColor).toBe(withAlpha(colors.error, fillOpacity.chip));
    expect(button.backgroundColor).not.toBe(colors.error);
    expect(button.borderRadius).toBe(radius.big);
    expect(JSON.stringify(screen.toJSON())).toContain(`"name":"person-remove-outline","size":18,"color":"${colors.error}"`);
  });

  it('sizes the avatar and the button from named constants', async () => {
    const screen = await renderWithTheme(<ChallengeParticipantManageRow participant={participant} onRemove={jest.fn()} />);
    const button = flat(screen.getByLabelText('challengeProgress.removeParticipantA11y'));

    expect(button).toMatchObject({ width: PARTICIPANT_REMOVE_BUTTON_SIZE, height: PARTICIPANT_REMOVE_BUTTON_SIZE });
    expect(JSON.stringify(screen.toJSON())).toContain(`"width":${PARTICIPANT_AVATAR_SIZE}`);
  });
});

describe('ChallengeParticipantManageRowSkeleton', () => {
  it('stands in for a row: the same avatar and button, as plain blocks', async () => {
    const tree = JSON.stringify((await renderWithTheme(<ChallengeParticipantManageRowSkeleton />)).toJSON());

    expect(tree).toContain(`"width":${PARTICIPANT_AVATAR_SIZE},"borderRadius":${radius.big}`);
    expect(tree).toContain(`"width":${PARTICIPANT_REMOVE_BUTTON_SIZE},"borderRadius":${radius.big}`);
  });

  it('is not a spinner', async () => {
    const tree = JSON.stringify((await renderWithTheme(<ChallengeParticipantManageRowSkeleton />)).toJSON());

    expect(tree).not.toContain('ActivityIndicator');
  });
});
