import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../api/client';
import { colors, radius, spacing } from '../../theme';
import { formatDate } from '../../utils/format';

const money = (n) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';

export default function AdminFinance() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [overview, setOverview] = useState(null);
  const [stale, setStale] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      adminApi.getFinanceOverview(),
      adminApi.getStaleDonations(),
    ]).then(([o, st]) => {
      if (o.status === 'fulfilled') setOverview(o.value.data || {});
      if (st.status === 'fulfilled') {
        const d = st.value.data;
        setStale(Array.isArray(d) ? d : (d?.items || []));
      }
    }).finally(() => setLoading(false));
  }, []);

  const ov = overview || {};
  const stats = [
    { label: 'Tổng quyên góp đã xác nhận', num: money(ov.totalConfirmedDonations ?? ov.totalDonations) },
    { label: 'Chờ xác nhận', num: ov.pendingDonations ?? ov.pendingCount ?? '—' },
    { label: 'Chiến dịch đang chạy', num: ov.activeCampaigns ?? '—' },
    { label: 'Tài trợ doanh nghiệp', num: money(ov.totalSponsorships ?? ov.totalSponsorAmount) },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={[s.topbar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={24} color={colors.ink} /></TouchableOpacity>
        <Text style={s.topTitle}>Giám sát tài chính</Text>
      </View>
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} /> : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}>
          <View style={s.grid}>
            {stats.map((st, i) => (
              <View key={i} style={s.stat}>
                <Text style={s.statNum}>{st.num}</Text>
                <Text style={s.statLabel}>{st.label}</Text>
              </View>
            ))}
          </View>

          <Text style={s.section}>Quyên góp quá hạn xác nhận</Text>
          {stale.length === 0 ? <Text style={s.empty}>Không có khoản nào quá hạn 🎉</Text> :
            stale.map((d, i) => (
              <View key={d.id ?? i} style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{d.displayName || d.userName || (d.isAnonymous ? 'Ẩn danh' : `User #${d.userId}`)}</Text>
                  <Text style={s.sub}>{money(d.amount)} · {formatDate(d.createdAt)} · {d.campaignTitle || `Chiến dịch #${d.campaignId}`}</Text>
                </View>
              </View>
            ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, paddingBottom: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  topTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  stat: { width: '47%', flexGrow: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md },
  statNum: { fontSize: 16, fontWeight: '700', color: colors.ink },
  statLabel: { fontSize: 11.5, color: colors.ink2, marginTop: 4 },
  section: { fontSize: 13, fontWeight: '700', color: colors.ink2, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  row: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md, marginBottom: spacing.sm },
  name: { fontSize: 14, fontWeight: '600', color: colors.ink },
  sub: { fontSize: 12.5, color: colors.ink2, marginTop: 2 },
  empty: { color: colors.ink2, fontSize: 13.5 },
});
