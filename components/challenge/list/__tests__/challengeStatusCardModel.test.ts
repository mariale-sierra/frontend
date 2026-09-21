import { getChallengeStatusCardModel } from '../challengeStatusCardModel';
import { activityColors, colors } from '../../../../constants/theme';
import type { ChallengeMineCardViewModel } from '../../../../services/adapters/challengeListAdapter';

// A `t` that returns its key, so the labels can be checked without i18n.
const t = ((key: string) => key) as unknown as Parameters<typeof getChallengeStatusCardModel>[1];

function buildChallenge(overrides: Partial<ChallengeMineCardViewModel> = {}): ChallengeMineCardViewModel {
  return {
    challengeId: 'challenge-1',
    title: 'Pilates challenge',
    currentDay: 12,
    totalDays: 24,
    state: 'active',
    latestPhotoUrl: null,
    dominantActivityCategory: 'cardioLow',
    ...overrides,
  };
}

describe('getChallengeStatusCardModel', () => {
  it('colors an active challenge with its own activity color', () => {
    expect(getChallengeStatusCardModel(buildChallenge(), t).stateColor).toBe(activityColors.cardioLow);
  });

  it('keeps the fixed colors for rest, completed, won and left', () => {
    expect(getChallengeStatusCardModel(buildChallenge({ state: 'rest' }), t).stateColor).toBe(colors.rest);
    expect(getChallengeStatusCardModel(buildChallenge({ state: 'completed' }), t).stateColor).toBe(colors.success);
    expect(getChallengeStatusCardModel(buildChallenge({ state: 'won' }), t).stateColor).toBe(colors.neutral);
    expect(getChallengeStatusCardModel(buildChallenge({ state: 'left' }), t).stateColor).toBe(colors.neutral);
  });

  it('glows lavender on a rest day and green once today is done, and in the activity color otherwise', () => {
    expect(getChallengeStatusCardModel(buildChallenge({ state: 'rest' }), t).glowColor).toBe(colors.rest);
    expect(getChallengeStatusCardModel(buildChallenge({ state: 'completed' }), t).glowColor).toBe(colors.success);
    expect(getChallengeStatusCardModel(buildChallenge({ state: 'active' }), t).glowColor).toBe(activityColors.cardioLow);
    expect(getChallengeStatusCardModel(buildChallenge({ state: 'won' }), t).glowColor).toBe(activityColors.cardioLow);
  });

  it('picks the mesh recipe: its own for rest and completed, the activity\'s otherwise', () => {
    expect(getChallengeStatusCardModel(buildChallenge({ state: 'rest' }), t).glowKey).toBe('rest');
    expect(getChallengeStatusCardModel(buildChallenge({ state: 'completed' }), t).glowKey).toBe('completed');
    expect(getChallengeStatusCardModel(buildChallenge({ state: 'active' }), t).glowKey).toBe('cardioLow');
    expect(getChallengeStatusCardModel(buildChallenge({ state: 'won' }), t).glowKey).toBe('cardioLow');
    expect(getChallengeStatusCardModel(buildChallenge({ dominantActivityCategory: null }), t).glowKey).toBe('default');
  });

  it('picks the label and icon for each state', () => {
    expect(getChallengeStatusCardModel(buildChallenge({ state: 'active' }), t)).toMatchObject({
      stateLabel: 'challenges.trainDay',
      stateIcon: 'camera-outline',
    });
    expect(getChallengeStatusCardModel(buildChallenge({ state: 'rest' }), t)).toMatchObject({
      stateLabel: 'challenges.restDay',
      stateIcon: 'moon-outline',
    });
    expect(getChallengeStatusCardModel(buildChallenge({ state: 'completed' }), t)).toMatchObject({
      stateLabel: 'challenges.completed',
      stateIcon: 'checkmark-outline',
    });
    expect(getChallengeStatusCardModel(buildChallenge({ state: 'won' }), t)).toMatchObject({
      stateLabel: 'challenges.finished',
      stateIcon: 'trophy-outline',
    });
    expect(getChallengeStatusCardModel(buildChallenge({ state: 'left' }), t)).toMatchObject({
      stateLabel: 'challenges.left',
      stateIcon: 'log-out-outline',
    });
  });

  it('reports how far along the challenge is', () => {
    expect(getChallengeStatusCardModel(buildChallenge({ currentDay: 12, totalDays: 24 }), t).progress).toBe(0.5);
  });

  it('shows the Add photo shortcut only on a train day', () => {
    expect(getChallengeStatusCardModel(buildChallenge({ state: 'active' }), t).sidePanel).toBe('addPhoto');
    expect(getChallengeStatusCardModel(buildChallenge({ state: 'active', latestPhotoUrl: 'x' }), t).sidePanel).toBe(
      'addPhoto',
    );
  });

  it('shows the latest photo otherwise, or a placeholder when there is none', () => {
    expect(getChallengeStatusCardModel(buildChallenge({ state: 'completed', latestPhotoUrl: 'x' }), t).sidePanel).toBe(
      'photo',
    );
    expect(getChallengeStatusCardModel(buildChallenge({ state: 'rest' }), t).sidePanel).toBe('placeholder');
  });
});
