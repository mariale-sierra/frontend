import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { Button } from '../ui/button';
import { SearchBar } from '../ui/searchBar';
import { UserAvatar } from '../ui/userAvatar';
import { Row } from '../layout/row';
import { colors, radius, spacing } from '../../constants/theme';
import type { ChallengeParticipantContract } from '../../types/challenge';

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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Row justify="space-between" align="center" style={styles.header}>
            <Text variant="body" weight="bold">
              {t('challengeProgress.tagParticipantsLabel')}
            </Text>
            <Pressable onPress={onClose} accessibilityRole="button" hitSlop={8}>
              <Icon name="close-outline" size={24} color={colors.paper} />
            </Pressable>
          </Row>

          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder={t('challengeProgress.tagParticipantsSearchPlaceholder')}
          />

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text tone="secondary">{t('challengeProgress.tagParticipantsEmpty')}</Text>
              </View>
            }
            renderItem={({ item }) => {
              const selected = selectedIds.includes(item.id);
              return (
                <Pressable onPress={() => toggle(item.id)} accessibilityRole="checkbox" accessibilityState={{ checked: selected }}>
                  <Row align="center" gap="md" style={styles.row}>
                    <UserAvatar username={item.username} size={36} />
                    <Text variant="body" numberOfLines={1} style={styles.username}>
                      @{item.username}
                    </Text>
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                      {selected && <Icon name="checkmark-outline" size={14} color={colors.ink} />}
                    </View>
                  </Row>
                </Pressable>
              );
            }}
          />

          <Button variant="primary" onPress={onClose} style={styles.doneButton}>
            {selectedIds.length > 0
              ? t('challengeProgress.tagParticipantsSelectedCount', { count: selectedIds.length })
              : t('common.actions.done')}
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.big,
    borderTopRightRadius: radius.big,
    padding: spacing.lg,
    maxHeight: '75%',
    gap: spacing.md,
  },
  header: {
    paddingBottom: spacing.xs,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  emptyWrap: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  row: {
    paddingVertical: spacing.sm,
  },
  username: {
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  doneButton: {
    marginTop: spacing.xs,
  },
});
