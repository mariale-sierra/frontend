import { Pressable, StyleSheet } from 'react-native';
import { Row } from '../layout/row';
import { Text } from '../ui/text';
import { colors, radius, spacing } from '../../constants/theme';
import { GradientBox } from '../layout/gradient-box';

export interface DurationStepperProps {
	label: string;
	value: number;
	onIncrement?: () => void;
	onDecrement?: () => void;
}

export function DurationStepper({ label, value, onIncrement, onDecrement }: DurationStepperProps) {
	return (
		<GradientBox colors={['#3C3C3E', '#1C1C1E']} style={styles.shell}>
			<Row justify="space-between" align="center" style={styles.container}>
				<Text variant="header" tone="primary" style={styles.label}>
					{label}
				</Text>

				<Row justify="flex-end" align="center" gap="xs" style={styles.controls}>
					<Pressable onPress={onDecrement} style={({ pressed }) => [styles.pressableButton, pressed && styles.pressed]}>
						<Text variant="header" tone="primary">
							-
						</Text>
					</Pressable>

					<Text variant="body" style={styles.valueText}>{value} DAYS</Text>

					<Pressable onPress={onIncrement} style={({ pressed }) => [styles.pressableButton, pressed && styles.pressed]}>
						<Text variant="header" tone="primary">
							+
						</Text>
					</Pressable>
				</Row>
			</Row>
		</GradientBox>
	);
}

const styles = StyleSheet.create({
	shell: {
		borderRadius: radius.lg,
		overflow: 'hidden',
	},
	container: {
		width: '100%',
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	label: {
		flexShrink: 1,
		maxWidth: '44%',
	},
	controls: {
		flexShrink: 0,
	},
	pressableButton: {
		width: 30,
		height: 30,
		borderRadius: radius.md,
		backgroundColor: colors.surface,
		justifyContent: 'center',
		alignItems: 'center',
		paddingBottom: 1,
	},
	valueText: {
		paddingHorizontal: spacing.xs,
	},
	pressed: {
		opacity: 0.8,
	},
});
