import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { strings } from '@/constants/strings.es';
import { submitProductContribution } from '@/services/communityStore';
import { extractPackagingText } from '@/services/vision/ocr';
import * as ImageManipulator from 'expo-image-manipulator';
import type { ContributionSource } from '@/types/community';
import { colors, radii, spacing, typography } from '@/theme';

export default function ContribuirScreen() {
  const params = useLocalSearchParams<{
    source?: string;
    barcode?: string;
    ocrHint?: string;
  }>();
  const source = (params.source as ContributionSource) || 'missing_product';
  const isHelp = source === 'failed_visual';

  const [photos, setPhotos] = useState<string[]>([]);
  const [barcode, setBarcode] = useState(params.barcode ? String(params.barcode) : '');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<'food' | 'beauty' | 'unknown'>('unknown');
  const [ocrText, setOcrText] = useState(params.ocrHint ? String(params.ocrHint) : '');
  const [ocrConfirmed, setOcrConfirmed] = useState(false);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const pickPhoto = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(strings.scan.permissionTitle, strings.scan.permissionBody);
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ['images'] });
    if (result.canceled || !result.assets[0]?.uri) return;
    const uri = result.assets[0].uri;
    setPhotos((p) => [...p, uri].slice(0, 4));

    // Best-effort OCR fill when empty and provider available.
    if (!ocrText.trim()) {
      try {
        const encoded = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 768 } }], {
          base64: true,
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        });
        if (encoded.base64) {
          const ocr = await extractPackagingText({ base64: encoded.base64, mimeType: 'image/jpeg' });
          if (ocr.fullText) setOcrText(ocr.fullText);
        }
      } catch {
        // OCR optional
      }
    }
  };

  const save = async (asDraft: boolean) => {
    if (!asDraft) {
      if (photos.length === 0) {
        Alert.alert(strings.common.error, strings.community.photos);
        return;
      }
      if (!ocrConfirmed) {
        Alert.alert(strings.common.error, strings.community.ocrConfirm);
        return;
      }
    }
    setBusy(true);
    try {
      const result = await submitProductContribution({
        barcode: barcode.trim() || undefined,
        name: name.trim() || undefined,
        brand: brand.trim() || undefined,
        category,
        ocrText: ocrText.trim() || undefined,
        ocrConfirmed,
        photoUris: photos,
        notes: notes.trim() || undefined,
        source,
        asDraft,
      });
      if (!result.ok) {
        Alert.alert(strings.common.error, result.reason);
        return;
      }
      const msg = [
        asDraft ? strings.community.draftSaved : strings.community.submitted,
        result.localOnly ? strings.community.localQueue : null,
        `${strings.community.status}: ${strings.community.statuses[result.status]}`,
      ]
        .filter(Boolean)
        .join('\n');
      Alert.alert(strings.appName, msg, [
        { text: strings.common.ok, onPress: () => router.back() },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: isHelp ? strings.community.helpTitle : strings.community.contributeTitle,
          headerStyle: { backgroundColor: colors.cream },
          headerTintColor: colors.primary,
        }}
      />
      <Screen scroll>
        <Text style={styles.sub}>
          {isHelp ? strings.community.helpSubtitle : strings.community.contributeSubtitle}
        </Text>

        <Text style={styles.label}>{strings.community.photos}</Text>
        <View style={styles.row}>
          <Button label={strings.community.takePhoto} variant="secondary" onPress={() => void pickPhoto(true)} />
          <Button label={strings.community.addPhoto} variant="ghost" onPress={() => void pickPhoto(false)} />
        </View>
        <View style={styles.photos}>
          {photos.map((uri) => (
            <Image key={uri} source={{ uri }} style={styles.thumb} />
          ))}
        </View>

        <Text style={styles.label}>{strings.community.barcode}</Text>
        <TextInput value={barcode} onChangeText={setBarcode} style={styles.input} keyboardType="number-pad" />

        <Text style={styles.label}>{strings.community.name}</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} />

        <Text style={styles.label}>{strings.community.brand}</Text>
        <TextInput value={brand} onChangeText={setBrand} style={styles.input} />

        <Text style={styles.label}>{strings.community.category}</Text>
        <View style={styles.row}>
          {(
            [
              ['food', strings.community.categoryFood],
              ['beauty', strings.community.categoryBeauty],
              ['unknown', strings.community.categoryUnknown],
            ] as const
          ).map(([id, label]) => (
            <Pressable
              key={id}
              onPress={() => setCategory(id)}
              style={[styles.chip, category === id && styles.chipOn]}>
              <Text style={[styles.chipText, category === id && styles.chipTextOn]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>{strings.community.ocrLabel}</Text>
        <TextInput
          value={ocrText}
          onChangeText={setOcrText}
          style={[styles.input, styles.multiline]}
          multiline
        />
        <Pressable onPress={() => setOcrConfirmed((v) => !v)} style={styles.checkRow}>
          <Text style={styles.checkMark}>{ocrConfirmed ? '✓' : '○'}</Text>
          <Text style={styles.checkText}>{strings.community.ocrConfirm}</Text>
        </Pressable>

        <Text style={styles.label}>{strings.community.notes}</Text>
        <TextInput value={notes} onChangeText={setNotes} style={[styles.input, styles.multiline]} multiline />

        <Button
          label={strings.community.saveDraft}
          variant="ghost"
          loading={busy}
          onPress={() => void save(true)}
          style={{ marginTop: spacing.md }}
        />
        <Button
          label={strings.community.submit}
          variant="primary"
          loading={busy}
          onPress={() => void save(false)}
          style={{ marginTop: spacing.sm }}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  sub: { ...typography.body, color: colors.muted, marginBottom: spacing.md },
  label: { ...typography.label, color: colors.secondary, marginTop: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    ...typography.body,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  thumb: { width: 72, height: 72, borderRadius: radii.sm, backgroundColor: colors.surface },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.ink },
  chipTextOn: { color: colors.white },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  checkMark: { ...typography.subtitle, color: colors.primary },
  checkText: { ...typography.body, color: colors.ink, flex: 1 },
});
