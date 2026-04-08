import { Pressable, StyleSheet, View } from 'react-native';
import { AvatarIcon } from '../icons/avatarIcon';
import { Row } from '../layout/row';
import { Text } from '../ui/text';
import { colors, spacing, radius } from '../../constants/theme';

export interface CreateChallengeHeaderProps {
	author: string;
	onClose?: () => void;
}

export function CreateChallengeHeader({ author, onClose }: CreateChallengeHeaderProps) {
	return (
		<Row justify="space-between" align="center">
			<Row justify="flex-start" align="center" gap="sm">
				<AvatarIcon size="sm" />
				<Text variant="body">By {author}</Text>
			</Row>

			<Pressable onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
				<View style={styles.closeIconLineA} />
				<View style={styles.closeIconLineB} />
			</Pressable>
		</Row>
	);
}

const styles = StyleSheet.create({
	closeButton: {
		width: 32,
		height: 32,
		borderRadius: radius.md,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: colors.surface,
	},
	pressed: {
		opacity: 0.85,
	},
	closeIconLineA: {
		position: 'absolute',
		width: 14,
		height: 1.5,
		backgroundColor: colors.textSecondary,
		transform: [{ rotate: '45deg' }],
	},
	closeIconLineB: {
		position: 'absolute',
		width: 14,
		height: 1.5,
		backgroundColor: colors.textSecondary,
		transform: [{ rotate: '-45deg' }],
	},
});
