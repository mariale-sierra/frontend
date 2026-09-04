import type { StyleProp, ViewStyle } from 'react-native';
import { IconButton } from './iconButton';
import { colors } from '../../constants/theme';
import { safeBack } from '../../utils/navigation';

interface BackButtonProps {
  iconColor?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function BackButton({ iconColor = colors.paper, size = 44, style, onPress }: BackButtonProps) {
  return (
    <IconButton
      name="chevron-back-outline"
      iconSize={24}
      iconColor={iconColor}
      size={size}
      onPress={onPress ?? (() => safeBack())}
      style={style}
    />
  );
}
