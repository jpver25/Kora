import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScanFrame } from '@/components/scanner/ScanFrame';
import { ScanModeSwitcher } from '@/components/scanner/ScanModeSwitcher';
import { Button } from '@/components/ui/Button';
import { strings } from '@/constants/strings.es';
import { lookupProductByBarcode } from '@/services/productLookup';
import { addHistoryFromProduct } from '@/services/history';
import { identifyPackagingFromImage } from '@/services/visualRecognition';
import { getActiveVisionProvider } from '@/services/vision/ocr';
import type { ScanMode } from '@/types/product';
import { colors, radii, spacing, typography } from '@/theme';

export default function EscanearScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<ScanMode>('auto');
  const [torch, setTorch] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const lockRef = useRef(false);
  const cameraRef = useRef<CameraView>(null);
  const visionProvider = getActiveVisionProvider();

  const handleBarcode = useCallback(
    async (payload: BarcodeScanningResult) => {
      if (mode === 'visual') return;
      const raw = payload.data?.trim();
      if (!raw || lockRef.current || busy) return;
      lockRef.current = true;
      setBusy(true);
      setStatusText(strings.scan.lookingUp);
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const product = await lookupProductByBarcode(raw);
        if (!product) {
          Alert.alert(strings.product.notFoundTitle, strings.product.notFoundBody, [
            {
              text: strings.common.ok,
              onPress: () => {
                lockRef.current = false;
              },
            },
          ]);
          return;
        }
        await addHistoryFromProduct(product, 'barcode');
        router.push(`/product/${product.barcode}`);
      } catch {
        Alert.alert(strings.common.error, strings.common.tryAgain);
      } finally {
        setBusy(false);
        setStatusText(null);
        setTimeout(() => {
          lockRef.current = false;
        }, 1500);
      }
    },
    [busy, mode],
  );

  const submitManual = async () => {
    const code = manualCode.replace(/\D/g, '');
    if (code.length < 6) return;
    setManualOpen(false);
    setBusy(true);
    setStatusText(strings.scan.lookingUp);
    try {
      const product = await lookupProductByBarcode(code);
      if (!product) {
        Alert.alert(strings.product.notFoundTitle, strings.product.notFoundBody);
        return;
      }
      await addHistoryFromProduct(product, 'manual');
      router.push(`/product/${product.barcode}`);
    } catch {
      Alert.alert(strings.common.error, strings.common.tryAgain);
    } finally {
      setBusy(false);
      setStatusText(null);
      setManualCode('');
    }
  };

  const runVisualCapture = async () => {
    if (busy || lockRef.current) return;
    try {
      lockRef.current = true;
      setBusy(true);
      setStatusText(strings.scan.analyzingVisual);
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.7,
        skipProcessing: false,
      });
      if (!photo?.uri) {
        Alert.alert(strings.common.error, strings.scan.visual.missingImage);
        return;
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await identifyPackagingFromImage({ imageUri: photo.uri });

      if (result.tier === 'auto_open' && result.candidates[0]?.product) {
        const product = result.candidates[0].product;
        await addHistoryFromProduct(product, 'visual');
        router.push(`/product/${product.barcode}`);
        return;
      }

      if (result.tier === 'auto_open' && result.candidates[0]?.barcode) {
        const product = await lookupProductByBarcode(result.candidates[0].barcode);
        if (product) {
          await addHistoryFromProduct(product, 'visual');
          router.push(`/product/${product.barcode}`);
          return;
        }
      }

      if (
        (result.tier === 'candidates' || result.tier === 'low_confidence') &&
        result.candidates.length > 0
      ) {
        router.push({
          pathname: '/visual-candidates',
          params: {
            message: result.message,
            payload: JSON.stringify(
              result.candidates.map((c) => ({
                barcode: c.barcode,
                name: c.name,
                brand: c.brand,
                imageUrl: c.imageUrl,
                score: c.score,
              })),
            ),
          },
        });
        return;
      }

      Alert.alert(strings.scan.visualSoon, result.message);
    } catch (err) {
      Alert.alert(
        strings.common.error,
        err instanceof Error ? err.message : strings.common.tryAgain,
      );
    } finally {
      setBusy(false);
      setStatusText(null);
      setTimeout(() => {
        lockRef.current = false;
      }, 800);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permission}>
        <Text style={styles.permTitle}>{strings.scan.permissionTitle}</Text>
        <Text style={styles.permBody}>{strings.scan.permissionBody}</Text>
        <Button label={strings.scan.permissionCta} onPress={requestPermission} />
        <Button
          label={strings.scan.manual}
          variant="ghost"
          onPress={() => setManualOpen(true)}
          style={{ marginTop: spacing.md }}
        />
        <ManualModal
          open={manualOpen}
          value={manualCode}
          onChange={setManualCode}
          onClose={() => setManualOpen(false)}
          onSubmit={() => void submitManual()}
        />
      </SafeAreaView>
    );
  }

  const hint =
    mode === 'barcode'
      ? strings.scan.hintBarcode
      : mode === 'visual'
        ? strings.scan.hintVisual
        : strings.scan.hintAuto;

  const showVisualCapture = mode === 'visual' || mode === 'auto';

  return (
    <View style={styles.root}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
        }}
        onBarcodeScanned={mode === 'visual' || busy ? undefined : handleBarcode}
      />

      <View style={styles.shade} />

      <SafeAreaView style={styles.ui} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>{strings.scan.title}</Text>
          <ScanModeSwitcher mode={mode} onChange={setMode} />
          <Text style={styles.provider}>
            {visionProvider === 'none'
              ? strings.scan.visual.providerNone
              : `${strings.scan.visual.providerReady} (${visionProvider})`}
          </Text>
        </View>

        <View style={styles.frameArea}>
          <ScanFrame />
          <Text style={styles.hint}>{hint}</Text>
          {busy ? (
            <View style={styles.busy}>
              <ActivityIndicator color={colors.lime} />
              <Text style={styles.busyText}>{statusText ?? strings.scan.lookingUp}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.footerBtn} onPress={() => setTorch((t) => !t)}>
            <Text style={styles.footerBtnText}>{strings.scan.torch}</Text>
          </Pressable>
          {showVisualCapture ? (
            <Pressable
              style={[styles.footerBtn, styles.captureBtn]}
              onPress={() => void runVisualCapture()}
              disabled={busy}>
              <Text style={[styles.footerBtnText, styles.captureText]}>{strings.scan.capture}</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.footerBtn} onPress={() => setManualOpen(true)}>
            <Text style={styles.footerBtnText}>{strings.scan.manual}</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <ManualModal
        open={manualOpen}
        value={manualCode}
        onChange={setManualCode}
        onClose={() => setManualOpen(false)}
        onSubmit={() => void submitManual()}
      />
    </View>
  );
}

function ManualModal({
  open,
  value,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{strings.scan.manual}</Text>
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder={strings.scan.manualPlaceholder}
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            style={styles.input}
            autoFocus
          />
          <Button label={strings.scan.manualSubmit} onPress={onSubmit} />
          <Button
            label={strings.common.cancel}
            variant="ghost"
            onPress={onClose}
            style={{ marginTop: 8 }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  permission: {
    flex: 1,
    backgroundColor: colors.cream,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: spacing.md,
  },
  permTitle: { ...typography.title, color: colors.primary },
  permBody: { ...typography.body, color: colors.muted, marginBottom: spacing.md },
  shade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  ui: { flex: 1, justifyContent: 'space-between' },
  header: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  title: { ...typography.title, color: colors.white },
  provider: { ...typography.caption, color: colors.lime },
  frameArea: { alignItems: 'center', gap: spacing.md },
  hint: {
    ...typography.body,
    color: colors.white,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  busy: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  busyText: { ...typography.bodyStrong, color: colors.lime },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  footerBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  captureBtn: { backgroundColor: colors.lime },
  footerBtnText: { ...typography.bodyStrong, color: colors.white },
  captureText: { color: colors.ink },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: { ...typography.subtitle, color: colors.ink },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.ink,
    backgroundColor: colors.white,
  },
});
