import { Divider } from '../ui/divider';
import { Stack } from '../layout/stack';
import { ChallengePreviewCardProps } from './challengePreviewCard';
import { ChallengeSection } from './challengeSection';

export interface ChallengeHomeSectionsProps {
	yourChallenges: ChallengePreviewCardProps[];
	exploreChallenges: ChallengePreviewCardProps[];
	onPressYourChallenges?: () => void;
	onPressExploreChallenges?: () => void;
}

export function ChallengeHomeSections({
	yourChallenges,
	exploreChallenges,
	onPressYourChallenges,
	onPressExploreChallenges,
}: ChallengeHomeSectionsProps) {
	return (
		<Stack gap="md">
			<ChallengeSection
				title="Your Challenges"
				challenges={yourChallenges}
				onPressHeader={onPressYourChallenges}
				showAvatar
			/>

			<Divider />

			<ChallengeSection
				title="Explore Challenges"
				challenges={exploreChallenges}
				onPressHeader={onPressExploreChallenges}
			/>
		</Stack>
	);
}
