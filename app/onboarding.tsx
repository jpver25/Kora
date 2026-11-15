import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { strings } from '@/constants/strings.es';
import { setOnboardingCompleted } from '@/services/onboarding';
import { colors, radii, spacing, typography } from '@/theme';

const { width } = Dimensions.get('window');

const SLIDE_IMAGES = [
  require('@/assets/images/brand/onboarding-analisis.png'),
  require('@/assets/images/brand/onboarding-barcode-label.png'),
  require('@/assets/images/brand/alt-choco.png'),
] as const;

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const slides = strings.onboarding.slides;

  const finish = async () => {
    await setOnboardingCompleted(true);
    router.replace('/(tabs)');
  };

  const next = () => {
    if (index >= slides.length - 1) {
      void finish();
      return;
    }
    const nextIndex = index + 1;
    listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    setIndex(nextIndex);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>{strings.appName}</Text>
        <Text style={styles.skip} onPress={() => void finish()}>
          {strings.onboarding.skip}
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item, index: i }) => (
          <View style={[styles.slide, { width }]}>
            <Animated.View entering={FadeInDown.duration(500)} style={styles.artWrap}>
              <Image source={SLIDE_IMAGES[i]} style={styles.art} resizeMode="contain" />
            </Animated.View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Image
          source={require('@/assets/images/brand/mascot-plain.png')}
          style={styles.mascot}
          resizeMode="contain"
        />
        <Button
          label={index === slides.length - 1 ? strings.onboarding.start : strings.onboarding.next}
          onPress={next}
          variant="lime"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  brand: { ...typography.title, color: colors.primary, fontSize: 24 },
  skip: { ...typography.bodyStrong, color: colors.secondary },
  slide: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  artWrap: {
    width: '100%',
    height: 320,
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  art: { width: '100%', height: '100%' },
  title: { ...typography.title, color: colors.primary, textAlign: 'center' },
  body: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 340,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: { width: 22, backgroundColor: colors.primary },
  mascot: { width: 72, height: 72, alignSelf: 'center' },
});
