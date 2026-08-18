import { StyleSheet, View } from 'react-native';
import { UserAvatar } from '../../ui/userAvatar';

interface Participant {
  id: string;
  name: string;
}

interface ParticipantAvatarStackProps {
  participants: Participant[];
  size?: number;
}

export function ParticipantAvatarStack({ participants, size = 32 }: ParticipantAvatarStackProps) {
  const borderRadius = size / 2 + 2;

  return (
    <View style={styles.stack}>
      {participants.slice(0, 4).map((participant, index) => (
        <View
          key={participant.id}
          style={[
            styles.ring,
            {
              borderRadius,
              marginLeft: index === 0 ? 0 : -(size * 0.3),
              zIndex: participants.length - index,
            },
          ]}
        >
          <UserAvatar username={participant.name} size={size} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ring: {
    borderWidth: 2,
    borderColor: '#000000',
    overflow: 'hidden',
  },
});
