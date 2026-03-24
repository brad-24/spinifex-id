import { router } from 'expo-router';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🌿</Text>
          </View>
          <Text style={styles.appTitle}>Spinifex ID</Text>
          <Text style={styles.appSubtitle}>Spinifex Species Identifier</Text>
        </View>

        {/* Hero card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroHeading}>Identify your spinifex</Text>
          <Text style={styles.heroDescription}>
            Take or upload a photo of a spinifex plant and this app will identify
            which of the 60+ Australian spinifex species it is, based on visual
            features and your location.
          </Text>
          <View style={styles.heroDivider} />
          <Text style={styles.heroDetails}>
            Get a ranked list of likely species with confidence rating, key
            identifying features, location context, and land management notes.
          </Text>
        </View>

        {/* Feature chips */}
        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>📷  Camera or gallery</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>🌍  Australian habitats</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>🔬  AI-powered ID</Text>
          </View>
        </View>

        {/* CTA button */}
        <Pressable
          style={({ pressed }) => [styles.identifyButton, pressed && styles.identifyButtonPressed]}
          onPress={() => router.push('/identify')}
          accessibilityRole="button"
          accessibilityLabel="Identify a plant"
        >
          <Text style={styles.identifyButtonText}>Identify a Plant</Text>
          <Text style={styles.identifyButtonArrow}>→</Text>
        </Pressable>

        {/* Footer note */}
        <Text style={styles.footerNote}>
          Powered by Claude AI
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accentPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  logoEmoji: {
    fontSize: 40,
  },
  appTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  heroHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  heroDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  heroDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 14,
  },
  heroDetails: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  chipsRow: {
    gap: 10,
    marginBottom: 32,
  },
  chip: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  identifyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  identifyButtonPressed: {
    backgroundColor: Colors.primaryDark,
    transform: [{ scale: 0.98 }],
  },
  identifyButtonText: {
    color: Colors.textOnDark,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  identifyButtonArrow: {
    color: Colors.textOnDark,
    fontSize: 20,
    fontWeight: '700',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
});
