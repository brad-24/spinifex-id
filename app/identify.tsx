import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';
import { identifyPlant } from '../services/plantIdentification';
import { setAnalysisResult } from '../store/resultStore';

type PickerSource = 'camera' | 'library';

const REGIONS = [
  'Pilbara',
  'Kimberley',
  'Goldfields',
  'Central Australia',
  'Simpson Desert',
  'Gulf Country',
  'Cape York',
  'Other',
] as const;

export default function IdentifyScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  async function pickImage(source: PickerSource) {
    try {
      let result: ImagePicker.ImagePickerResult;

      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Camera Permission Required',
            'Please allow camera access in your device settings to take photos.',
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.85,
          base64: true,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Photo Library Permission Required',
            'Please allow photo library access in your device settings to select photos.',
          );
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.85,
          base64: true,
        });
      }

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        setImageBase64(asset.base64 ?? null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to access camera or photo library. Please try again.');
    }
  }

  async function analyseImage() {
    if (!imageUri || !imageBase64) {
      Alert.alert('No Image', 'Please select or take a photo first.');
      return;
    }

    setLoading(true);
    try {
      const result = await identifyPlant(imageBase64, imageUri, location.trim() || undefined);
      setAnalysisResult(result, imageUri);
      router.push('/results');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred.';
      Alert.alert('Identification Failed', message, [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  }

  function clearImage() {
    setImageUri(null);
    setImageBase64(null);
  }

  function toggleRegion(region: string) {
    setLocation(prev => (prev === region ? '' : region));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Picker buttons */}
        {!imageUri && !loading && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose a Photo</Text>
            <Text style={styles.sectionDescription}>
              Take a photo of a plant or choose one from your library for identification.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.sourceButton,
                styles.sourceButtonPrimary,
                pressed && styles.sourceButtonPressed,
              ]}
              onPress={() => pickImage('camera')}
              accessibilityRole="button"
              accessibilityLabel="Take a photo with camera"
            >
              <Text style={styles.sourceButtonIcon}>📷</Text>
              <View style={styles.sourceButtonTextGroup}>
                <Text style={styles.sourceButtonLabel}>Take a Photo</Text>
                <Text style={styles.sourceButtonHint}>Use your camera</Text>
              </View>
              <Text style={styles.sourceButtonChevron}>›</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.sourceButton,
                styles.sourceButtonSecondary,
                pressed && styles.sourceButtonPressed,
              ]}
              onPress={() => pickImage('library')}
              accessibilityRole="button"
              accessibilityLabel="Choose photo from library"
            >
              <Text style={styles.sourceButtonIcon}>🖼️</Text>
              <View style={styles.sourceButtonTextGroup}>
                <Text style={styles.sourceButtonLabel}>Choose from Library</Text>
                <Text style={styles.sourceButtonHint}>Select an existing photo</Text>
              </View>
              <Text style={styles.sourceButtonChevron}>›</Text>
            </Pressable>
          </View>
        )}

        {/* Image preview */}
        {imageUri && !loading && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photo Preview</Text>
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
            </View>
            <Pressable
              style={({ pressed }) => [styles.changePhotoButton, pressed && styles.changePhotoButtonPressed]}
              onPress={clearImage}
            >
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </Pressable>
          </View>
        )}

        {/* Location input — always shown when not loading */}
        {!loading && (
          <View style={styles.locationSection}>
            <View style={styles.locationHeader}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.optionalTag}>Optional</Text>
            </View>
            <Text style={styles.locationHelper}>
              Adding your location improves species accuracy across Australia's 60+ spinifex species
            </Text>
            <TextInput
              style={styles.locationInput}
              placeholder='e.g. "Pilbara WA", "Simpson Desert"'
              placeholderTextColor={Colors.textMuted}
              value={location}
              onChangeText={setLocation}
              returnKeyType="done"
              accessibilityLabel="Enter your location"
            />
            <Text style={styles.quickSelectLabel}>Quick select a region:</Text>
            <View style={styles.chipsGrid}>
              {REGIONS.map(region => {
                const selected = location === region;
                return (
                  <Pressable
                    key={region}
                    style={({ pressed }) => [
                      styles.chip,
                      selected && styles.chipSelected,
                      pressed && styles.chipPressed,
                    ]}
                    onPress={() => toggleRegion(region)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select region: ${region}`}
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {region}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Analyse button */}
        {imageUri && !loading && (
          <Pressable
            style={({ pressed }) => [styles.analyseButton, pressed && styles.analyseButtonPressed]}
            onPress={analyseImage}
            accessibilityRole="button"
            accessibilityLabel="Analyse plant"
          >
            <Text style={styles.analyseButtonText}>Analyse Plant</Text>
            <Text style={styles.analyseButtonIcon}>🔍</Text>
          </Pressable>
        )}

        {/* Loading state */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingTitle}>Analysing Plant…</Text>
            <Text style={styles.loadingDescription}>
              The AI is examining your photo and identifying the plant. This usually takes 5–15 seconds.
            </Text>
            <View style={styles.loadingSteps}>
              <Text style={styles.loadingStep}>🔍  Examining visual features</Text>
              <Text style={styles.loadingStep}>🌿  Matching against spinifex species</Text>
              <Text style={styles.loadingStep}>📍  Applying location context</Text>
            </View>
          </View>
        )}

        {/* Tips */}
        {!imageUri && !loading && (
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>Tips for Best Results</Text>
            <Text style={styles.tipItem}>• Photograph the whole plant or a clear section</Text>
            <Text style={styles.tipItem}>• Include leaves, stems, and any seed heads if visible</Text>
            <Text style={styles.tipItem}>• Use good natural lighting where possible</Text>
            <Text style={styles.tipItem}>• Avoid excessive blurring or motion blur</Text>
            <Text style={styles.tipItem}>• Get close enough to show leaf detail</Text>
          </View>
        )}
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
    paddingTop: 24,
    paddingBottom: 40,
    gap: 20,
  },
  section: {
    gap: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1.5,
    gap: 14,
  },
  sourceButtonPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  sourceButtonSecondary: {
    backgroundColor: Colors.cardBackground,
    borderColor: Colors.border,
  },
  sourceButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  sourceButtonIcon: {
    fontSize: 28,
  },
  sourceButtonTextGroup: {
    flex: 1,
  },
  sourceButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  sourceButtonHint: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  sourceButtonChevron: {
    fontSize: 24,
    color: Colors.textMuted,
    fontWeight: '300',
  },
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBackground,
  },
  previewImage: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  changePhotoButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changePhotoButtonPressed: {
    opacity: 0.6,
  },
  changePhotoText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // Location section
  locationSection: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionalTag: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    backgroundColor: Colors.inputBackground,
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  locationHelper: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginTop: -4,
  },
  locationInput: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  quickSelectLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBackground,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  chipPressed: {
    opacity: 0.8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.white,
  },

  analyseButton: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  analyseButtonPressed: {
    backgroundColor: Colors.accentLight,
    transform: [{ scale: 0.98 }],
  },
  analyseButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  analyseButtonIcon: {
    fontSize: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
    gap: 16,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  loadingDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingSteps: {
    alignSelf: 'stretch',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    marginTop: 8,
  },
  loadingStep: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  tipsCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  tipItem: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
