import { createRef } from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { SpaceForm } from '../SpaceForm';
import type { SpaceFormHandle } from '../SpaceForm';
import { getExerciseCategories } from '../../../services/exercises/exercises.service';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `${key}:${Object.values(params).join(',')}` : key,
  }),
}));

jest.mock('../../../services/exercises/exercises.service', () => ({
  getExerciseCategories: jest.fn(),
}));

const mockedGetExerciseCategories = getExerciseCategories as jest.MockedFunction<
  typeof getExerciseCategories
>;

const CATEGORIES = [
  { id: 1, code: 'strength', name: 'Strength' },
  { id: 2, code: 'cardio_low', name: 'Cardio Low' },
];

/**
 * `submit()` (exposed via `ref` — the footer "Save changes" Button in
 * manage.tsx/create.tsx lives outside this component and calls
 * `formRef.current?.submit()`, see SpaceForm.tsx's own doc comment) is
 * async, and every state-changing interaction here (`fireEvent.changeText`,
 * `fireEvent.press`) needs its own `act()` for the resulting re-render to
 * actually commit before the next line reads state — skipping that isn't
 * just untidy, it silently races: `ref.current.submit` can still be bound
 * to the PREVIOUS render's stale closure (a real thing this test file
 * caught while diagnosing a "nothing happens on Save" report — everything
 * here checked out once each step was properly awaited, so the form's own
 * submit logic was cleared as the cause of that report).
 */
describe('SpaceForm', () => {
  beforeEach(() => {
    mockedGetExerciseCategories.mockResolvedValue(CATEGORIES);
  });

  it('calls onSubmit with the picked activityCategoryId', async () => {
    const onSubmit = jest.fn();
    const ref = createRef<SpaceFormHandle>();
    const screen = await renderWithTheme(
      <SpaceForm ref={ref} onSubmit={onSubmit} />,
    );

    await waitFor(() => expect(mockedGetExerciseCategories).toHaveBeenCalled());

    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('spaces.namePlaceholder'), 'Girls running club');
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('challenges.categories.strength:strength'));
    });
    await act(async () => {
      await ref.current?.submit();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Girls running club', activityCategoryId: 1 }),
    );
  });

  it('resolves the category fresh if it picked a color before the mount-time fetch resolved', async () => {
    // The real, previously-reported bug this covers: `categories` loads
    // async on mount — a user who picks a swatch and hits submit fast
    // enough to beat that request used to get a space saved with NO
    // category at all, silently. Simulated here by never letting the
    // mount-time fetch resolve until AFTER submit() has already started.
    let resolveMountFetch!: (categories: typeof CATEGORIES) => void;
    mockedGetExerciseCategories.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveMountFetch = resolve;
      }),
    );

    const onSubmit = jest.fn();
    const ref = createRef<SpaceFormHandle>();
    const screen = await renderWithTheme(
      <SpaceForm ref={ref} onSubmit={onSubmit} />,
    );

    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('spaces.namePlaceholder'), 'Girls running club');
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText('challenges.categories.strength:strength'));
    });

    mockedGetExerciseCategories.mockResolvedValueOnce(CATEGORIES);
    await act(async () => {
      await ref.current?.submit();
    });
    await act(async () => {
      resolveMountFetch([]);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ activityCategoryId: 1 }),
    );
  });

  it('switches to the newly picked category when editing a space that already had one', async () => {
    // The specific edit-flow scenario reported broken: name/description/
    // visibility save fine when editing an existing space, but changing
    // the activity color specifically doesn't stick.
    const onSubmit = jest.fn();
    const ref = createRef<SpaceFormHandle>();
    const screen = await renderWithTheme(
      <SpaceForm
        ref={ref}
        initialValues={{ name: 'Girls running club', activityType: 'cardioLow' }}
        onSubmit={onSubmit}
      />,
    );

    await waitFor(() => expect(mockedGetExerciseCategories).toHaveBeenCalled());

    await act(async () => {
      fireEvent.press(screen.getByLabelText('challenges.categories.strength:strength'));
    });
    await act(async () => {
      await ref.current?.submit();
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ activityCategoryId: 1 }),
    );
  });

  it('keeps the original category when editing a space without touching the color picker', async () => {
    const onSubmit = jest.fn();
    const ref = createRef<SpaceFormHandle>();
    const screen = await renderWithTheme(
      <SpaceForm
        ref={ref}
        initialValues={{ name: 'Girls running club', activityType: 'cardioLow' }}
        onSubmit={onSubmit}
      />,
    );

    await waitFor(() => expect(mockedGetExerciseCategories).toHaveBeenCalled());

    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('spaces.namePlaceholder'), 'Renamed club');
    });
    await act(async () => {
      await ref.current?.submit();
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Renamed club', activityCategoryId: 2 }),
    );
  });

  it('does not call onSubmit when the name is blank', async () => {
    const onSubmit = jest.fn();
    const ref = createRef<SpaceFormHandle>();
    await renderWithTheme(<SpaceForm ref={ref} onSubmit={onSubmit} />);

    await act(async () => {
      await ref.current?.submit();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
