import { useRouter } from 'expo-router';
import type { StyleProp, ViewStyle } from 'react-native';
import { IconButton } from './iconButton';
import { colors } from '../../constants/theme';

interface BackButtonProps {
  iconColor?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function BackButton({ iconColor = colors.paper, size = 44, style, onPress }: BackButtonProps) {
  const router = useRouter();
  return (
    <IconButton
      name="chevron-back-outline"
      iconSize={24}
      iconColor={iconColor}
      size={size}
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/(tabs)')))}
      style={style}
    />
  );
}
