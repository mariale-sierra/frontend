import { Stack } from '../layout/stack';
import { ChallengePreviewCardProps } from './challengePreviewCard';
import { ChallengePreviewList } from './challengePreviewList';
import { ChallengeSectionHeader } from './challengeSectionHeader';

export interface ChallengeSectionProps {
	title: string;
	challenges: ChallengePreviewCardProps[];
	onPressHeader?: () => void;
	showAvatar?: boolean;
	showCreateCard?: boolean;
	onCreatePress?: () => void;
}

export function ChallengeSection({ 
	title, 
	challenges, 
	onPressHeader, 
	showAvatar = false,
	showCreateCard = false,
	onCreatePress,
}: ChallengeSectionProps) {
	return (
		<Stack gap="md">
			<ChallengeSectionHeader title={title} onPress={onPressHeader} showAvatar={showAvatar} />
			<ChallengePreviewList 
				challenges={challenges} 
				showCreateCard={showCreateCard}
				onCreatePress={onCreatePress}
			/>
		</Stack>
	);
}
