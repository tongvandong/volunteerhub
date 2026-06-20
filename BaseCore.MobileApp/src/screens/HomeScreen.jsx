import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { recommendationApi } from '../api/client';
import { colors, radius, spacing } from '../theme';

function firstName(name) {
  if (!name) return 'bạn';
  const p = String(name).trim().split(/\s+/);
  return p[p.length - 1];
}

function reason(g) {
  const parts = [];
  if (g.skillMatch > 0) parts.push(`${g.skillMatch} kỹ năng phù hợp`);
  if (g.fieldMatch > 0) parts.push('cùng lĩnh vực bạn từng tham gia');
  return parts.length ? `Vì ${parts.join(' · ')}` : 'Gợi ý theo hoạt động của bạn';
}

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await recommendationApi.eventsForMe(6);
      setRecs(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setRecs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <ScrollView
      style={{ backgroundColor: colors.canvas }}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: insets.top + spacing.md, paddingBottom: spacing.xl }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
    >
      <Text style={s.kicker}>XIN CHÀO</Text>
      <Text style={s.greeting}>Chào {firstName(user?.name)} 👋</Text>

      <Text style={s.section}>Gợi ý cho bạn</Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : recs.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>Chưa có gợi ý phù hợp. Kéo xuống để làm mới.</Text>
        </View>
      ) : (
        recs.map((g) => (
          <TouchableOpacity key={g.eventId} style={s.card} activeOpacity={0.85} onPress={() => router.push(`/events/${g.eventId}`)}>
            <View style={s.iconWrap}>
              <Ionicons name="sparkles" size={16} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle} numberOfLines={1}>{g.title}</Text>
              <Text style={s.cardReason}>{reason(g)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.ink3} />
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  kicker: { fontSize: 12, fontWeight: '700', color: colors.accent, letterSpacing: 1 },
  greeting: { fontSize: 26, fontWeight: '700', color: colors.ink, marginTop: 4, marginBottom: spacing.lg },
  section: { fontSize: 13, fontWeight: '700', color: colors.ink2, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.card, padding: spacing.md, marginBottom: spacing.sm,
  },
  iconWrap: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.accent50, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 14.5, fontWeight: '600', color: colors.ink },
  cardReason: { fontSize: 12, color: colors.ink2, marginTop: 2 },
  empty: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.lg },
  emptyText: { color: colors.ink2, fontSize: 13, textAlign: 'center' },
});
