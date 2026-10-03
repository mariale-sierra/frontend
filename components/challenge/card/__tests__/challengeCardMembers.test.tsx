import { StyleSheet } from 'react-native';
import { renderWithProviders } from '../../../../test-utils/renderWithProviders';
import { fontSize } from '../../../../constants/theme';
import { ChallengeCardMembers } from '../ChallengeCardMembers';

describe('ChallengeCardMembers', () => {
  it('shows the member count with a people icon', async () => {
    const screen = await renderWithProviders(<ChallengeCardMembers label="248 members" />);

    expect(screen.getByText('248 members')).toBeTruthy();
    expect(JSON.stringify(screen.toJSON())).toContain('people-outline');
  });

  it('is a smaller row in the compact size', async () => {
    const regular = await renderWithProviders(<ChallengeCardMembers label="248 members" />);
    expect(StyleSheet.flatten(regular.getByText('248 members').props.style).fontSize).toBe(fontSize.sm);
    await regular.unmount();

    const compact = await renderWithProviders(<ChallengeCardMembers label="248 members" size="sm" />);
    expect(StyleSheet.flatten(compact.getByText('248 members').props.style).fontSize).toBe(fontSize.xs);
  });
});
