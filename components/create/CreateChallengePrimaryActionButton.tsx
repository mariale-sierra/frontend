import { StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { Button } from '../ui/button';
import { radius } from '../../constants/theme';

interface CreateChallengePrimaryActionButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function CreateChallengePrimaryActionButton({
  label,
  loading = false,
  disabled,
  style,
  ...props
}: CreateChallengePrimaryActionButtonProps) {
  return (
    <Button
      {...props}
      size="md"
      variant="primary"
      loading={loading}
      disabled={Boolean(disabled)}
      style={[styles.primaryButton, style]}
    >
      {label}
    </Button>
  );
}

const styles = StyleSheet.create({
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
});