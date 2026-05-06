import { ScrollView, StyleSheet } from 'react-native';
import { Stack } from '../layout/stack';
import { ChallengePreviewCard, ChallengePreviewCardProps } from './challengePreviewCard';
import { CreateChallengeCard } from './createChallengeCard';

export interface ChallengePreviewListProps {
	challenges: ChallengePreviewCardProps[];
	showCreateCard?: boolean;
	onCreatePress?: () => void;
	onPressChallenge?: (id: string) => void;
}

export function ChallengePreviewList({ challenges, showCreateCard = false, onCreatePress, onPressChallenge }: ChallengePreviewListProps) {
	return (
		<ScrollView 
			style={styles.scrollContainer}
			scrollEnabled={true}
			nestedScrollEnabled={true}
			showsVerticalScrollIndicator={false}
		>
			<Stack gap="lg">
				{showCreateCard && <CreateChallengeCard onPress={onCreatePress} />}
				{/* Backend contract: each challenge must include a stable challengeId. */}
				{challenges.map((challenge) => (
					<ChallengePreviewCard
						key={challenge.challengeId}
						{...challenge}
						onPress={() => onPressChallenge?.(challenge.challengeId)}
					/>
				))}
			</Stack>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scrollContainer: {
		maxHeight: 500,
	},
});
