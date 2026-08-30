import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { colors, fillOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

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
			<ActivityIndicator size="large" color={colors.paper} />
		</View>
	);
}

const styles = StyleSheet.create({
	overlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: withAlpha(colors.ink, fillOpacity.dim),
		justifyContent: 'center',
		alignItems: 'center',
	},
});