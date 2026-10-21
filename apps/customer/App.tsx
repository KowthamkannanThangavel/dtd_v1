import { StyleSheet, Text, View } from 'react-native';

// Placeholder root screen; the first-launch flow replaces it in a later S0 task.
export default function App() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header">DairyToDoor</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
