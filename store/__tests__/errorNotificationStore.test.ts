import { useErrorNotificationStore } from '../errorNotificationStore';

describe('errorNotificationStore', () => {
  beforeEach(() => {
    useErrorNotificationStore.getState().hide();
  });

  it('show() displays an error with the default 5s duration', () => {
    useErrorNotificationStore.getState().show({ message: 'Something failed' });

    const state = useErrorNotificationStore.getState();
    expect(state.visible).toBe(true);
    expect(state.config.message).toBe('Something failed');
    expect(state.config.duration).toBe(5000);
    expect(state.config.variant).toBeUndefined();
  });

  it('showSuccess() forces the success variant with a shorter duration', () => {
    useErrorNotificationStore.getState().showSuccess({ message: 'Saved!' });

    const state = useErrorNotificationStore.getState();
    expect(state.visible).toBe(true);
    expect(state.config.variant).toBe('success');
    expect(state.config.duration).toBe(3000);
  });

  it('hide() clears visibility', () => {
    useErrorNotificationStore.getState().show({ message: 'x' });
    useErrorNotificationStore.getState().hide();

    expect(useErrorNotificationStore.getState().visible).toBe(false);
  });
});
