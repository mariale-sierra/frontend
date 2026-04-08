import { Pressable, StyleSheet } from 'react-native';
import { Card } from '../ui/card';
import { Row } from '../layout/row';
import { Text } from '../ui/text';
import { colors, gradients } from '../../constants/theme';
import { GradientBox } from '../layout/gradient-box';

export interface ChallengeDayRowProps {
	dayNumber: number;
	onPress?: () => void;
}

export function ChallengeDayRow({ dayNumber, onPress }: ChallengeDayRowProps) {
	return (
		<Row justify="center" align="center" gap="md" style={styles.row}>
			<Text variant="subheader">DAY {dayNumber}</Text>
			<Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
				<Card variant="basic" style={styles.card}>
					<GradientBox
						colors={gradients.surfaceVertical.colors}
						start={gradients.surfaceVertical.start}
						end={gradients.surfaceVertical.end}
						style={styles.innerMiniCard}
					>
						<Text style={styles.plusSign}>+</Text>
					</GradientBox>
				</Card>
			</Pressable>
		</Row>
	);
}

const styles = StyleSheet.create({
	row: {
		width: '100%',
	},
	card: {
		width: 260,
		height: 108,
		justifyContent: 'center',
		alignItems: 'center',
	},
	innerMiniCard: {
		width: 200,
		height: 76,
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: 'center',
	},
	plusSign: {
		fontSize: 28,
		lineHeight: 28,
		color: colors.textPrimary,
	},
	pressed: {
		opacity: 0.85,
	},
});
