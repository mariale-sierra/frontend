import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IconButton } from './iconButton';
import { colors } from '../../constants/theme';
import { safeBack } from '../../utils/navigation';

interface BackButtonProps {
  iconColor?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  /** See IconButton's `iconStyle` (a shadow over a photo). */
  iconStyle?: StyleProp<TextStyle>;
  onPress?: () => void;
  /** Read by screen readers; "Back" by default. */
  accessibilityLabel?: string;
}

export function BackButton({
  iconColor = colors.paper,
  size = 44,
  style,
  iconStyle,
  onPress,
  accessibilityLabel,
}: BackButtonProps) {
  const { t } = useTranslation();
  return (
    <IconButton
      name="chevron-back-outline"
      iconSize={24}
      iconColor={iconColor}
      size={size}
      onPress={onPress ?? (() => safeBack())}
      style={style}
      iconStyle={iconStyle}
      accessibilityLabel={accessibilityLabel ?? t('common.actions.back')}
    />
  );
}
