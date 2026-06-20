import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supportCampaignApi } from '../api/client';
import { colors, radius, spacing } from '../theme';
import { formatDate } from '../utils/format';

const STATUS = { Confirmed: ['Đã xác nhận', colors.success], PendingConfirmation: ['Chờ xác nhận', colors.accent], Rejected: ['Bị từ chối', colors.danger], Cancelled: ['Đã huỷ', colors.ink3] };
const money = (n) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';

export default function MyDonations() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supportCampaignApi.getMyDonations()
      .then((r) => setItems(Array.isArray(r.data) ? r.data : (r.data?.items || [])))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const total = items.filter((x) => x.status === 'Confirmed').reduce((sum, x) => sum + (Number(x.amount) || 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={[s.topbar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={24} color={colors.ink} /></TouchableOpacity>
        <Text style={s.topTitle}>Quyên góp của tôi</Text>
      </View>
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} /> : (
        <FlatList
          data={items}
          keyExtractor={(x, i) => String(x.id ?? i)}
          contentContainerStyle={{ padding: spacing.lg }}
          ListHeaderComponent={items.length > 0 ? (
            <View style={s.summary}>
              <Text style={s.summaryNum}>{money(total)}</Text>
              <Text style={s.summaryLabel}>Tổng đã ủng hộ (đã xác nhận)</Text>
            </View>
          ) : null}
          ListEmptyComponent={<Text style={s.empty}>Bạn chưa quyên góp lần nào.</Text>}
          renderItem={({ item }) => {
            const [label, tint] = STATUS[item.status] || [item.status, colors.ink3];
            return (
              <View style={s.card}>
                <View style={{ flex: 1 }}>
                  <Text style={s.name} numberOfLines={1}>{item.campaignTitle || item.campaign?.title || `Chiến dịch #${item.campaignId}`}</Text>
                  <Text style={s.sub}>{money(item.amount)} · {formatDate(item.createdAt)}{item.isAnonymous ? ' · Ẩn danh' : ''}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: tint + '22' }]}><Text style={[s.badgeText, { color: tint }]}>{label}</Text></View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, paddingBottom: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  topTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  summary: { backgroundColor: colors.accent50, borderRadius: radius.card, padding: spacing.md, marginBottom: spacing.md },
  summaryNum: { fontSize: 22, fontWeight: '700', color: colors.accent },
  summaryLabel: { fontSize: 12.5, color: colors.ink2, marginTop: 2 },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md, marginBottom: spacing.sm },
  name: { fontSize: 14.5, fontWeight: '600', color: colors.ink },
  sub: { fontSize: 12.5, color: colors.ink2, marginTop: 2 },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11.5, fontWeight: '600' },
  empty: { textAlign: 'center', color: colors.ink2, marginTop: spacing.xl },
});
