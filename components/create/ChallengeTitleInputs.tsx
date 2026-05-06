import { StyleSheet, View } from 'react-native';
import { Stack } from '../layout/stack';
import { Input } from '../ui/input';
import { colors, typography } from '../../constants/theme';
import { useTranslation } from 'react-i18next';

export interface ChallengeTitleInputsProps {
	title: string;
	description: string;
	onChangeTitle?: (value: string) => void;
	onChangeDescription?: (value: string) => void;
	titlePlaceholder?: string;
	descriptionPlaceholder?: string;
	showDescriptionBottomLine?: boolean;
	mode?: 'challenge' | 'routine';
}

export function ChallengeTitleInputs({
	title,
	description,
	onChangeTitle,
	onChangeDescription,
	titlePlaceholder,
	descriptionPlaceholder,
	showDescriptionBottomLine = true,
	mode = 'challenge',
}: ChallengeTitleInputsProps) {
	const { t } = useTranslation();
	const routineMode = mode === 'routine';

	return (
		<Stack gap="md">
			<View style={styles.fieldShell}>
				<Input
					value={title}
					onChangeText={onChangeTitle}
					variant="default"
					placeholder={titlePlaceholder ?? t('challengeCreate.fields.challengeName')}
					placeholderVariant="caption"
					containerStyle={[styles.titleContainer, routineMode && styles.routineTitleContainer]}
					style={[styles.titleInput, routineMode && styles.routineTitleInput]}
				/>
				<View
					style={[
						styles.fieldLine,
						routineMode && styles.routineFieldLine,
						!routineMode && title.trim().length > 0 && styles.fieldLineActive,
					]}
				/>
			</View>

			<View style={styles.fieldShell}>
				<Input
					value={description}
					onChangeText={onChangeDescription}
					variant="default"
					placeholder={descriptionPlaceholder ?? t('challengeCreate.fields.descriptionOptional')}
					placeholderVariant="caption"
					containerStyle={[styles.descriptionContainer, routineMode && styles.routineDescriptionContainer]}
					style={[styles.descriptionInput, routineMode && styles.routineDescriptionInput]}
				/>
				{showDescriptionBottomLine ? (
					<View style={[styles.fieldLine, description.trim().length > 0 && styles.fieldLineActive]} />
				) : null}
			</View>
		</Stack>
	);
}

const styles = StyleSheet.create({
	fieldShell: {
		paddingHorizontal: 2,
		paddingVertical: 6,
	},
	titleContainer: {
		paddingTop: 0,
		paddingBottom: 2,
		paddingHorizontal: 0,
		borderRadius: 0,
	},
	titleInput: {
		...typography.title,
		fontSize: 22,
		lineHeight: 26,
		color: colors.textPrimary,
		paddingVertical: 0,
	},
	descriptionContainer: {
		paddingTop: 0,
		paddingHorizontal: 0,
		borderRadius: 0,
	},
	descriptionInput: {
		...typography.body,
		fontWeight: '500' as const,
		fontSize: 13,
		lineHeight: 18,
		color: colors.textPrimary,
	},
	routineTitleContainer: {
		paddingBottom: 3,
	},
	routineTitleInput: {
		fontWeight: '600' as const,
		fontSize: 30,
		lineHeight: 34,
		letterSpacing: 0.2,
	},
	routineFieldLine: {
		backgroundColor: 'rgba(255,255,255,0.16)',
	},
	routineDescriptionContainer: {
		paddingTop: 2,
	},
	routineDescriptionInput: {
		color: 'rgba(255,255,255,0.54)',
		fontSize: 13,
		lineHeight: 18,
	},
	fieldLine: {
		height: 1,
		backgroundColor: 'rgba(255,255,255,0.28)',
		marginTop: 6,
	},
	fieldLineActive: {
		backgroundColor: colors.textPrimary,
	},
});
