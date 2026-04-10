import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityType, colors } from '../../constants/theme';

type ScreenBackgroundVariant = 'default' | 'top' | 'activity' | 'challenges';

interface ScreenBackgroundProps extends ViewProps {
	children: ReactNode;
	variant?: ScreenBackgroundVariant;
	activityType?: ActivityType;
	contentStyle?: StyleProp<ViewStyle>;
}

function withAlpha(hex: string, alpha: number) {
	const normalized = hex.replace('#', '');

	if (normalized.length !== 6) {
		return hex;
	}

	const value = Math.max(0, Math.min(1, alpha));
	const suffix = Math.round(value * 255)
		.toString(16)
		.padStart(2, '0')
		.toUpperCase();

	return `#${normalized}${suffix}`;
}

export default function ScreenBackground({
	children,
	variant = 'default',
	activityType = 'strength',
	style,
	contentStyle,
	...props
}: ScreenBackgroundProps) {
	const activityColor = colors.activityType[activityType];

	return (
		<View style={[styles.container, style]} {...props}>
			{variant === 'default' && (
				<LinearGradient
					colors={['rgba(0, 0, 0, 0)', 'rgba(28, 28, 30, 0.28)', 'rgba(60, 60, 62, 0.34)']}
					start={{ x: 0.5, y: 0 }}
					end={{ x: 0.5, y: 1 }}
					style={styles.bottomDepth}
					pointerEvents="none"
				/>
			)}

			{variant === 'top' && (
				<LinearGradient
					colors={['rgba(124, 124, 126, 0.26)', 'rgba(44, 44, 46, 0.2)', 'rgba(0, 0, 0, 0)']}
					start={{ x: 0.5, y: 0 }}
					end={{ x: 0.5, y: 1 }}
					style={styles.topDepth}
					pointerEvents="none"
				/>
			)}

			{variant === 'activity' && (
				<>
					<LinearGradient
						colors={[
							withAlpha(activityColor, 0.82),
							withAlpha(activityColor, 0.54),
							withAlpha(activityColor, 0.2),
							'rgba(0, 0, 0, 0)',
						]}
						start={{ x: 0.5, y: 0 }}
						end={{ x: 0.5, y: 1 }}
						style={styles.activityTopGradient}
						pointerEvents="none"
					/>

					<View
						style={[styles.activityBloomLeft, { backgroundColor: withAlpha(activityColor, 0.26) }]}
						pointerEvents="none"
					/>
					<View
						style={[styles.activityBloomRight, { backgroundColor: withAlpha(activityColor, 0.22) }]}
						pointerEvents="none"
					/>
					<LinearGradient
						colors={[withAlpha(activityColor, 0.24), 'rgba(0, 0, 0, 0)']}
						start={{ x: 0.5, y: 0 }}
						end={{ x: 0.5, y: 1 }}
						style={styles.activityVeil}
						pointerEvents="none"
					/>
				</>
			)}

			{variant === 'challenges' && (
				<>
					<LinearGradient
						colors={['rgba(60, 60, 62, 0.3)', 'rgba(28, 28, 30, 0.16)', 'rgba(0, 0, 0, 0)']}
						start={{ x: 0.5, y: 0 }}
						end={{ x: 0.5, y: 1 }}
						style={styles.challengesTopDepth}
						pointerEvents="none"
					/>
					<LinearGradient
						colors={['rgba(0, 0, 0, 0)', 'rgba(20, 20, 22, 0.34)', 'rgba(36, 36, 38, 0.44)']}
						start={{ x: 0.5, y: 0 }}
						end={{ x: 0.5, y: 1 }}
						style={styles.challengesBottomDepth}
						pointerEvents="none"
					/>
				</>
			)}

			<LinearGradient
				colors={['rgba(255, 255, 255, 0.06)', 'rgba(0, 0, 0, 0)']}
				start={{ x: 0.5, y: 0 }}
				end={{ x: 0.5, y: 1 }}
				style={styles.globalLift}
				pointerEvents="none"
			/>

			<View style={[styles.content, contentStyle]}>{children}</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
		overflow: 'hidden',
	},
	content: {
		flex: 1,
	},
	globalLift: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		height: '28%',
	},
	bottomDepth: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		height: '48%',
	},
	topDepth: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
		height: '50%',
	},
	activityTopGradient: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
		height: '56%',
	},
	activityVeil: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
		height: '66%',
	},
	activityBloomLeft: {
		position: 'absolute',
		top: -100,
		left: -110,
		width: 300,
		height: 300,
		borderRadius: 999,
	},
	activityBloomRight: {
		position: 'absolute',
		top: -130,
		right: -120,
		width: 320,
		height: 320,
		borderRadius: 999,
	},
	challengesTopDepth: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
		height: '42%',
	},
	challengesBottomDepth: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		height: '40%',
	},
});
