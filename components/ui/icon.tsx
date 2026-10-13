import { Ionicons } from '@expo/vector-icons';
import type { StyleProp, TextStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface IconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  /** Passed to the glyph (a text glyph) — e.g. a text shadow for an icon
   * drawn on top of a photo. */
  style?: StyleProp<TextStyle>;
}

export function Icon({
  name,
  size = 20,
  color,
  style,
}: IconProps) {
  const { colors } = useTheme();
  return <Ionicons name={name} size={size} color={color ?? colors.paper} style={style} />;
}
