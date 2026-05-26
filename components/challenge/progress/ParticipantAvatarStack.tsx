import { StyleSheet, View } from 'react-native';
import { Icon } from '../../ui/icon';
import { radius } from '../../../constants/theme';

interface Participant {
  id: string;
  color: string;
}

interface ParticipantAvatarStackProps {
  participants: Participant[];
  size?: number;
}

export function ParticipantAvatarStack({ participants, size = 32 }: ParticipantAvatarStackProps) {
  const iconSize = Math.round(size * 0.5);
  const borderRadius = size / 2;

  return (
    <View style={styles.stack}>
      {participants.slice(0, 4).map((participant, index) => (
        <View
          key={participant.id}
          style={[
            styles.avatar,
            {
              width: size,
              height: size,
              borderRadius,
              backgroundColor: participant.color,
              marginLeft: index === 0 ? 0 : -(size * 0.3),
              zIndex: participants.length - index,
            },
          ]}
        >
          <Icon name="person" size={iconSize} color="rgba(0,0,0,0.55)" />
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
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
});
