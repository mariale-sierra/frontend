import { Stack } from '../layout/stack';
import { ChallengePreviewCard, ChallengePreviewCardProps } from './challengePreviewCard';

export interface ChallengePreviewListProps {
	challenges: ChallengePreviewCardProps[];
}

export function ChallengePreviewList({ challenges }: ChallengePreviewListProps) {
	return (
		<Stack gap="lg">
			{challenges.map((challenge, index) => (
				<ChallengePreviewCard
					key={`${challenge.title}-${challenge.author}-${index}`}
					{...challenge}
				/>
			))}
		</Stack>
	);
}
