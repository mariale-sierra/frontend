import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheetModal } from '../ui/bottomSheetModal';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';
import { SearchBar } from '../ui/searchBar';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';
import { Row } from '../layout/row';
import { borderWidth, colors, radius, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import type { ChallengeParticipantContract } from '../../types/challenge';

const AVATAR_SIZE = 40;
const CHECK_SIZE = 24;
const CHECK_ICON_SIZE = 14;
const EMPTY_ICON_SIZE = 34;

interface TagParticipantsSheetProps {
  visible: boolean;
  participants: ChallengeParticipantContract[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
}

/**
 * Owner-only multi-select for joint-post tagging (Bloque 1). Searches within
 * this challenge's own participants (already fetched via
 * useChallengeParticipants), not the global username search invite.tsx
 * uses — tagging only makes sense among people already in the challenge.
 * No confirmation step on the tagged side (product decision): selecting here
 * is the final action, applied on the next progress submission.
 *
 * A glass bottom sheet, like the comments sheet (`BottomSheetModal glass`): the photo
 * it is opened over shows through it, a tap outside closes it, and it rides up above
 * the keyboard when you search (the sheet used to be a hand-rolled `Modal` with a
 * hard-coded black backdrop that did none of those). Its "Done" button is the way out
 * once you have picked, so there is no close icon.
 */
export function TagParticipantsSheet({
  visible,
  participants,
  selectedIds,
  onChange,
  onClose,
}: TagParticipantsSheetProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return participants;
    return participants.filter((p) => p.username.toLowerCase().includes(q));
  }, [participants, query]);

  function toggle(userId: string) {
    onChange(
      selectedIds.includes(userId)
        ? selectedIds.filter((id) => id !== userId)
        : [...selectedIds, userId],
    );
  }

  return (
    // Tall enough to leave room for the keyboard when the search is used (the sheet
    // floats up above it), like the comments sheet. `renderInPlace`: this sheet opens
    // from app/(add)/camera.tsx, which is ITSELF a native `fullScreenModal` route — see
    // BottomSheetModal's own doc comment on why nesting RN's `<Modal>` inside that would
    // risk exactly the crash this fixes.
    <BottomSheetModal visible={visible} onClose={onClose} height="60%" glass renderInPlace>
      <View style={styles.fill}>
        <View style={styles.header}>
          <Text variant="subheader" align="center">
            {t('challengeProgress.tagParticipantsLabel')}
          </Text>
          {selectedIds.length > 0 ? (
            <Text variant="caption" tone="secondary" align="center">
              {t('challengeProgress.tagParticipantsSelectedCount', { count: selectedIds.length })}
            </Text>
          ) : null}
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t('challengeProgress.tagParticipantsSearchPlaceholder')}
        />

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          style={styles.fill}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="people-outline" size={EMPTY_ICON_SIZE} color={withAlpha(colors.paper, textOpacity.tertiary)} />
              <Text variant="body" tone="secondary" align="center">
                {t('challengeProgress.tagParticipantsEmpty')}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const selected = selectedIds.includes(item.id);
            return (
              // A pressable `Row`: it dims a little while pressed, like the app's other rows.
              <Row
                pressable
                onPress={() => toggle(item.id)}
                align="center"
                gap="md"
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                style={styles.row}
              >
                <UserAvatar username={item.username} size={AVATAR_SIZE} />
                <Text variant="body" weight="bold" numberOfLines={1} style={styles.username}>
                  @{item.username}
                </Text>
                <View style={[styles.check, selected && styles.checkSelected]}>
                  {selected ? <Icon name="checkmark-outline" size={CHECK_ICON_SIZE} color={colors.ink} /> : null}
                </View>
              </Row>
            );
          }}
        />

        <Button variant="primary" onPress={onClose} style={styles.doneButton}>
          {t('common.actions.done')}
        </Button>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  header: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  listContent: {
    paddingVertical: spacing.sm,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  row: {
    paddingVertical: spacing.sm,
  },
  username: {
    flex: 1,
  },
  // The app's own selection mark (see the Space form's privacy options): an empty ring,
  // filled `primary` with an `ink` check once picked. A circle: `big` is more than half of
  // the size.
  check: {
    width: CHECK_SIZE,
    height: CHECK_SIZE,
    borderRadius: radius.big,
    borderWidth: borderWidth.thin,
    borderColor: withAlpha(colors.paper, textOpacity.tertiary),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  doneButton: {
    marginTop: spacing.sm,
  },
});
