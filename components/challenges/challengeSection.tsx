import { Stack } from '../layout/stack';
import { Divider } from '../ui/divider';
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
	headerListGap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	showHeaderDivider?: boolean;
	onPressChallenge?: (id: string) => void;
}

export function ChallengeSection({ 
	title, 
	challenges, 
	onPressHeader, 
	showAvatar = false,
	showCreateCard = false,
	onCreatePress,
	headerListGap = 'md',
	showHeaderDivider = false,
	onPressChallenge,
}: ChallengeSectionProps) {
	return (
		<Stack gap={headerListGap}>
			<ChallengeSectionHeader title={title} onPress={onPressHeader} showAvatar={showAvatar} />
			{showHeaderDivider && <Divider />}
			<ChallengePreviewList 
				challenges={challenges} 
				showCreateCard={showCreateCard}
				onCreatePress={onCreatePress}
				onPressChallenge={onPressChallenge}
			/>
		</Stack>
	);
}
