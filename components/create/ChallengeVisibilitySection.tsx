import { useEffect, useMemo, useState } from 'react';
import { Dropdown } from '../ui/dropdown';
import { Stack } from '../layout/stack';
import { GradientBox } from '../layout/gradient-box';
import { Row } from '../layout/row';
import { Text } from '../ui/text';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../constants/theme';
import { Input } from '../ui/input';

export interface ChallengeVisibilitySectionProps {
	duration: number;
	visibilityOptions: string[];
}

export function ChallengeVisibilitySection({
	duration,
	visibilityOptions,
}: ChallengeVisibilitySectionProps) {
	const [localDuration, setLocalDuration] = useState(duration);
	const [selectedVisibility, setSelectedVisibility] = useState<string[]>([]);

	useEffect(() => {
		setLocalDuration(duration);
	}, [duration]);

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
								<Ionicons name="lock-closed" size={14} color={colors.textSecondary} />
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
			<GradientBox colors={['#3C3C3E', '#1C1C1E']} style={styles.dropdownShell}>
				<Row justify="space-between" align="center" style={styles.durationRow}>
					<Text variant="subheader">Challenge Duration</Text>
					<Row justify="flex-end" align="center" gap="xs" style={styles.durationControlGroup}>
						<Input
							value={String(localDuration)}
							onChangeText={(value) => {
								const numeric = value.replace(/[^0-9]/g, '');
								setLocalDuration(numeric.length > 0 ? Number(numeric) : duration);
							}}
							keyboardType="number-pad"
							variant="filled"
							placeholder={String(duration)}
							placeholderVariant="secondary"
							style={styles.durationInput}
						/>
						<Text variant="body">DAYS</Text>
					</Row>
				</Row>
			</GradientBox>

			<GradientBox colors={['#3C3C3E', '#1C1C1E']} style={styles.dropdownShell}>
				<Dropdown
					placeholder="Visibility"
					options={options}
					selectedValues={selectedVisibility}
					onChange={setSelectedVisibility}
					maxSelections={1}
					showValueInline
					rightIcon={<Ionicons name="chevron-down" size={16} color={colors.textSecondary} />}
				/>
			</GradientBox>
		</Stack>
	);
}

const styles = {
	dropdownShell: {
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
