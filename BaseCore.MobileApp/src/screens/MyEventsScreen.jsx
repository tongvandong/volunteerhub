import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventApi } from '../api/client';
import { colors, radius, spacing } from '../theme';
import { formatDate, regStatusLabel } from '../utils/format';
import { eventImageSource, eventFallback } from '../utils/eventImage';

function Thumb({ event }) {
  const img = eventImageSource(event);
  const fb = eventFallback(event);
  if (img) return <Image source={img} style={th.thumb} />;
  return (
    <View style={[th.thumb, { backgroundColor: fb.bg, justifyContent: 'center', alignItems: 'center' }]}>
      <Ionicons name={fb.icon} size={20} color={fb.fg} style={{ opacity: 0.6 }} />
    </View>
  );
}
const th = StyleSheet.create({ thumb: { width: 52, height: 52, borderRadius: 12 } });

const STATUS_TINT = {
  Approved: colors.success, Completed: colors.primary, Pending: colors.accent,
  Rejected: colors.danger, Cancelled: colors.ink3,
};

export default function MyEvents() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await eventApi.getMine();
      setItems(Array.isArray(data) ? data : (data?.items || []));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top + spacing.md }}>
      <View style={s.header}>
        <Text style={s.title}>Sự kiện của tôi</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push('/events/new')} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={s.addText}>Tạo</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(e) => String(e.id)}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.primary} />}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
          ListEmptyComponent={<Text style={s.empty}>Bạn chưa tạo sự kiện nào.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} activeOpacity={0.85} onPress={() => router.push(`/events/manage/${item.id}`)}>
              <Thumb event={item} />
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={s.meta}>{formatDate(item.startDate)} · {item.currentParticipants ?? 0}/{item.maxParticipants ?? '∞'} người</Text>
              </View>
              <View style={[s.badge, { backgroundColor: (STATUS_TINT[item.status] || colors.ink3) + '22' }]}>
                <Text style={[s.badgeText, { color: STATUS_TINT[item.status] || colors.ink3 }]}>{regStatusLabel(item.status)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.ink3} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  title: { fontSize: 24, fontWeight: '700', color: colors.ink },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  addText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md, marginBottom: spacing.sm },
  cardTitle: { fontSize: 14.5, fontWeight: '600', color: colors.ink },
  meta: { fontSize: 12.5, color: colors.ink2, marginTop: 2 },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11.5, fontWeight: '600' },
  empty: { textAlign: 'center', color: colors.ink2, marginTop: spacing.xl },
});
