import { Pressable, StyleSheet, View } from 'react-native';
import { Row } from '../layout/row';
import { Stack } from '../layout/stack';
import { Text } from '../ui/text';
import { colors, radius, spacing, typography } from '../../constants/theme';

export interface DurationStepperProps {
	label: string;
	value: number;
	description?: string;
	unitLabel?: string;
	presetValues?: number[];
	presetLabels?: Record<number, string>;
	onIncrement?: () => void;
	onDecrement?: () => void;
	onSelectPreset?: (value: number) => void;
}


export function DurationStepper({
	label,
	value,
	description,
	unitLabel = 'DAYS',
	presetValues = [],
	presetLabels = {},
	onIncrement,
	onDecrement,
	onSelectPreset,
}: DurationStepperProps) {
	const normalizedPresets = Array.from(new Set(presetValues.filter((preset) => preset > 0)));

	return (
		<Stack gap="md">
			<View>
				<Text variant="subheader">{label}</Text>
				{description ? (
					<Text variant="body" tone="secondary" style={styles.description}>{description}</Text>
				) : null}
			</View>

			<Row justify="space-between" align="center" style={styles.counterShell}>
				<Pressable onPress={onDecrement} style={({ pressed }) => [styles.pressableButton, pressed && styles.pressed]}>
					<Text variant="header" tone="primary">-</Text>
				</Pressable>

				<View style={styles.valueWrap}>
					<Text style={styles.valueNumber}>{value}</Text>
					<Text variant="caption" style={styles.unitLabel}>{unitLabel}</Text>
				</View>

				<Pressable onPress={onIncrement} style={({ pressed }) => [styles.pressableButton, pressed && styles.pressed]}>
					<Text variant="header" tone="primary">+</Text>
				</Pressable>
			</Row>

			{normalizedPresets.length > 0 && onSelectPreset ? (
				<Row gap="sm" style={styles.presetRow}>
					{normalizedPresets.map((preset) => (
						<Pressable
							key={`preset-${preset}`}
							onPress={() => onSelectPreset(preset)}
							style={({ pressed }) => [
								styles.presetChip,
								preset === value && styles.presetChipSelected,
								pressed && styles.pressed,
							]}
						>
							<Text variant="caption" style={preset === value ? styles.presetTextSelected : styles.presetText}>
								{presetLabels[preset] ?? `${preset} ${unitLabel.toLowerCase()}`}
							</Text>
						</Pressable>
					))}
				</Row>
			) : null}
		</Stack>
	);
}

const styles = StyleSheet.create({
	description: {
		marginTop: spacing.xs,
	},
	counterShell: {
		borderRadius: radius['2xl'],
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.12)',
		backgroundColor: 'rgba(255,255,255,0.04)',
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.lg,
	},
	pressableButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(255,255,255,0.08)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.12)',
	},
	valueWrap: {
		alignItems: 'center',
		justifyContent: 'center',
		gap: spacing.xs,
	},
	valueNumber: {
		...typography.titleLarge,
		fontSize: 32,
		lineHeight: 38,
		color: colors.textPrimary,
	},
	unitLabel: {
		color: 'rgba(255,255,255,0.58)',
		letterSpacing: 1.2,
	},
	presetRow: {
		flexWrap: 'wrap',
	},
	presetChip: {
		borderRadius: 999,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		backgroundColor: 'rgba(255,255,255,0.05)',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.12)',
	},
	presetChipSelected: {
		backgroundColor: colors.textPrimary,
		borderColor: colors.textPrimary,
	},
	presetText: {
		color: colors.textPrimary,
	},
	presetTextSelected: {
		color: colors.textInverse,
	},
	pressed: {
		opacity: 0.8,
	},
});
