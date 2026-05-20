import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

interface RestDayIconProps {
  size?: 'sm' | 'md' | 'lg';
}

// Matches ActivityIcon's containerSize keys so both icons can be swapped at the same size.
const containerSize = { sm: 28, md: 36, lg: 48 };
const iconSize     = { sm: 12, md: 15, lg: 20 };

export function RestDayIcon({ size = 'md' }: RestDayIconProps) {
  const cs = containerSize[size];
  const is = iconSize[size];

  return (
    <View style={{ width: cs, height: cs, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute',
        width: cs, height: cs, borderRadius: cs / 2,
        backgroundColor: withAlpha(colors.restDayNeon, 0.09),
      }} />
      <View style={{
        position: 'absolute',
        width: cs * 0.64, height: cs * 0.64, borderRadius: cs * 0.32,
        backgroundColor: withAlpha(colors.restDayNeon, 0.16),
      }} />
      <View style={{
        position: 'absolute',
        width: cs * 0.36, height: cs * 0.36, borderRadius: cs * 0.18,
        backgroundColor: withAlpha(colors.restDayNeon, 0.25),
      }} />
      <View style={{
        shadowColor: colors.restDayNeon,
        shadowOpacity: 0.9,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 10,
        elevation: 10,
      }}>
        <Ionicons name="moon" size={is} color={colors.primary} />
      </View>
    </View>
  );
}
