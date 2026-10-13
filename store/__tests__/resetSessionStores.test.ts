import { resetSessionStores } from '../resetSessionStores';
import { useChallengeBuilder } from '../challengeBuilderStore';
import { useWorkoutAdaptationStore } from '../workoutAdaptationStore';
import { useNotificationsStore } from '../notificationsStore';

describe('resetSessionStores', () => {
  it("drops the previous user's drafts so the next session starts clean", () => {
    useChallengeBuilder.getState().setTitle('Reto de Ana');
    useWorkoutAdaptationStore.getState().setAdaptation('c1', {
      routineId: 1,
      locationCode: 'home',
      locationName: 'Home',
      substitutions: [],
    });
    useNotificationsStore.setState({ unreadCount: 5 });

    resetSessionStores();

    expect(useChallengeBuilder.getState().title).toBe('');
    expect(useWorkoutAdaptationStore.getState().byChallenge).toEqual({});
    expect(useNotificationsStore.getState().unreadCount).toBe(0);
  });

  it('keeps the stores usable afterwards (actions survive the reset)', () => {
    resetSessionStores();
    useChallengeBuilder.getState().setTitle('Nuevo');
    expect(useChallengeBuilder.getState().title).toBe('Nuevo');
  });
});
