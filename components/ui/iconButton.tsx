import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '../../constants/theme';
import { Icon } from './icon';

type IconName = React.ComponentProps<typeof Icon>['name'];

interface IconButtonProps extends Omit<PressableProps, 'children' | 'style'> {
	name: IconName;
	size?: number;
	iconSize?: number;
	iconColor?: string;
	variant?: 'ghost' | 'surface';
	style?: StyleProp<ViewStyle>;
	pressedOpacity?: number;
}

export function IconButton({
	name,
	size = 32,
	iconSize = 20,
	iconColor,
	variant = 'ghost',
	style,
	pressedOpacity = 0.88,
	...props
}: IconButtonProps) {
	return (
		<Pressable
			{...props}
			style={({ pressed }) => [
				styles.base,
				{ width: size, height: size },
				variant === 'surface' && styles.surface,
				pressed && { opacity: pressedOpacity },
				style,
			]}
		>
			<Icon name={name} size={iconSize} color={iconColor} />
		</Pressable>
	);
}

const styles = StyleSheet.create({
	base: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	surface: {
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surface,
	},
});