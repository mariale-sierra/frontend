import { StyleSheet } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { CommentsSheet } from '../CommentsSheet';
import { listComments } from '../../../services/workout-posts/workout-posts.service';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ userId: 'viewer-1' }),
}));
jest.mock('../../../services/workout-posts/workout-posts.service', () => ({
  listComments: jest.fn(),
  createComment: jest.fn(),
  deleteComment: jest.fn(),
}));

async function renderSheet(onClose = jest.fn()) {
  (listComments as jest.Mock).mockResolvedValue({ comments: [], nextAfter: null });
  const screen = await renderWithTheme(
    <CommentsSheet visible postId="post-1" onClose={onClose} onCommentsCountChange={jest.fn()} />,
  );
  await waitFor(() => expect(screen.getByText('comments.emptyMessage')).toBeTruthy());
  return screen;
}

describe('CommentsSheet', () => {
  it('has the title centered', async () => {
    const screen = await renderSheet();

    expect(StyleSheet.flatten(screen.getByText('comments.title').props.style).textAlign).toBe('center');
  });

  it('has no close button — the tap outside is the way out', async () => {
    const screen = await renderSheet();

    expect(JSON.stringify(screen.toJSON())).not.toContain('close-outline');
  });

  it('closes when the area outside the sheet is tapped', async () => {
    const onClose = jest.fn();
    const screen = await renderSheet(onClose);

    await fireEvent.press(screen.getByTestId('bottom-sheet-backdrop'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('is glass, so the feed shows through', async () => {
    const screen = await renderSheet();

    expect(JSON.stringify(screen.toJSON())).toContain('ExpoBlur');
  });
});
