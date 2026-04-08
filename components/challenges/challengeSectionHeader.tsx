import { Pressable, StyleSheet, View } from 'react-native';
import { Row } from '../layout/row';
import { AvatarIcon } from '../icons/avatarIcon';
import { Text } from '../ui/text';

export interface ChallengeSectionHeaderProps {
	title: string;
	onPress?: () => void;
	showAvatar?: boolean;
}

export function ChallengeSectionHeader({ title, onPress, showAvatar = false }: ChallengeSectionHeaderProps) {
	return (
		<Pressable onPress={onPress} style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
			<Row justify="space-between" align="center" style={styles.row}>
				<Row justify="flex-start" align="center" gap="sm">
					{showAvatar ? <AvatarIcon size="sm" /> : null}
					<Text variant="subheader">{title}</Text>
				</Row>

				<Row justify="flex-end" align="center" gap="xs">
					<Text variant="body" tone="secondary">
						See all
					</Text>
					<View style={styles.chevron} />
				</Row>
			</Row>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	pressable: {
		width: '100%',
	},
	pressed: {
		opacity: 0.85,
	},
	row: {
		width: '100%',
	},
	chevron: {
		width: 7,
		height: 7,
		borderTopWidth: 1.5,
		borderRightWidth: 1.5,
		borderColor: '#9CA3AF',
		transform: [{ rotate: '45deg' }],
	},
});
