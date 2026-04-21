import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Stack } from '../layout/stack';
import { GradientBox } from '../layout/gradient-box';
import { Row } from '../layout/row';
import { Input } from '../ui/input';
import { Text } from '../ui/text';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, radius, spacing, typography } from '../../constants/theme';

export interface ChallengeVisibilitySectionProps {
	baseDuration: number;
	challengeDuration: number;
	visibilityOptions: string[];
	selectedVisibility: string | null;
	onChangeChallengeDuration?: (value: number) => void;
	onChangeVisibility?: (value: string | null) => void;
}

export function ChallengeVisibilitySection({
	baseDuration,
	challengeDuration,
	visibilityOptions,
	selectedVisibility,
	onChangeChallengeDuration,
	onChangeVisibility,
}: ChallengeVisibilitySectionProps) {
	const visibilityCards = useMemo(() => {
		const source = visibilityOptions.filter(
			(option) => option.toLowerCase() === 'public' || option.toLowerCase() === 'private',
		);

		const normalized = source.length > 0 ? source : ['Public', 'Private'];

		return normalized.map((option) => {
			const isPrivate = option.toLowerCase() === 'private';
			return {
				label: option,
				description: isPrivate
					? 'Only people you explicitly share it with can see or join.'
					: 'Anyone can discover, join, and share the challenge.',
				iconName: isPrivate ? 'lock-closed' : 'globe-outline',
			};
		});
	}, [visibilityOptions]);

	return (
		<Stack gap="xl">
			<GradientBox
				colors={gradients.surface.colors}
				start={gradients.surface.start}
				end={gradients.surface.end}
				style={styles.durationHero}
			>
				<Stack gap="md">
					<View>
						<Text variant="subheader">Challenge Duration</Text>
					</View>

					<View style={styles.durationInputShell}>
						<Input
							value={challengeDuration === 0 ? '' : String(challengeDuration)}
							onChangeText={(value) => {
								const numeric = value.replace(/[^0-9]/g, '');
								onChangeChallengeDuration?.(numeric.length > 0 ? Number(numeric) : 0);
							}}
							keyboardType="number-pad"
							variant="default"
							placeholder={String(baseDuration || 1)}
							placeholderVariant="secondary"
							containerStyle={styles.durationInputContainer}
							style={styles.durationInput}
						/>
						<Text variant="caption" style={styles.durationInputUnit}>days</Text>
					</View>

					<Text variant="caption" style={styles.wheelCaption}>Cycle base: {baseDuration} days</Text>
				</Stack>
			</GradientBox>

			<Stack gap="sm">
				<Text variant="subheader">Visibility</Text>
				{visibilityCards.map((option) => {
					const selected = selectedVisibility === option.label;
					return (
						<Pressable
							key={option.label}
							onPress={() => onChangeVisibility?.(option.label)}
							style={({ pressed }) => [styles.visibilityCard, selected && styles.visibilityCardSelected, pressed && styles.pressed]}
						>
							<Row align="center" gap="md" style={styles.visibilityRow}>
								<View style={styles.visibilityIconShell}>
									<Ionicons name={option.iconName as 'lock-closed' | 'globe-outline'} size={16} color={colors.textPrimary} />
								</View>
								<View style={styles.visibilityTextBlock}>
									<Text variant="body" style={styles.visibilityLabel}>{option.label}</Text>
									<Text variant="caption" style={styles.visibilityDescription}>{option.description}</Text>
								</View>
								{selected && <Ionicons name="checkmark-circle" size={18} color={colors.success} />}
							</Row>
						</Pressable>
					);
				})}
			</Stack>
		</Stack>
	);
}

const styles = StyleSheet.create({
	durationHero: {
		borderRadius: radius['2xl'],
		padding: spacing.lg,
	},
	durationInputShell: {
		borderRadius: radius.xl,
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.12)',
		backgroundColor: 'rgba(255,255,255,0.03)',
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	durationInputContainer: {
		paddingTop: 0,
		paddingBottom: 2,
		paddingHorizontal: 0,
		width: '100%',
	},
	durationInput: {
		...typography.title,
		fontSize: 22,
		lineHeight: 26,
		textAlign: 'center',
		color: colors.textPrimary,
		paddingVertical: 0,
	},
	durationInputUnit: {
		marginTop: spacing.xxs,
		color: 'rgba(255,255,255,0.72)',
		textAlign: 'center',
	},
	wheelCaption: {
		color: 'rgba(255,255,255,0.58)',
		textAlign: 'center',
	},
	visibilityCard: {
		borderRadius: radius.xl,
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.12)',
		backgroundColor: 'rgba(255,255,255,0.03)',
		padding: spacing.md,
	},
	visibilityCardSelected: {
		borderColor: 'rgba(255,255,255,0.3)',
		backgroundColor: 'rgba(255,255,255,0.08)',
	},
	visibilityRow: {
		width: '100%',
	},
	visibilityIconShell: {
		width: 34,
		height: 34,
		borderRadius: 17,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'rgba(255,255,255,0.06)',
	},
	visibilityTextBlock: {
		flex: 1,
	},
	visibilityLabel: {
		fontWeight: '600',
	},
	visibilityDescription: {
		color: 'rgba(255,255,255,0.56)',
		marginTop: spacing.xxs,
	},
	pressed: {
		opacity: 0.84,
	},
});
