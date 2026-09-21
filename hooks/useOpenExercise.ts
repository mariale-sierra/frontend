import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getExerciseList } from '../services/exercises/exercises.service';
import { pickExerciseIdByName } from '../services/adapters/exerciseAdapter';
import { useErrorNotificationStore } from '../store/errorNotificationStore';

// How many rows a name search asks for — plenty to find the exact match among the
// exercises that merely contain the name ("Squat" is in a lot of them).
const NAME_SEARCH_PAGE_SIZE = 20;

/**
 * Opens the exercise screen (`/exercises/:id`, everything the catalog knows about
 * an exercise) for an exercise named in a routine.
 *
 * A routine's exercises carry their name but not their catalog id
 * (`GET /challenges/:id`'s cycle days), and the screen is keyed by id — so the id
 * is looked up by name first (`GET /exercises?search=`, then the row that matches,
 * see `pickExerciseIdByName`). While that runs, `openingKey` says which row asked,
 * so the row can show it is working and a second tap does nothing; if there is no
 * such exercise, or the lookup fails, a toast says so and the screen stays put.
 *
 * `key` is whatever tells the caller's rows apart (an index), given back as
 * `openingKey`.
 */
export function useOpenExercise() {
  const { t } = useTranslation();
  const router = useRouter();
  const showError = useErrorNotificationStore((state) => state.show);
  const [openingKey, setOpeningKey] = useState<string | number | null>(null);
  // A ref as well as state: a second tap in the same frame must not see the old state.
  const busy = useRef(false);

  const openExercise = useCallback(
    async (name: string, key: string | number) => {
      if (busy.current) return;
      busy.current = true;
      setOpeningKey(key);
      try {
        const { data } = await getExerciseList({ search: name, page: 1, pageSize: NAME_SEARCH_PAGE_SIZE });
        const exerciseId = pickExerciseIdByName(data, name);
        if (exerciseId == null) {
          showError({ message: t('challengeRoutineDay.exerciseOpenFailed') });
          return;
        }
        router.push(`/exercises/${exerciseId}`);
      } catch {
        showError({ message: t('challengeRoutineDay.exerciseOpenFailed') });
      } finally {
        busy.current = false;
        setOpeningKey(null);
      }
    },
    [router, showError, t],
  );

  return { openExercise, openingKey };
}
