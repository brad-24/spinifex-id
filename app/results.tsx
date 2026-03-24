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
import { Confidence, PlantAnalysisResult, SpeciesCandidate } from '../types/plant';

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
  return (
    <View style={[styles.badge, { backgroundColor: CONFIDENCE_COLORS[confidence] }]}>
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

function TopMatchCard({
  candidate,
  isSpinifex,
}: {
  candidate: SpeciesCandidate;
  isSpinifex: boolean;
}) {
  return (
    <View style={[styles.topMatchCard, isSpinifex ? styles.heroCardSpinifex : styles.heroCardNonSpinifex]}>
      <View style={styles.verdictRow}>
        <Text style={styles.verdictIcon}>{isSpinifex ? '🌿' : '❌'}</Text>
        <Text style={[styles.verdictLabel, isSpinifex ? styles.verdictLabelSpinifex : styles.verdictLabelNonSpinifex]}>
          {isSpinifex ? 'Spinifex Identified' : 'Not Spinifex'}
        </Text>
        <View style={styles.rankBadge}>
          <Text style={styles.rankBadgeText}>#1 Match</Text>
        </View>
      </View>

      <Text style={styles.speciesScientific}>{candidate.scientificName}</Text>
      <Text style={styles.speciesCommon}>{candidate.commonName}</Text>

      <View style={styles.confidenceRow}>
        <ConfidenceBadge confidence={candidate.confidence} />
      </View>

      {candidate.identifyingFeatures.length > 0 && (
        <View style={styles.featuresBlock}>
          <Text style={styles.featuresLabel}>Key features in this photo</Text>
          {candidate.identifyingFeatures.map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      )}

      {candidate.locationContext ? (
        <View style={styles.locationContextBlock}>
          <Text style={styles.locationContextIcon}>📍</Text>
          <Text style={styles.locationContextText}>{candidate.locationContext}</Text>
        </View>
      ) : null}

      {candidate.furtherPhotoSuggestion ? (
        <View style={styles.photoSuggestionBlock}>
          <Text style={styles.photoSuggestionIcon}>📸</Text>
          <Text style={styles.photoSuggestionText}>{candidate.furtherPhotoSuggestion}</Text>
        </View>
      ) : null}
    </View>
  );
}

function AlternativeCard({
  candidate,
  rank,
}: {
  candidate: SpeciesCandidate;
  rank: number;
}) {
  return (
    <View style={styles.alternativeCard}>
      <View style={styles.altCardHeader}>
        <View style={styles.altRankBadge}>
          <Text style={styles.altRankText}>#{rank}</Text>
        </View>
        <View style={styles.altNameGroup}>
          <Text style={styles.altScientific}>{candidate.scientificName}</Text>
          <Text style={styles.altCommon}>{candidate.commonName}</Text>
        </View>
        <ConfidenceBadge confidence={candidate.confidence} />
      </View>

      {candidate.identifyingFeatures.length > 0 && (
        <View style={styles.altFeaturesBlock}>
          {candidate.identifyingFeatures.map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.featureBullet, styles.featureBulletAlt]} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      )}

      {candidate.locationContext ? (
        <View style={styles.locationContextBlock}>
          <Text style={styles.locationContextIcon}>📍</Text>
          <Text style={styles.locationContextText}>{candidate.locationContext}</Text>
        </View>
      ) : null}

      {candidate.furtherPhotoSuggestion ? (
        <View style={styles.photoSuggestionBlock}>
          <Text style={styles.photoSuggestionIcon}>📸</Text>
          <Text style={styles.photoSuggestionText}>{candidate.furtherPhotoSuggestion}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function ResultsScreen() {
  const [result, setResult] = useState<PlantAnalysisResult | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const { result: r, imageUri: uri } = getAnalysisResult();
      if (!r) {
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

  const [topCandidate, ...otherCandidates] = result.candidates;

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

        {/* Top match hero card */}
        <TopMatchCard candidate={topCandidate} isSpinifex={result.isSpinifex} />

        {/* Image thumbnail */}
        {imageUri && (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: imageUri }} style={styles.thumbnail} resizeMode="cover" />
            <View style={styles.imageLabelBadge}>
              <Text style={styles.imageLabelText}>Analysed Photo</Text>
            </View>
          </View>
        )}

        {/* Alternative candidates */}
        {otherCandidates.length > 0 && (
          <SectionCard icon="🔄" title="Other Possible Species">
            {otherCandidates.map((candidate, i) => (
              <AlternativeCard key={i} candidate={candidate} rank={i + 2} />
            ))}
          </SectionCard>
        )}

        {/* Habitat */}
        {result.habitat ? (
          <SectionCard icon="🗺️" title="Habitat & Distribution">
            <Text style={styles.bodyText}>{result.habitat}</Text>
          </SectionCard>
        ) : null}

        {/* Land management */}
        {result.landManagementNotes ? (
          <SectionCard icon="🌾" title="Land Management Notes">
            <Text style={styles.bodyText}>{result.landManagementNotes}</Text>
          </SectionCard>
        ) : null}

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

        {/* Disclaimers */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerBotanist}>
            Species identification should be confirmed by a botanist for research or land management purposes.
          </Text>
          <View style={styles.disclaimerDivider} />
          <Text style={styles.disclaimerAI}>
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

  // Top match card
  topMatchCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    gap: 12,
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
    flex: 1,
  },
  verdictLabelSpinifex: {
    color: Colors.accent,
  },
  verdictLabelNonSpinifex: {
    color: Colors.error,
  },
  rankBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  speciesScientific: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 30,
    fontStyle: 'italic',
  },
  speciesCommon: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: -6,
  },
  confidenceRow: {
    flexDirection: 'row',
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
  featuresBlock: {
    gap: 8,
    marginTop: 2,
  },
  featuresLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
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
    backgroundColor: Colors.accent,
    marginTop: 6,
    flexShrink: 0,
  },
  featureBulletAlt: {
    backgroundColor: Colors.primary,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  locationContextBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 10,
    padding: 10,
  },
  locationContextIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  locationContextText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  photoSuggestionBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.warningLight,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoSuggestionIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  photoSuggestionText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    fontStyle: 'italic',
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
  bodyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  // Alternative candidate cards
  alternativeCard: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  altCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  altRankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  altRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  altNameGroup: {
    flex: 1,
    gap: 2,
  },
  altScientific: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontStyle: 'italic',
  },
  altCommon: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  altFeaturesBlock: {
    gap: 6,
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
    gap: 10,
  },
  disclaimerBotanist: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 19,
    fontWeight: '500',
  },
  disclaimerDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  disclaimerAI: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
