import { StyleSheet, View } from 'react-native';
import { Stack } from '../layout/stack';
import { Input } from '../ui/input';
import { Text } from '../ui/text';
import { colors, typography } from '../../constants/theme';

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
	return (
		<Stack gap="md">
			<View style={styles.fieldShell}>
				<Text variant="caption" style={styles.fieldLabel}>Challenge Name</Text>
				<Input
					value={title}
					onChangeText={onChangeTitle}
					placeholder="Name your challenge"
					placeholderVariant="secondary"
					variant="default"
					containerStyle={styles.titleContainer}
					style={styles.titleInput}
				/>
			</View>

			<View style={styles.fieldShell}>
				<Text variant="caption" style={styles.fieldLabel}>Description (Optional)</Text>
				<Input
					value={description}
					onChangeText={onChangeDescription}
					placeholder="Tell people what this challenge is about..."
					placeholderVariant="caption"
					variant="default"
					containerStyle={styles.descriptionContainer}
					multiline
					style={styles.descriptionInput}
				/>
			</View>
		</Stack>
	);
}

const styles = StyleSheet.create({
	fieldShell: {
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.12)',
		borderRadius: 18,
		paddingHorizontal: 12,
		paddingVertical: 10,
		backgroundColor: 'rgba(255,255,255,0.03)',
	},
	fieldLabel: {
		color: 'rgba(255,255,255,0.58)',
		fontSize: 9,
		lineHeight: 12,
		letterSpacing: 0.6,
		marginBottom: 6,
	},
	titleContainer: {
		paddingTop: 0,
		paddingBottom: 2,
		paddingHorizontal: 0,
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
	},
	descriptionInput: {
		...typography.body,
		fontWeight: '500' as const,
		fontSize: 13,
		lineHeight: 18,
		color: colors.textPrimary,
		minHeight: 72,
		textAlignVertical: 'top' as const,
	},
});
