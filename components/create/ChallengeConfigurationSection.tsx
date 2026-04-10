import { useMemo, useState } from 'react';
import { Dropdown } from '../ui/dropdown';
import { Stack } from '../layout/stack';
import { ActivityIcon } from '../icons/activityIcon';
import { ActivityType } from '../../constants/theme';
import { DurationStepper } from './DurationStepper';
import { GradientBox } from '../layout/gradient-box';
import { LocationIcon, LocationType } from '../icons/locationIcon';
import { radius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

export interface ChallengeConfigurationSectionProps {
	categories: string[];
	locations: string[];
	duration: number;
	onChangeDuration?: (value: number) => void;
}

const ACTIVITY_ORDER: ActivityType[] = [
	'strength',
	'cardioIntense',
	'flexibility',
	'cardioLow',
	'mindBody',
	'functional',
];

export function ChallengeConfigurationSection({
	categories,
	locations,
	duration,
	onChangeDuration,
}: ChallengeConfigurationSectionProps) {
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

	const categoryOptions = useMemo(
		() =>
			categories.map((category, index) => ({
				label: category,
				value: category,
				icon: <ActivityIcon type={ACTIVITY_ORDER[index % ACTIVITY_ORDER.length]} size="sm" />,
			})),
		[categories],
	);

	const locationOptions = useMemo(
		() =>
			locations.map((location) => {
				const normalized = location.toLowerCase();
				const locationType: LocationType =
					normalized === 'gym'
						? 'gym'
						: normalized === 'home'
						? 'home'
						: normalized === 'outdoor'
						? 'outdoor'
						: normalized === 'studio'
						? 'studio'
						: 'anywhere';

				return {
					label: location,
					value: location,
					icon: <LocationIcon type={locationType} size="sm" />,
				};
			}),
		[locations],
	);

	const handleIncrement = () => onChangeDuration?.(duration + 1);
	const handleDecrement = () => onChangeDuration?.(Math.max(1, duration - 1));

	return (
		<Stack gap="md">
			<GradientBox colors={['#3C3C3E', '#1C1C1E']} style={styles.dropdownShell}>
				<Dropdown
					placeholder="Exercise categories"
					options={categoryOptions}
					selectedValues={selectedCategories}
					onChange={setSelectedCategories}
					rightIcon={<Ionicons name="chevron-down" size={16} color={colors.primary} />}
				/>
			</GradientBox>

			<GradientBox colors={['#3C3C3E', '#1C1C1E']} style={styles.dropdownShell}>
				<Dropdown
					placeholder="Challenge location"
					options={locationOptions}
					selectedValues={selectedLocations}
					onChange={setSelectedLocations}
					rightIcon={<Ionicons name="chevron-down" size={16} color={colors.primary} />}
				/>
			</GradientBox>

			<DurationStepper
				label="Cycle Duration"
				value={duration}
				onIncrement={handleIncrement}
				onDecrement={handleDecrement}
			/>
		</Stack>
	);
}

const styles = {
	dropdownShell: {
		borderRadius: radius.lg,
		overflow: 'hidden' as const,
	},
};
