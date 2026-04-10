import { Divider } from '../ui/divider';
import { Stack } from '../layout/stack';
import { StyleSheet, View } from 'react-native';
import { ChallengePreviewCardProps } from './challengePreviewCard';
import { ChallengeSection } from './challengeSection';

export interface ChallengeHomeSectionsProps {
	yourChallenges: ChallengePreviewCardProps[];
	exploreChallenges: ChallengePreviewCardProps[];
	onPressYourChallenges?: () => void;
	onPressExploreChallenges?: () => void;
	onCreateChallenge?: () => void;
}

export function ChallengeHomeSections({
	yourChallenges,
	exploreChallenges,
	onPressYourChallenges,
	onPressExploreChallenges,
	onCreateChallenge,
}: ChallengeHomeSectionsProps) {
	return (
		<Stack gap="md">
			<ChallengeSection
				title="Your Challenges"
				challenges={yourChallenges}
				onPressHeader={onPressYourChallenges}
				showAvatar
				showCreateCard
				onCreatePress={onCreateChallenge}
				headerListGap="lg"
				showHeaderDivider
			/>

			<Divider />

			<View style={styles.exploreSectionSpacing}>
				<ChallengeSection
					title="Explore Challenges"
					challenges={exploreChallenges}
					onPressHeader={onPressExploreChallenges}
					headerListGap="lg"
				/>
			</View>
		</Stack>
	);
}

const styles = StyleSheet.create({
	exploreSectionSpacing: {
		marginTop: 12,
	},
});
