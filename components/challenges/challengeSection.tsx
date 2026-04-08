import { Stack } from '../layout/stack';
import { ChallengePreviewCardProps } from './challengePreviewCard';
import { ChallengePreviewList } from './challengePreviewList';
import { ChallengeSectionHeader } from './challengeSectionHeader';

export interface ChallengeSectionProps {
	title: string;
	challenges: ChallengePreviewCardProps[];
	onPressHeader?: () => void;
	showAvatar?: boolean;
}

export function ChallengeSection({ title, challenges, onPressHeader, showAvatar = false }: ChallengeSectionProps) {
	return (
		<Stack gap="md">
			<ChallengeSectionHeader title={title} onPress={onPressHeader} showAvatar={showAvatar} />
			<ChallengePreviewList challenges={challenges} />
		</Stack>
	);
}
