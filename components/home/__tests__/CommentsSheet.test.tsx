import { FlatList, StyleSheet } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { CommentsSheet } from '../CommentsSheet';
import { createComment, deleteComment, listAllComments } from '../../../services/workout-posts/workout-posts.service';
import type { CommentContract } from '../../../types/workout-post-social';
import { spacing } from '../../../constants/theme';

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
  listAllComments: jest.fn(),
  createComment: jest.fn(),
  deleteComment: jest.fn(),
}));

async function renderSheet(onClose = jest.fn()) {
  (listAllComments as jest.Mock).mockResolvedValue([]);
  const screen = await renderWithTheme(
    <CommentsSheet visible postId="post-1" onClose={onClose} onCommentsCountChange={jest.fn()} />,
  );
  await waitFor(() => expect(screen.getByText('comments.emptyMessage')).toBeTruthy());
  return screen;
}

const comment = (id: number, content: string, authorId = 'someone'): CommentContract => ({
  id,
  workoutPostId: 'post-1',
  author: { id: authorId, username: `user${id}`, displayName: null, profileImageUrl: null },
  content,
  createdAt: new Date().toISOString(),
});

// A thread the API way: oldest first.
const THREAD = [comment(1, 'first comment'), comment(2, 'second comment'), comment(3, 'third comment')];

async function renderThread(thread = THREAD, onCommentsCountChange = jest.fn()) {
  (listAllComments as jest.Mock).mockResolvedValue(thread);
  const screen = await renderWithTheme(
    <CommentsSheet visible postId="post-1" onClose={jest.fn()} onCommentsCountChange={onCommentsCountChange} />,
  );
  await waitFor(() => expect(screen.getByText(thread[0].content)).toBeTruthy());
  return screen;
}

// The order the comments are drawn in, top to bottom.
const order = (screen: Awaited<ReturnType<typeof renderThread>>, contents: string[]) => {
  const json = JSON.stringify(screen.toJSON());
  return [...contents].sort((a, b) => json.indexOf(a) - json.indexOf(b));
};

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

  it('has no divider line above the composer: the thread and the input are not ruled apart', async () => {
    const screen = await renderThread();
    const tree = JSON.stringify(screen.toJSON());

    expect(tree).not.toContain('borderTopWidth');
    expect(tree).not.toContain('borderTopColor');
  });

  it('keeps the same gap above the composer that the line and its padding made', async () => {
    const screen = await renderThread();

    expect(JSON.stringify(screen.toJSON())).toContain(`"marginTop":${spacing.lg}`);
  });

  it('has the glass outline along its top edge', async () => {
    const screen = await renderSheet();

    expect(JSON.stringify(screen.toJSON())).toContain('glassRim');
  });

  describe('the thread is a stack — the newest on top, like Instagram', () => {
    beforeEach(() => jest.clearAllMocks());

    it('reads the whole thread when it opens', async () => {
      await renderThread();

      expect(listAllComments).toHaveBeenCalledTimes(1);
      expect(listAllComments).toHaveBeenCalledWith('post-1');
    });

    it('puts the newest comment on top and the oldest at the bottom: the API sends them the other way round', async () => {
      const screen = await renderThread();

      expect(order(screen, ['first comment', 'second comment', 'third comment'])).toEqual([
        'third comment',
        'second comment',
        'first comment',
      ]);
    });

    it('opens on the newest: the top of the list is where it starts, not scrolled away', async () => {
      const scroll = jest.spyOn(FlatList.prototype, 'scrollToOffset');
      await renderThread();

      // Nothing has to jump anywhere: the newest is at the top, where a list starts.
      expect(scroll).not.toHaveBeenCalled();
      scroll.mockRestore();
    });

    it('is not an inverted list — the newest is first in the data, at the top of the screen', async () => {
      const screen = await renderThread();

      expect(JSON.stringify(screen.toJSON())).not.toContain('"scaleY":-1');
    });

    it('has no "load more" at the bottom: it already has them all', async () => {
      const screen = await renderThread();

      expect(JSON.stringify(screen.toJSON())).not.toContain('ActivityIndicator');
    });

    describe('sending', () => {
      const send = async (screen: Awaited<ReturnType<typeof renderThread>>, text = 'brand new') => {
        (createComment as jest.Mock).mockResolvedValue(comment(4, text, 'viewer-1'));
        await fireEvent.changeText(screen.getByPlaceholderText('comments.placeholder'), text);
        await fireEvent(screen.getByTestId('comment-send'), 'pressIn');
      };

      it('puts the comment you send on top of the stack', async () => {
        const screen = await renderThread();

        await send(screen);

        await waitFor(() => expect(screen.getByText('brand new')).toBeTruthy());
        expect(order(screen, ['first comment', 'third comment', 'brand new'])[0]).toBe('brand new');
      });

      it('takes the list up to it, so it is seen', async () => {
        const scroll = jest.spyOn(FlatList.prototype, 'scrollToOffset');
        const screen = await renderThread();

        await send(screen);

        await waitFor(() => expect(scroll).toHaveBeenCalledWith({ offset: 0, animated: true }));
        scroll.mockRestore();
      });

      it('lets the post know how many comments there are now', async () => {
        const onCommentsCountChange = jest.fn();
        const screen = await renderThread(THREAD, onCommentsCountChange);

        await send(screen);

        await waitFor(() => expect(onCommentsCountChange).toHaveBeenLastCalledWith(4));
      });

      it('starts a thread that had no comments: the first one is the whole stack', async () => {
        const screen = await renderSheet();
        (createComment as jest.Mock).mockResolvedValue(comment(1, 'first ever', 'viewer-1'));

        await fireEvent.changeText(screen.getByPlaceholderText('comments.placeholder'), 'first ever');
        await fireEvent(screen.getByTestId('comment-send'), 'pressIn');

        await waitFor(() => expect(screen.getByText('first ever')).toBeTruthy());
        expect(screen.queryByText('comments.emptyMessage')).toBeNull();
      });
    });

    describe('deleting', () => {
      it('takes your own comment out of the stack and updates the count', async () => {
        const onCommentsCountChange = jest.fn();
        (deleteComment as jest.Mock).mockResolvedValue(undefined);
        const screen = await renderThread([comment(1, 'old one', 'someone'), comment(2, 'mine', 'viewer-1')], onCommentsCountChange);

        // The delete action is on the viewer's own comment only.
        await fireEvent.press(screen.getByTestId('comment-delete'));
        await fireEvent.press(screen.getByText('comments.deleteConfirmCta'));

        await waitFor(() => expect(screen.queryByText('mine')).toBeNull());
        expect(screen.getByText('old one')).toBeTruthy();
        expect(deleteComment).toHaveBeenCalledWith('post-1', 2);
        expect(onCommentsCountChange).toHaveBeenLastCalledWith(1);
      });
    });

    it('says so when it could not be read', async () => {
      (listAllComments as jest.Mock).mockRejectedValue(new Error('offline'));
      const screen = await renderWithTheme(
        <CommentsSheet visible postId="post-1" onClose={jest.fn()} onCommentsCountChange={jest.fn()} />,
      );

      await waitFor(() => expect(screen.getByText('comments.errorMessage')).toBeTruthy());
    });
  });
});
