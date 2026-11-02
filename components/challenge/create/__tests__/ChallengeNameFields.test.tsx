import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithTheme } from '../../../../test-utils/renderWithTheme';
import { ChallengeNameFields, type ChallengeNameFieldsProps } from '../ChallengeNameFields';

jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => undefined },
  useTranslation: () => ({ t: (key: string) => key }),
}));

async function renderFields(overrides: Partial<ChallengeNameFieldsProps> = {}) {
  const props: ChallengeNameFieldsProps = {
    title: '',
    description: '',
    onChangeTitle: jest.fn(),
    onChangeDescription: jest.fn(),
    onBlurTitle: jest.fn(),
    ...overrides,
  };
  await renderWithTheme(<ChallengeNameFields {...props} />);
  return props;
}

const nameInput = () => screen.getByPlaceholderText('challengeCreate.fields.namePlaceholder');
const descriptionInput = () => screen.getByPlaceholderText('challengeCreate.fields.descriptionPlaceholder');

describe('ChallengeNameFields', () => {
  it('counts the name against its 40-character limit', async () => {
    await renderFields({ title: 'Morning run' });
    expect(screen.getByText('11 / 40')).toBeTruthy();
  });

  it('passes the typed name through', async () => {
    const props = await renderFields();
    await fireEvent.changeText(nameInput(), '30 days of yoga');
    expect(props.onChangeTitle).toHaveBeenCalledWith('30 days of yoga');
  });

  it('cuts a pasted name at 40 characters', async () => {
    const props = await renderFields();
    await fireEvent.changeText(nameInput(), 'x'.repeat(55));
    expect(props.onChangeTitle).toHaveBeenCalledWith('x'.repeat(40));
  });

  it('asks the caller to validate when the name loses focus', async () => {
    const props = await renderFields();
    await fireEvent(nameInput(), 'focus');
    await fireEvent(nameInput(), 'blur');
    expect(props.onBlurTitle).toHaveBeenCalledTimes(1);
  });

  it('works without a blur handler', async () => {
    await renderFields({ onBlurTitle: undefined });
    await fireEvent(nameInput(), 'blur');
    expect(nameInput()).toBeTruthy();
  });

  it('shows the validation message under the name', async () => {
    await renderFields({ titleError: 'Name is required' });
    expect(screen.getByText('Name is required')).toBeTruthy();
  });

  it('passes the description through unchanged, with no length cut', async () => {
    const props = await renderFields();
    const long = 'Every day, '.repeat(10);
    await fireEvent.changeText(descriptionInput(), long);
    expect(props.onChangeDescription).toHaveBeenCalledWith(long);
    expect(screen.getByText('challengeCreate.fields.optional')).toBeTruthy();
  });
});
