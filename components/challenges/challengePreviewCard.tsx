import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Text } from '../ui/text';
import { Row } from '../layout/row';
import { Stack } from '../layout/stack';
import { IconStack } from '../layout/iconStack';
import { ActivityIcon } from '../icons/activityIcon';
import { AvatarIcon } from '../icons/avatarIcon';
import { LocationIcon, LocationType } from '../icons/locationIcon';
import { ActivityType } from '../../constants/theme';

export interface ChallengePreviewCardProps {
	days: number;
	title: string;
	author: string;
	badgeLabel: string;
	activityType: ActivityType;
	secondaryIconType: ActivityType;
	tertiaryIconType: ActivityType;
	locationIconTypes: LocationType[];
	onPress?: () => void;
	style?: ViewStyle;
	badgeVariant?: 'default' | 'minimal';
}

export function ChallengePreviewCard({
	days,
	title,
	author,
	badgeLabel,
	activityType,
	secondaryIconType,
	tertiaryIconType,
	locationIconTypes,
	onPress,
	style,
	badgeVariant = 'minimal',
}: ChallengePreviewCardProps) {
	const visibleLocationIcons =
		title.length > 42
			? []
			: title.length > 28
			? locationIconTypes.slice(0, 1)
			: locationIconTypes;

	return (
		<Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
			<Card
				variant="activityOutlineGlow"
				activityType={activityType}
				padding="md"
				radius="xl"
				style={style}
			>
				<Row justify="space-between" align="flex-start" style={styles.contentRow}>
					<Stack gap="sm" style={styles.leftColumn}>
						<Row justify="flex-start" align="center" gap="xs">
							<Text variant="title">{days}</Text>
							<Text variant="header" tone='primary'>days</Text>
						</Row>

						<Row justify="flex-start" align="center" gap="sm">
							<Text style={styles.titleText}>{title}</Text>
							<IconStack>
								{visibleLocationIcons.map((locationType, index) => (
									<LocationIcon key={`location-${locationType}-${index}`} type={locationType} size="sm" />
								))}
							</IconStack>
						</Row>

						<Row justify="flex-start" align="center" gap="sm">
							<AvatarIcon size="sm" />
							<Text variant="body" tone="secondary">By {author}</Text>
						</Row>
					</Stack>

					<Row justify="flex-end" align="center" gap="sm" style={styles.rightMetaRow}>
						<Badge label={badgeLabel} variant={badgeVariant} />

						<IconStack>
							<ActivityIcon type={activityType} size="sm" />
							<ActivityIcon type={secondaryIconType} size="sm" />
							<ActivityIcon type={tertiaryIconType} size="sm" />
						</IconStack>
					</Row>
				</Row>
			</Card>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	pressed: {
		opacity: 0.9,
	},
	contentRow: {
		width: '100%',
	},
	leftColumn: {
		flex: 1,
		minWidth: 0,
	},
	titleText: {
		flexShrink: 0,
		flex: 1,
	},
	rightMetaRow: {
		flexShrink: 0,
	},
});
