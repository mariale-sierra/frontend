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
}

export function ChallengeTitleInputs({
	title,
	description,
	onChangeTitle,
	onChangeDescription,
}: ChallengeTitleInputsProps) {
	const { t } = useTranslation();

	return (
		<Stack gap="md">
			<View style={styles.fieldShell}>
				<Input
					value={title}
					onChangeText={onChangeTitle}
					variant="default"
					placeholder={t('challengeCreate.fields.challengeName')}
					placeholderVariant="caption"
					containerStyle={styles.titleContainer}
					style={styles.titleInput}
				/>
				<View style={[styles.fieldLine, title.trim().length > 0 && styles.fieldLineActive]} />
			</View>

			<View style={styles.fieldShell}>
				<Input
					value={description}
					onChangeText={onChangeDescription}
					variant="default"
					placeholder={t('challengeCreate.fields.descriptionOptional')}
					placeholderVariant="caption"
					containerStyle={styles.descriptionContainer}
					style={styles.descriptionInput}
				/>
				<View style={[styles.fieldLine, description.trim().length > 0 && styles.fieldLineActive]} />
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
	fieldLine: {
		height: 1,
		backgroundColor: 'rgba(255,255,255,0.28)',
		marginTop: 6,
	},
	fieldLineActive: {
		backgroundColor: colors.textPrimary,
	},
});
