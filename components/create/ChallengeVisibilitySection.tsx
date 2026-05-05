import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Stack } from '../layout/stack';
import { Row } from '../layout/row';
import { Input } from '../ui/input';
import { Text } from '../ui/text';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { useTranslation } from 'react-i18next';

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
	const { t } = useTranslation();

	const visibilityCards = useMemo(() => {
		const source = visibilityOptions.filter(
			(option) => option.toLowerCase() === 'public' || option.toLowerCase() === 'private',
		);

		const normalized = source.length > 0 ? source : ['Public', 'Private'];

		return normalized.map((option) => {
			const isPrivate = option.toLowerCase() === 'private';
			const displayLabel = isPrivate
				? t('challengeCreate.visibility.privateLabel')
				: t('challengeCreate.visibility.publicLabel');
			return {
				label: option,
				displayLabel,
				description: isPrivate
					? t('challengeCreate.visibility.privateDescription')
					: t('challengeCreate.visibility.publicDescription'),
				iconName: isPrivate ? 'lock-closed' : 'globe-outline',
			};
		});
	}, [t, visibilityOptions]);

	return (
		<Stack gap="xl">
			<Stack gap="md">
				<View>
					<Text variant="subheader" style={styles.challengeDurationLabel}>{t('challengeCreate.fields.challengeDuration')}</Text>
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
					<Text variant="caption" style={styles.durationInputUnit}>{t('challengeCreate.fields.daysUnit')}</Text>
				</View>

				<Text variant="caption" style={styles.wheelCaption}>
					{t('challengeCreate.fields.cycleBase', { days: baseDuration })}
				</Text>
			</Stack>

			<Stack gap="sm" style={styles.visibilitySection}>
				<Text variant="subheader">{t('challengeCreate.fields.visibility')}</Text>
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
									<Text variant="body" style={styles.visibilityLabel}>{option.displayLabel}</Text>
									<Text variant="caption" style={styles.visibilityDescription}>{option.description}</Text>
								</View>
								{selected && <Ionicons name="checkmark-circle" size={18} color={colors.textPrimary} />}
							</Row>
						</Pressable>
					);
				})}
			</Stack>
		</Stack>
	);
}

const styles = StyleSheet.create({
	durationInputShell: {
		borderRadius: radius.xl,
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.12)',
		backgroundColor: 'rgba(255,255,255,0.03)',
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.lg,
	},
	durationInputContainer: {
		paddingTop: 0,
		paddingBottom: 2,
		paddingHorizontal: 0,
		width: '100%',
	},
	durationInput: {
		...typography.titleLarge,
		fontSize: 32,
		lineHeight: 38,
		textAlign: 'center',
		color: colors.textPrimary,
		paddingVertical: 0,
	},
	durationInputUnit: {
		marginTop: spacing.xxs,
		color: 'rgba(255,255,255,0.72)',
		textAlign: 'center',
		letterSpacing: 1.2,
	},
	challengeDurationLabel: {},
	wheelCaption: {
		color: 'rgba(255,255,255,0.58)',
		textAlign: 'center',
	},
	visibilitySection: {
		marginTop: spacing.lg,
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
