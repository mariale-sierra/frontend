import { StyleSheet, View } from 'react-native';

interface Participant {
  id: string;
  color: string;
}

interface ParticipantAvatarStackProps {
  participants: Participant[];
}

export function ParticipantAvatarStack({ participants }: ParticipantAvatarStackProps) {
  return (
    <View style={styles.stack}>
      {participants.slice(0, 4).map((participant, index) => (
        <View
          key={participant.id}
          style={[
            styles.avatar,
            {
              backgroundColor: participant.color,
              marginLeft: index === 0 ? 0 : -10,
              zIndex: participants.length - index,
            },
          ]}
        />
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
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#000000',
  },
});
