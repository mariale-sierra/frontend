import { useMemo } from 'react';
import { Dropdown } from '../ui/dropdown';
import { Stack } from '../layout/stack';
import { Row } from '../layout/row';
import { Text } from '../ui/text';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../constants/theme';
import { Input } from '../ui/input';
import { View } from 'react-native';

export interface ChallengeVisibilitySectionProps {
	challengeDuration: number;
	visibilityOptions: string[];
	selectedVisibility: string | null;
	onChangeChallengeDuration?: (value: number) => void;
	onChangeVisibility?: (value: string | null) => void;
}

export function ChallengeVisibilitySection({
	challengeDuration,
	visibilityOptions,
	selectedVisibility,
	onChangeChallengeDuration,
	onChangeVisibility,
}: ChallengeVisibilitySectionProps) {
	const selectedVisibilityValues = selectedVisibility ? [selectedVisibility] : [];

	const options = useMemo(
		() => {
			const source = visibilityOptions.filter(
				(option) => option.toLowerCase() === 'public' || option.toLowerCase() === 'private',
			);

			const normalized = source.length > 0 ? source : ['Public', 'Private'];

			return normalized.map((option) => {
				const isPrivate = option.toLowerCase() === 'private';
				return {
					label: option,
					value: option,
					render: isPrivate
						? () => (
							<Row justify="flex-start" align="center" gap="sm">
								<Ionicons name="lock-closed" size={14} color={colors.primary} />
								<Text variant="body">{option}</Text>
							</Row>
						)
						: undefined,
				};
			});
		},
		[visibilityOptions],
	);

	return (
		<Stack gap="md">
			<View style={styles.dropdownShell}>
				<Row justify="space-between" align="center" style={styles.durationRow}>
					<Text variant="subheader">Challenge Duration</Text>
					<Row justify="flex-end" align="center" gap="xs" style={styles.durationControlGroup}>
						<Input
							value={challengeDuration === 0 ? '' : String(challengeDuration)}
							onChangeText={(value) => {
								const numeric = value.replace(/[^0-9]/g, '');
								onChangeChallengeDuration?.(numeric.length > 0 ? Number(numeric) : 0);
							}}
							keyboardType="number-pad"
							variant="default"
							placeholder="0"
							placeholderVariant="secondary"
							style={styles.durationInput}
						/>
						<Text variant="body">DAYS</Text>
					</Row>
				</Row>
			</View>

			<View style={styles.dropdownShell}>
				<Dropdown
					placeholder="Visibility"
					options={options}
					selectedValues={selectedVisibilityValues}
					onChange={(values) => onChangeVisibility?.(values[0] ?? null)}
					maxSelections={1}
					showValueInline
					rightIcon={<Ionicons name="chevron-down" size={16} color={colors.primary} />}
				/>
			</View>
		</Stack>
	);
}

const styles = {
	dropdownShell: {
		borderWidth: 1,
		borderColor: colors.border,
		shadowColor: colors.surfaceHighlight,
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.2,
		shadowRadius: 18,
		elevation: 8,
		borderRadius: radius.lg,
		overflow: 'hidden' as const,
	},
	durationRow: {
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	durationControlGroup: {
		flexShrink: 0,
	},
	durationInput: {
		width: 168,
		textAlign: 'center' as const,
		color: colors.textPrimary,
		borderRadius: radius.md,
	},
};
