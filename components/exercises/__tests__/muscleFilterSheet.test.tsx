import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { MuscleFilterSheet, type MuscleFilterSelection } from '../muscleFilterSheet';
import { getMuscleRegions, getMusclesInRegion } from '../../../services/exercises/exercises.service';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => undefined },
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../../../services/exercises/exercises.service', () => ({
  getMuscleRegions: jest.fn(),
  getMusclesInRegion: jest.fn(),
}));

const regions = getMuscleRegions as jest.Mock;
const musclesIn = getMusclesInRegion as jest.Mock;

const REGIONS = [
  { code: 'chest', name: 'Chest', muscleCount: 2, iconUrl: 'https://cdn.example.com/chest.png' },
  { code: 'full_body', name: 'Full body', muscleCount: 0, iconUrl: null },
];
const CHEST_MUSCLES = [
  { id: 1, code: 'pectoralis_major', name: 'Pectoralis major', iconUrl: null, svgParts: [] },
  { id: 2, code: 'pectoralis_minor', name: 'Pectoralis minor', iconUrl: null, svgParts: [] },
];

async function renderSheet(props: { visible?: boolean; selected?: MuscleFilterSelection | null } = {}) {
  const onSelect = jest.fn();
  const onClose = jest.fn();
  const view = await renderWithTheme(
    <MuscleFilterSheet
      visible={props.visible ?? true}
      selected={props.selected ?? null}
      onSelect={onSelect}
      onClose={onClose}
    />,
  );
  return { ...view, onSelect, onClose };
}

const drillButtons = () => screen.getAllByLabelText('exerciseCatalog.muscleBrowser.title');

describe('MuscleFilterSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    regions.mockResolvedValue(REGIONS);
    musclesIn.mockResolvedValue(CHEST_MUSCLES);
  });

  afterEach(() => jest.restoreAllMocks());

  it('lists the regions when it opens', async () => {
    await renderSheet();

    expect(await screen.findByText('exerciseCatalog.regions.chest')).toBeTruthy();
    expect(screen.getByText('exerciseCatalog.regions.full_body')).toBeTruthy();
    expect(screen.getByText('exerciseCatalog.filters.muscles')).toBeTruthy();
    expect(regions).toHaveBeenCalledTimes(1);
  });

  it('does not ask for regions while closed', async () => {
    await renderSheet({ visible: false });
    expect(regions).not.toHaveBeenCalled();
  });

  it('tapping a region row filters by the whole region', async () => {
    const { onSelect } = await renderSheet();

    await fireEvent.press(await screen.findByText('exerciseCatalog.regions.chest'));

    expect(onSelect).toHaveBeenCalledWith({ level: 'region', code: 'chest', label: 'exerciseCatalog.regions.chest' });
    expect(musclesIn).not.toHaveBeenCalled();
  });

  it('the chevron drills into the region, and a muscle there filters by that muscle only', async () => {
    const { onSelect } = await renderSheet();
    await screen.findByText('exerciseCatalog.regions.chest');

    await fireEvent.press(drillButtons()[0]);

    expect(musclesIn).toHaveBeenCalledWith('chest');
    await fireEvent.press(await screen.findByText('exerciseCatalog.muscles.pectoralis_minor'));
    expect(onSelect).toHaveBeenCalledWith({
      level: 'muscle',
      code: 'pectoralis_minor',
      label: 'exerciseCatalog.muscles.pectoralis_minor',
    });
    // Drilling in is not a selection by itself.
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('shows the region as title while its muscles load, and back returns to the regions', async () => {
    let arrive: (value: typeof CHEST_MUSCLES) => void = () => undefined;
    musclesIn.mockReturnValue(new Promise((resolve) => (arrive = resolve)));
    await renderSheet();
    await screen.findByText('exerciseCatalog.regions.chest');

    await fireEvent.press(drillButtons()[0]);

    expect(screen.getByText('exerciseCatalog.regions.chest')).toBeTruthy();
    expect(screen.queryByText('exerciseCatalog.regions.full_body')).toBeNull();
    expect(screen.queryByText('exerciseCatalog.muscles.pectoralis_major')).toBeNull();

    await act(async () => arrive(CHEST_MUSCLES));
    expect(screen.getByText('exerciseCatalog.muscles.pectoralis_major')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('common.actions.back'));
    expect(screen.getByText('exerciseCatalog.regions.full_body')).toBeTruthy();
    expect(screen.getByText('exerciseCatalog.filters.muscles')).toBeTruthy();
  });

  it('offers "all" to clear an active filter', async () => {
    const { onSelect } = await renderSheet({ selected: { level: 'region', code: 'chest', label: 'Chest' } });
    await screen.findByText('exerciseCatalog.regions.chest');

    await fireEvent.press(screen.getByText('exerciseCatalog.filters.all'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('has no "all" row when nothing is filtered', async () => {
    await renderSheet();
    await screen.findByText('exerciseCatalog.regions.chest');
    expect(screen.queryByText('exerciseCatalog.filters.all')).toBeNull();
  });

  it('opens again on the region list after being closed inside a region', async () => {
    const view = await renderSheet();
    await screen.findByText('exerciseCatalog.regions.chest');
    await fireEvent.press(drillButtons()[0]);
    await screen.findByText('exerciseCatalog.muscles.pectoralis_major');

    await view.rerender(<MuscleFilterSheet visible={false} selected={null} onSelect={view.onSelect} onClose={view.onClose} />);
    await view.rerender(<MuscleFilterSheet visible selected={null} onSelect={view.onSelect} onClose={view.onClose} />);

    expect(await screen.findByText('exerciseCatalog.regions.full_body')).toBeTruthy();
    expect(screen.queryByText('exerciseCatalog.muscles.pectoralis_major')).toBeNull();
  });

  it('stays usable when the regions cannot be loaded', async () => {
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    regions.mockRejectedValue(Object.assign(new Error('Network Error'), { config: { method: 'get', url: '/muscles/regions' } }));

    await renderSheet();

    await waitFor(() => expect(errorLog).toHaveBeenCalled());
    expect(screen.getByText('exerciseCatalog.filters.muscles')).toBeTruthy();
    expect(screen.queryByText('exerciseCatalog.regions.chest')).toBeNull();
  });

  it('stops loading and shows no muscles when a region cannot be loaded', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    musclesIn.mockRejectedValue(new Error('Network Error'));
    await renderSheet();
    await screen.findByText('exerciseCatalog.regions.chest');

    await fireEvent.press(drillButtons()[0]);

    await waitFor(() => expect(musclesIn).toHaveBeenCalled());
    expect(screen.queryByText('exerciseCatalog.muscles.pectoralis_major')).toBeNull();
    // Back still works: the sheet is not stuck in the failed region.
    await fireEvent.press(screen.getByLabelText('common.actions.back'));
    expect(await screen.findByText('exerciseCatalog.regions.full_body')).toBeTruthy();
  });
});
