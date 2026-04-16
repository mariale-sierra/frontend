import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Row } from '../layout/row';
import { Text } from '../ui/text';
import { colors, gradients } from '../../constants/theme';
import { GradientBox } from '../layout/gradient-box';
import { useRoutineBuilder } from '../../store/routineBuilderStore';
import { ChallengeRoutineCard } from './ChallengeRoutineCard';

export interface ChallengeDayRowProps {
	dayNumber: number;
	onPress?: () => void;
}

export function ChallengeDayRow({ dayNumber, onPress }: ChallengeDayRowProps) {
	const router = useRouter();
	const routine = useRoutineBuilder((state) => state.routinesByDay[dayNumber]);
	const unassignRoutineFromDay = useRoutineBuilder((state) => state.unassignRoutineFromDay);

	function handleAddRoutine() {
		if (onPress) {
			onPress();
			return;
		}
		router.push(`/challenge/routine/select?day=${dayNumber}`);
	}

	function handleRemoveRoutine() {
		unassignRoutineFromDay(dayNumber);
	}

	return (

		<Row justify="center" align="center" gap="md" style={styles.row}>
			<Text variant="subheader">DAY {dayNumber}</Text>
			{routine ? (
				<ChallengeRoutineCard routine={routine} onPress={handleAddRoutine} onRemove={handleRemoveRoutine} />
			) : (
				<Pressable onPress={handleAddRoutine} style={({ pressed }) => [pressed && styles.pressed]}>
					<GradientBox
						colors={gradients.surfaceVertical.colors}
						start={gradients.surfaceVertical.start}
						end={gradients.surfaceVertical.end}
						style={styles.miniCard}
					>
						<Text style={styles.plusSign}>+</Text>
					</GradientBox>
				</Pressable>
			)}
		</Row>
	);
}

const styles = StyleSheet.create({
	row: {
		width: '100%',
	},
	miniCard: {
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
