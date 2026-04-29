import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type LoaderProps = {
	visible: boolean;
	overlayStyle?: ViewStyle;
};

export function Loader({ visible, overlayStyle }: LoaderProps) {
	const { colors } = useTheme();

	if (!visible) {
		return null;
	}

	return (
		<View style={[styles.overlay, overlayStyle]}>
			<ActivityIndicator size="large" color={colors.textPrimary} />
		</View>
	);
}

const styles = StyleSheet.create({
	overlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
});