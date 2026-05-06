import { IconButton } from '../ui/iconButton';
import { colors } from '../../constants/theme';

interface RestDayIconButtonProps {
  onPress: () => void;
}

export function RestDayIconButton({ onPress }: RestDayIconButtonProps) {
  return (
    <IconButton
      name="moon-outline"
      onPress={onPress}
      size={38}
      iconSize={18}
      iconColor={colors.textPrimary}
      variant="surface"
      accessibilityRole="button"
      accessibilityLabel="Mark as rest day"
      pressedOpacity={0.88}
    />
  );
}
