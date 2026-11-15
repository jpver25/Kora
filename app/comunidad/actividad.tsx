import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { EmptyState } from '@/components/ui/EmptyState';
import { strings } from '@/constants/strings.es';
import { listMyCommunityActivity } from '@/services/communityStore';
import type {
  BrandImprovementRequest,
  CosmeticReview,
  ProductContribution,
  ProductCorrection,
} from '@/types/community';
import { colors, radii, spacing, typography } from '@/theme';

export default function ActividadScreen() {
  const [contributions, setContributions] = useState<ProductContribution[]>([]);
  const [corrections, setCorrections] = useState<ProductCorrection[]>([]);
  const [reviews, setReviews] = useState<CosmeticReview[]>([]);
  const [brandRequests, setBrandRequests] = useState<BrandImprovementRequest[]>([]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      listMyCommunityActivity().then((data) => {
        if (!alive) return;
        setContributions(data.contributions);
        setCorrections(data.corrections);
        setReviews(data.reviews);
        setBrandRequests(data.brandRequests);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  const empty =
    contributions.length + corrections.length + reviews.length + brandRequests.length === 0;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: strings.community.myActivity,
          headerStyle: { backgroundColor: colors.cream },
          headerTintColor: colors.primary,
        }}
      />
      <Screen scroll>
        {empty ? <EmptyState title={strings.community.emptyActivity} /> : null}

        {contributions.map((c) => (
          <Card
            key={c.id}
            title={c.name || c.barcode || strings.community.contributeTitle}
            status={c.status}
            meta={`${c.source}${c.localOnly ? ' · local' : ''}`}
          />
        ))}
        {corrections.map((c) => (
          <Card
            key={c.id}
            title={`${strings.community.correctionTitle}: ${c.field}`}
            status={c.status}
            meta={c.barcode}
          />
        ))}
        {reviews.map((r) => (
          <Card
            key={r.id}
            title={`${r.stars}★ ${r.body.slice(0, 48)}`}
            status={r.status}
            meta={r.barcode}
          />
        ))}
        {brandRequests.map((b) => (
          <Card
            key={b.id}
            title={`${strings.community.brandTitle}: ${b.brand}`}
            status={b.status}
            meta={b.message.slice(0, 60)}
          />
        ))}
      </Screen>
    </>
  );
}

function Card({
  title,
  status,
  meta,
}: {
  title: string;
  status: keyof typeof strings.community.statuses;
  meta: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.status}>
        {strings.community.status}: {strings.community.statuses[status]}
      </Text>
      <Text style={styles.meta}>{meta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: 4,
  },
  title: { ...typography.bodyStrong, color: colors.ink },
  status: { ...typography.caption, color: colors.secondary },
  meta: { ...typography.caption, color: colors.muted },
});
