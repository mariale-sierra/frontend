import { Stack } from '../layout/stack';
import { Input } from '../ui/input';
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
		<Stack gap="xs">
			<Input
				value={title}
				onChangeText={onChangeTitle}
				placeholder="Name your challenge"
				placeholderVariant="secondary"
				variant="default"
				style={styles.titleInput}
			/>

			<Input
				value={description}
				onChangeText={onChangeDescription}
				placeholder="Add a challenge description..."
				placeholderVariant="caption"
				variant="default"
				multiline
				style={styles.descriptionInput}
			/>
		</Stack>
	);
}

const styles = {
	titleInput: {
		...typography.title,
		color: colors.textPrimary,
		paddingVertical: 0,
	},
	descriptionInput: {
		...typography.body,
		fontWeight: '600' as const,
		color: colors.textPrimary,
		minHeight: 72,
		textAlignVertical: 'top' as const,
	},
};
