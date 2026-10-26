import { Pressable, StyleSheet, type PressableProps, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { colors, radius } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { Icon } from './icon';

type IconName = React.ComponentProps<typeof Icon>['name'];

/** Minimum touch target (Apple HIG 44pt; Android asks 48dp). */
export const MIN_TOUCH_TARGET = 44;

interface IconButtonProps extends Omit<PressableProps, 'children' | 'style'> {
	name: IconName;
	size?: number;
	iconSize?: number;
	iconColor?: string;
	variant?: 'ghost' | 'surface';
	style?: StyleProp<ViewStyle>;
	/** Passed to the glyph — e.g. a text shadow when the button sits on a photo. */
	iconStyle?: StyleProp<TextStyle>;
	pressedOpacity?: number;
}

/**
 * An icon-only button. Sprint 10 accessibility pass: it is always announced as
 * a button (and as disabled when it is), and a button drawn smaller than
 * MIN_TOUCH_TARGET still gets a touch area that size (`hitSlop`) without
 * changing how it looks. An icon has no text a screen reader can read, so give
 * every IconButton an `accessibilityLabel`.
 */
export function IconButton({
	name,
	size = 32,
	iconSize = 20,
	iconColor,
	variant = 'ghost',
	style,
	iconStyle,
	pressedOpacity = 0.88,
	hitSlop,
	disabled,
	accessibilityState,
	...props
}: IconButtonProps) {
	const slop = hitSlop ?? (size < MIN_TOUCH_TARGET ? Math.ceil((MIN_TOUCH_TARGET - size) / 2) : undefined);

	return (
		<Pressable
			accessibilityRole="button"
			{...props}
			disabled={disabled}
			accessibilityState={{ disabled: !!disabled, ...accessibilityState }}
			hitSlop={slop}
			style={({ pressed }) => [
				styles.base,
				{ width: size, height: size },
				variant === 'surface' && styles.surface,
				pressed && { opacity: pressedOpacity },
				style,
			]}
		>
			<Icon name={name} size={iconSize} color={iconColor} style={iconStyle} />
		</Pressable>
	);
}

const styles = StyleSheet.create({
	base: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	surface: {
		borderRadius: radius.medium,
		borderWidth: 1,
		borderColor: withAlpha(colors.paper, 0.08),
		backgroundColor: colors.surface,
	},
});
