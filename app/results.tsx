import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';
import { clearAnalysisResult, getAnalysisResult } from '../store/resultStore';
import { Confidence, PlantAnalysisResult } from '../types/plant';

const CONFIDENCE_LABELS: Record<Confidence, string> = {
  high: 'High Confidence',
  medium: 'Medium Confidence',
  low: 'Low Confidence',
};

const CONFIDENCE_COLORS: Record<Confidence, string> = {
  high: Colors.confidenceHigh,
  medium: Colors.confidenceMedium,
  low: Colors.confidenceLow,
};

const CONFIDENCE_ICONS: Record<Confidence, string> = {
  high: '✓✓',
  medium: '✓',
  low: '~',
};

function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const bg = CONFIDENCE_COLORS[confidence];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.badgeIcon}>{CONFIDENCE_ICONS[confidence]}</Text>
      <Text style={styles.badgeText}>{CONFIDENCE_LABELS[confidence]}</Text>
    </View>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function ResultsScreen() {
  const [result, setResult] = useState<PlantAnalysisResult | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Load result each time the screen is focused (handles navigating back and forth)
  useFocusEffect(
    useCallback(() => {
      const { result: r, imageUri: uri } = getAnalysisResult();
      if (!r) {
        // No result available — go back to home
        router.replace('/');
        return;
      }
      setResult(r);
      setImageUri(uri);
    }, []),
  );

  function handleTryAnother() {
    clearAnalysisResult();
    router.replace('/identify');
  }

  function handleGoHome() {
    clearAnalysisResult();
    router.replace('/');
  }

  if (!result) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centred}>
          <Text style={styles.loadingText}>Loading results…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isSpinifex = result.isSpinifex;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header bar */}
        <View style={styles.topBar}>
          <Pressable onPress={handleGoHome} style={styles.homeButton} accessibilityLabel="Go home">
            <Text style={styles.homeButtonText}>← Home</Text>
          </Pressable>
          <Text style={styles.screenTitle}>Results</Text>
          <View style={styles.homeButton} />
        </View>

        {/* Hero — species name + spinifex verdict */}
        <View
          style={[
            styles.heroCard,
            isSpinifex ? styles.heroCardSpinifex : styles.heroCardNonSpinifex,
          ]}
        >
          {isSpinifex ? (
            <>
              <View style={styles.verdictRow}>
                <Text style={styles.verdictIcon}>🌿</Text>
                <Text style={[styles.verdictLabel, styles.verdictLabelSpinifex]}>
                  Spinifex Identified
                </Text>
              </View>
              <Text style={styles.speciesName}>{result.speciesName}</Text>
            </>
          ) : (
            <>
              <View style={styles.verdictRow}>
                <Text style={styles.verdictIcon}>❌</Text>
                <Text style={[styles.verdictLabel, styles.verdictLabelNonSpinifex]}>
                  Not Spinifex
                </Text>
              </View>
              <Text style={styles.speciesName}>{result.speciesName}</Text>
              {result.alternativeSuggestion && (
                <View style={styles.alternativeBox}>
                  <Text style={styles.alternativeLabel}>What it might be:</Text>
                  <Text style={styles.alternativeText}>{result.alternativeSuggestion}</Text>
                </View>
              )}
            </>
          )}

          <View style={styles.confidenceRow}>
            <ConfidenceBadge confidence={result.confidence} />
          </View>
        </View>

        {/* Image thumbnail */}
        {imageUri && (
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: imageUri }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            <View style={styles.imageLabelBadge}>
              <Text style={styles.imageLabelText}>Analysed Photo</Text>
            </View>
          </View>
        )}

        {/* Identifying features */}
        {result.identifyingFeatures.length > 0 && (
          <SectionCard icon="🔬" title="Key Identifying Features">
            {result.identifyingFeatures.map((feature, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={styles.featureBullet} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </SectionCard>
        )}

        {/* Habitat */}
        {result.habitat && (
          <SectionCard icon="🗺️" title="Habitat & Distribution">
            <Text style={styles.bodyText}>{result.habitat}</Text>
          </SectionCard>
        )}

        {/* Land management */}
        {result.landManagementNotes && (
          <SectionCard icon="🌾" title="Land Management Notes">
            <Text style={styles.bodyText}>{result.landManagementNotes}</Text>
          </SectionCard>
        )}

        {/* Actions */}
        <View style={styles.actionsGroup}>
          <Pressable
            style={({ pressed }) => [
              styles.tryAnotherButton,
              pressed && styles.tryAnotherButtonPressed,
            ]}
            onPress={handleTryAnother}
            accessibilityRole="button"
            accessibilityLabel="Try another plant"
          >
            <Text style={styles.tryAnotherText}>Try Another Plant</Text>
            <Text style={styles.tryAnotherIcon}>📷</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.homeActionButton,
              pressed && styles.homeActionButtonPressed,
            ]}
            onPress={handleGoHome}
          >
            <Text style={styles.homeActionText}>Back to Home</Text>
          </Pressable>
        </View>

        {/* AI disclaimer */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            ⚠️  AI identifications are for guidance only. Always verify with local experts,
            especially for land management, stock, or safety decisions.
          </Text>
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  homeButton: {
    width: 80,
  },
  homeButtonText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600',
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Hero card
  heroCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    gap: 10,
  },
  heroCardSpinifex: {
    backgroundColor: Colors.accentPale,
    borderColor: Colors.accent,
  },
  heroCardNonSpinifex: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.error,
  },
  verdictRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verdictIcon: {
    fontSize: 20,
  },
  verdictLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  verdictLabelSpinifex: {
    color: Colors.accent,
  },
  verdictLabelNonSpinifex: {
    color: Colors.error,
  },
  speciesName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 30,
  },
  alternativeBox: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
  },
  alternativeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  alternativeText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  confidenceRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    gap: 6,
  },
  badgeIcon: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '700',
  },
  badgeText: {
    fontSize: 13,
    color: Colors.white,
    fontWeight: '600',
  },

  // Image
  imageWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.border,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  imageLabelBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: Colors.overlay,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  imageLabelText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },

  // Section cards
  sectionCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  featureBullet: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.primary,
    marginTop: 6,
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  bodyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  // Actions
  actionsGroup: {
    gap: 10,
    marginTop: 4,
  },
  tryAnotherButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 17,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  tryAnotherButtonPressed: {
    backgroundColor: Colors.primaryDark,
    transform: [{ scale: 0.98 }],
  },
  tryAnotherText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  tryAnotherIcon: {
    fontSize: 18,
  },
  homeActionButton: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  homeActionButtonPressed: {
    backgroundColor: Colors.inputBackground,
    transform: [{ scale: 0.98 }],
  },
  homeActionText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },

  // Disclaimer
  disclaimerBox: {
    backgroundColor: Colors.warningLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disclaimerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
