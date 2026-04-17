import { ScrollView, StyleSheet } from 'react-native';
import { Stack } from '../layout/stack';
import { ChallengePreviewCard, ChallengePreviewCardProps } from './challengePreviewCard';
import { CreateChallengeCard, CreateChallengeCardProps } from './createChallengeCard';

export interface ChallengePreviewListProps {
	challenges: ChallengePreviewCardProps[];
	showCreateCard?: boolean;
	onCreatePress?: () => void;
}

export function ChallengePreviewList({ challenges, showCreateCard = false, onCreatePress }: ChallengePreviewListProps) {
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
				{challenges.map((challenge, index) => (
					<ChallengePreviewCard
						key={challenge.challengeId || `${challenge.title}-${challenge.author}-${index}`}
						{...challenge}
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
