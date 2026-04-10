import { ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenBackground from '../../components/layout/screenBackground';
import { ChallengeHomeSections } from '../../components/challenges/challengeHomeSections';
import { ChallengePreviewCardProps } from '../../components/challenges/challengePreviewCard';
import { spacing } from '../../constants/theme';

const YOUR_CHALLENGES: ChallengePreviewCardProps[] = [
	{
		days: 30,
		title: 'Morning Run',
		author: 'johndoe',
		badgeLabel: 'Active',
		activityType: 'cardioIntense',
		secondaryIconType: 'cardioLow',
		tertiaryIconType: 'functional',
		locationIconTypes: ['outdoor'],
		badgeVariant: 'default',
	},
	{
		days: 14,
		title: 'Full Body Strength',
		author: 'janesmith',
		badgeLabel: 'Inactive',
		activityType: 'strength',
		secondaryIconType: 'functional',
		tertiaryIconType: 'mindBody',
		locationIconTypes: ['gym'],
		badgeVariant: 'default',
	},

  {
		days: 30,
		title: 'Pilates Power',
		author: 'janesmith',
		badgeLabel: 'Inactive',
		activityType: 'mindBody',
		secondaryIconType: 'flexibility',
		tertiaryIconType: 'functional',
		locationIconTypes: ['gym'],
		badgeVariant: 'default',
	},
];

const EXPLORE_CHALLENGES: ChallengePreviewCardProps[] = [
	{
		days: 21,
		title: 'Yoga Flow',
		author: 'yogamaster',
		badgeLabel: 'POPULAR',
		activityType: 'flexibility',
		secondaryIconType: 'mindBody',
		tertiaryIconType: 'cardioLow',
		locationIconTypes: ['home'],
	},
	{
		days: 60,
		title: 'Endurance Boost',
		author: 'runnerx',
		badgeLabel: 'POPULAR',
		activityType: 'cardioIntense',
		secondaryIconType: 'cardioLow',
		tertiaryIconType: 'functional',
		locationIconTypes: ['outdoor'],
	},
];

export default function Challenges() {
	const router = useRouter();

	const handleCreateChallenge = () => {
		router.push('/challenge/create');
	};

	return (
		<ScreenBackground variant="default">
			<ScrollView contentContainerStyle={styles.container}>
				<ChallengeHomeSections
					yourChallenges={YOUR_CHALLENGES}
					exploreChallenges={EXPLORE_CHALLENGES}
					onCreateChallenge={handleCreateChallenge}
				/>
			</ScrollView>
		</ScreenBackground>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: spacing.lg,
		flexGrow: 1,
	},
});