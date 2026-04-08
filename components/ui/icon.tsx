import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

interface IconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
}

export function Icon({
  name,
  size = 20,
  color = colors.textPrimary,
}: IconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}