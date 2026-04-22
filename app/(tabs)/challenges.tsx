import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenBackground from '../../components/layout/screenBackground';
import { ChallengeHomeSections } from '../../components/challenges/challengeHomeSections';
import { ChallengePreviewCardProps } from '../../components/challenges/challengePreviewCard';
import { Text } from '../../components/ui/text';
import { spacing } from '../../constants/theme';
import type { ActivityType } from '../../constants/theme';
import type { LocationType } from '../../components/icons/locationIcon';
import { getChallenges } from '../../services/challenge.service';

type BackendChallenge = {
	id: string;
	name: string;
	visibility: string;
	duration_days: number;
	created_by_user_id: string;
};

function toCardProps(c: BackendChallenge): ChallengePreviewCardProps {
	return {
		challengeId: String(c.id),
		days: c.duration_days,
		title: c.name,
		author: 'member',
		badgeLabel: c.visibility === 'public' ? 'PUBLIC' : 'PRIVATE',
		activityType: 'strength' as ActivityType,
		locationIconTypes: ['gym'] as LocationType[],
	};
}

export default function Challenges() {
	const router = useRouter();
	const [challenges, setChallenges] = useState<ChallengePreviewCardProps[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		getChallenges()
			.then((res) => {
				setChallenges((res.data ?? []).map(toCardProps));
			})
			.catch(() => setError('Could not load challenges.'))
			.finally(() => setLoading(false));
	}, []);

	const handleCreateChallenge = () => router.push('/challenge/create');
	const handleOpenChallenge = (id: string) => router.push(`/challenge/${id}`);

	if (loading) {
		return (
			<ScreenBackground variant="challenges">
				<View style={styles.center}>
					<ActivityIndicator color="#ffffff" />
				</View>
			</ScreenBackground>
		);
	}

	return (
		<ScreenBackground variant="challenges">
			<ScrollView contentContainerStyle={styles.container}>
				{error ? (
					<View style={styles.center}>
						<Text tone="secondary">{error}</Text>
					</View>
				) : (
					<ChallengeHomeSections
						yourChallenges={[]}
						exploreChallenges={challenges}
						onCreateChallenge={handleCreateChallenge}
						onPressChallenge={handleOpenChallenge}
					/>
				)}
			</ScrollView>
		</ScreenBackground>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: spacing.lg,
		flexGrow: 1,
	},
	center: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		minHeight: 200,
	},
});
