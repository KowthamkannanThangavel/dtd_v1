import { colors, typography } from '@dtd/tokens';
import { StyleSheet, Text, View } from 'react-native';

// Placeholder root screen; the first-launch flow replaces it in a later S0 task.
export default function App() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        DairyToDoor Delivery
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background.page },
  title: {
    color: colors.content.primary,
    fontSize: typography.styles.h1.size,
    lineHeight: typography.styles.h1.lineHeight,
    fontWeight: typography.styles.h1.weight,
  },
});
