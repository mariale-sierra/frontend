import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { GradientBox } from '../layout/gradient-box';
import { colors, radius, spacing } from '../../constants/theme';

export interface CreateChallengeCardProps {
	onPress?: () => void;
	style?: ViewStyle;
}

export function CreateChallengeCard({ onPress, style }: CreateChallengeCardProps) {
	return (
		<Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
			<GradientBox
				colors={[colors.surfaceHighlight, colors.surface]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={[styles.container, style]}
			>
				<Text style={styles.plusSign}>+</Text>
			</GradientBox>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		paddingVertical: spacing.lg,
		paddingHorizontal: spacing.md,
		borderRadius: radius.xl,
		justifyContent: 'center',
		alignItems: 'center',
		minHeight: 100,
		elevation: 0,
		shadowOpacity: 0,
	},
	pressed: {
		opacity: 0.85,
	},
	plusSign: {
		fontSize: 48,
		fontWeight: '300',
		color: colors.textPrimary,
	},
});
