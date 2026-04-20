import { StyleSheet, View } from 'react-native';
import { Row } from '../layout/row';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';
import { colors, radius, spacing } from '../../constants/theme';
import type { ChallengeVisibility } from '../../store/challengeBuilderStore';

interface ChallengeSubmitActionsProps {
  visibility: ChallengeVisibility;
  onPrimaryPress?: () => void;
  onSendToFriendsPress?: () => void;
  onSharePress?: () => void;
}

function getPrimaryLabel(visibility: ChallengeVisibility) {
  return visibility === 'Private' ? 'Start Challenge' : 'Publish & Join';
}

export function ChallengeSubmitActions({
  visibility,
  onPrimaryPress,
  onSendToFriendsPress,
  onSharePress,
}: ChallengeSubmitActionsProps) {
  return (
    <View style={styles.container}>
      <Button size="md" variant="primary" onPress={onPrimaryPress} style={styles.primaryButton}>
        {getPrimaryLabel(visibility)}
      </Button>

      <Row justify="space-between" gap="md" style={styles.secondaryRow}>
        <Button
          variant="outline"
          size="sm"
          onPress={onSendToFriendsPress}
          style={styles.sendButton}
          rightIcon={<Icon name="paper-plane" size={14} />}
        >
          Send to Friends
        </Button>

        <Button
          variant="outline"
          size="sm"
          onPress={onSharePress}
          style={styles.saveButton}
          rightIcon={<Icon name="share-social" size={14} />}
        >
          Share
        </Button>
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  primaryButton: {
    width: '100%',
    alignSelf: 'center',
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  secondaryRow: {
    width: '100%',
  },
  sendButton: {
    flex: 1.35,
    borderRadius: radius['2xl'],
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    minHeight: 42,
  },
  saveButton: {
    flex: 1,
    borderRadius: radius['2xl'],
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    minHeight: 42,
  },
});
