import { Share } from 'react-native';
import * as Linking from 'expo-linking';
import type { TFunction } from 'i18next';

export interface ShareableChallenge {
  id: string | number;
  name: string;
  description?: string | null;
  durationDays?: number | null;
  membersJoined?: number | null;
}

/** Link that opens the challenge in the app (`havit://challenge/<id>` in a
 * build; Expo Go's own scheme while developing). */
export function getChallengeLink(challengeId: string | number): string {
  return Linking.createURL(`/challenge/${challengeId}`);
}

/**
 * Text for sharing a challenge OUTSIDE Havit (WhatsApp, Instagram, …):
 * name, a short description, duration/members when known, and the link
 * last so messaging apps turn it into a tappable line of its own.
 */
export function buildChallengeShareMessage(challenge: ShareableChallenge, t: TFunction): string {
  const facts = [
    challenge.durationDays ? t('challengeInfo.shareDays', { count: challenge.durationDays }) : null,
    challenge.membersJoined ? t('challengeInfo.shareMembers', { count: challenge.membersJoined }) : null,
  ].filter(Boolean);

  const description = challenge.description?.trim();
  const shortDescription =
    description && description.length > 140 ? `${description.slice(0, 137).trimEnd()}…` : description;

  return [
    t('challengeInfo.shareMessage', { name: challenge.name }),
    facts.length > 0 ? facts.join(' · ') : null,
    shortDescription || null,
    t('challengeInfo.shareLinkLine', { link: getChallengeLink(challenge.id) }),
  ]
    .filter(Boolean)
    .join('\n');
}

/** Opens the native share sheet with the challenge's message. A dismissed
 * sheet isn't an error. */
export function shareChallengeExternally(challenge: ShareableChallenge, t: TFunction): void {
  Share.share({ message: buildChallengeShareMessage(challenge, t) }).catch(() => {});
}
