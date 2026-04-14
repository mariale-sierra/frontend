import { StyleSheet, View } from 'react-native';
import { Row } from '../layout/row';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';

export type ChallengeVisibility = 'Public' | 'Private';

interface ChallengeSubmitActionsProps {
  visibility: ChallengeVisibility;
  onPrimaryPress?: () => void;
  onSendToFriendsPress?: () => void;
  onSaveForLaterPress?: () => void;
}

function getPrimaryLabel(visibility: ChallengeVisibility) {
  return visibility === 'Private' ? 'START CHALLENGE' : 'PUBLISH & JOIN';
}

export function ChallengeSubmitActions({
  visibility,
  onPrimaryPress,
  onSendToFriendsPress,
  onSaveForLaterPress,
}: ChallengeSubmitActionsProps) {
  return (
    <View style={styles.container}>
      <Button size="md" variant="primary" onPress={onPrimaryPress} style={styles.primaryButton}>
        {getPrimaryLabel(visibility)}
      </Button>

      <Row justify="space-between" gap="sm" style={styles.secondaryRow}>
        <Button
          variant="outline"
          size="sm"
          onPress={onSendToFriendsPress}
          style={styles.sendButton}
          rightIcon={<Icon name="paper-plane" size={14} />}
        >
          SEND TO FRIENDS
        </Button>

        <Button
          variant="outline"
          size="sm"
          onPress={onSaveForLaterPress}
          style={styles.saveButton}
          rightIcon={<Icon name="bookmark" size={14} />}
        >
          SAVE FOR LATER
        </Button>
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  primaryButton: {
    width: '100%',
    alignSelf: 'center',
  },
  secondaryRow: {
    width: '100%',
  },
  sendButton: {
    flex: 1.35,
  },
  saveButton: {
    flex: 1,
  },
});
