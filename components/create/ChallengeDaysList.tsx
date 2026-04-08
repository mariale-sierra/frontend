import { Stack } from '../layout/stack';
import { ChallengeDayRow } from './ChallengeDayRow';

export interface ChallengeDaysListProps {
	days: number;
}

export function ChallengeDaysList({ days }: ChallengeDaysListProps) {
	const safeDays = Math.max(0, days);

	return (
		<Stack gap="md">
			{Array.from({ length: safeDays }, (_, index) => (
				<ChallengeDayRow key={`day-${index + 1}`} dayNumber={index + 1} />
			))}
		</Stack>
	);
}
