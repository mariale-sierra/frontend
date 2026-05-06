import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenBackground from '../../components/layout/screenBackground';
import {
	ChallengeListSections,
	type ChallengesScreenViewModel,
} from '../../components/challenges';
import { Text } from '../../components/ui/text';
import { spacing } from '../../constants/theme';
import { getChallenges } from '../../services/challenge/challenge.service';
import { toChallengeListViewModel } from '../../services/adapters/index';
import { useTranslation } from 'react-i18next';

export default function Challenges() {
	const router = useRouter();
	const { t } = useTranslation();
	const [challengeView, setChallengeView] = useState<ChallengesScreenViewModel>({
		activeChallenges: [],
		exploreChallenges: [],
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		getChallenges()
			.then((res) => {
				setChallengeView(
					toChallengeListViewModel(res ?? [], {
						membersLabel: t('challenges.members'),
						unknownCreatorLabel: t('challenges.unknownCreator'),
						durationLabel: t('challenges.durationUnit'),
						locationFallbackLabel: t('challenges.locationFallback'),
						categoryFallbackLabel: t('challenges.categoryFallback'),
					}),
				);
			})
			.catch(() => setError(t('challenges.loadError')))
			.finally(() => setLoading(false));
	}, [t]);

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
					<ChallengeListSections
						title={t('challenges.screenTitle')}
						activeLabel={t('challenges.activeTitle')}
						exploreLabel={t('challenges.exploreTitle')}
						seeAllLabel={t('challenges.seeAll')}
						joinOrCreateLabel={t('challenges.joinOrCreate')}
						dayLabelBuilder={(day: number) => t('challenges.dayLabel', { day })}
						streakLabelBuilder={(count: number) => t('challenges.streakLabel', { count })}
						activeChallenges={challengeView.activeChallenges}
						exploreChallenges={challengeView.exploreChallenges}
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
