import { useMemo } from 'react';
import { Dropdown } from '../ui/dropdown';
import { Stack } from '../layout/stack';
import { ActivityIcon } from '../icons/activityIcon';
import { ActivityType } from '../../constants/theme';
import { LocationIcon, LocationType } from '../icons/locationIcon';
import { radius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { useChallengeBuilder } from '../../store/challengeBuilderStore';
import { View } from 'react-native';

export interface ChallengeConfigurationSectionProps {
	categories: string[];
	locations: string[];
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
}: ChallengeConfigurationSectionProps) {
	const selectedCategories = useChallengeBuilder((state) => state.selectedCategories);
	const selectedLocations = useChallengeBuilder((state) => state.selectedLocations);
	const setSelectedCategories = useChallengeBuilder((state) => state.setSelectedCategories);
	const setSelectedLocations = useChallengeBuilder((state) => state.setSelectedLocations);

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

	return (
		<Stack gap="md">
			<View style={styles.dropdownShell}>
				<Dropdown
					placeholder="Exercise categories"
					options={categoryOptions}
					selectedValues={selectedCategories}
					onChange={setSelectedCategories}
					rightIcon={<Ionicons name="chevron-down" size={16} color={colors.primary} />}
				/>
			</View>

			<View style={styles.dropdownShell}>
				<Dropdown
					placeholder="Challenge location"
					options={locationOptions}
					selectedValues={selectedLocations}
					onChange={setSelectedLocations}
					rightIcon={<Ionicons name="chevron-down" size={16} color={colors.primary} />}
				/>
			</View>
		</Stack>
	);
}

const styles = {
	dropdownShell: {
		borderWidth: 1,
		borderColor: colors.border,
		shadowColor: colors.surfaceHighlight,
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.2,
		shadowRadius: 18,
		elevation: 8,
		borderRadius: radius.lg,
		overflow: 'hidden' as const,
	},
};
