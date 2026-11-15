import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '@/theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  padded?: boolean;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
};

export function Screen({
  children,
  scroll,
  style,
  padded = true,
  edges = ['top', 'left', 'right'],
}: Props) {
  const content = (
    <View style={[padded && styles.pad, style, scroll ? undefined : styles.flex]}>{children}</View>
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#E8F0E4', colors.cream, '#F7F4EC']}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.flex} edges={edges}>
        {scroll ? (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  flex: { flex: 1 },
  pad: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  scroll: { paddingBottom: spacing.xxl, flexGrow: 1 },
});
