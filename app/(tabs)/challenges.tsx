import { ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ChallengeHomeSections } from '../../components/challenges/challengeHomeSections';
import { ChallengePreviewCardProps } from '../../components/challenges/challengePreviewCard';

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
];

const EXPLORE_CHALLENGES: ChallengePreviewCardProps[] = [
	{
		days: 21,
		title: 'Yoga Flow',
		author: 'yogamaster',
		badgeLabel: 'Flexibility',
		activityType: 'flexibility',
		secondaryIconType: 'mindBody',
		tertiaryIconType: 'cardioLow',
		locationIconTypes: ['home'],
	},
	{
		days: 60,
		title: 'Endurance Boost',
		author: 'runnerx',
		badgeLabel: 'Endurance',
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
		<ScrollView contentContainerStyle={styles.container}>
			<ChallengeHomeSections
				yourChallenges={YOUR_CHALLENGES}
				exploreChallenges={EXPLORE_CHALLENGES}
				onCreateChallenge={handleCreateChallenge}
			/>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 16,
		backgroundColor: '#000000',
		flexGrow: 1,
	},
});