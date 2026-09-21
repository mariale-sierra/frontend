import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AccentPill } from '../ui/accentPill';
import { SpaceCardView } from './SpaceCardView';
import { getSpaceAccentColor, getSpaceMembershipCta } from '../../services/adapters/spaceAdapter';
import type { SpaceContract } from '../../types/space';

interface SpaceCardProps {
  space: SpaceContract;
  onPress: () => void;
  onPressCta: () => void;
  ctaLoading?: boolean;
}

/**
 * Based on wireframe Chats-46A, in the same card format as the challenge cards
 * (see `SpaceCardView`): the space's own Activity Color (see
 * spaceAdapter.getSpaceAccentColor) as a soft outline and a glow rising from the
 * bottom edge (and, since 2026-09-20, the top edge too), the space name and
 * description, a member count row, and a Join / Request to join pill in that color
 * (Join carries a trailing arrow) — or a neutral `surface` "Pending" pill once a
 * request is in. Restyled 2026-09-20 (explicit request), and again the same day
 * (no category badge, roomier padding, the twin glow, the surface pending pill);
 * the behavior is unchanged.
 */
export function SpaceCard({ space, onPress, onPressCta, ctaLoading = false }: SpaceCardProps) {
  const { t } = useTranslation();
  const accentColor = getSpaceAccentColor(space);
  const cta = getSpaceMembershipCta(space);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <SpaceCardView
        name={space.name}
        description={space.description}
        membersCount={space.membersCount}
        accentColor={accentColor}
        cta={
          cta.kind === 'join' || cta.kind === 'request' ? (
            <AccentPill
              label={cta.kind === 'join' ? t('spaces.joinCta') : t('spaces.requestCta')}
              color={accentColor}
              arrow={cta.kind === 'join'}
              loading={ctaLoading}
              onPress={onPressCta}
            />
          ) : cta.kind === 'pending' ? (
            <AccentPill variant="surface" label={t('spaces.pendingCta')} />
          ) : undefined
        }
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.9,
  },
});
