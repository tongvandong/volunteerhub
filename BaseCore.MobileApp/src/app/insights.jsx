import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { dashboardApi } from '../api/client';
import { colors, radius, spacing } from '../theme';

export default function Insights() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getOrganizerInsights()
      .then((r) => setData(r.data || {}))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const d = data || {};
  const stats = [
    { icon: 'calendar', num: d.totalEvents ?? d.eventsCount ?? '—', label: 'Tổng sự kiện' },
    { icon: 'checkmark-done', num: d.completedEvents ?? '—', label: 'Đã hoàn thành' },
    { icon: 'people', num: d.totalVolunteers ?? d.totalParticipants ?? '—', label: 'Lượt tham gia' },
    { icon: 'time', num: d.totalHours != null ? `${d.totalHours}h` : '—', label: 'Tổng giờ công' },
    { icon: 'star', num: d.averageRating ?? d.avgRating ?? '—', label: 'Điểm đánh giá TB' },
    { icon: 'heart', num: d.totalDonations != null ? new Intl.NumberFormat('vi-VN').format(d.totalDonations) + 'đ' : '—', label: 'Quyên góp' },
  ];

  // phân bố sự kiện theo trạng thái (bar đơn giản, không cần thư viện chart)
  const byStatus = d.eventsByStatus || d.byStatus || null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={[s.topbar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={24} color={colors.ink} /></TouchableOpacity>
        <Text style={s.topTitle}>Thống kê hoạt động</Text>
      </View>

      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} /> : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}>
          <View style={s.grid}>
            {stats.map((st, i) => (
              <View key={i} style={s.stat}>
                <Ionicons name={st.icon} size={18} color={colors.primary} />
                <Text style={s.statNum}>{st.num}</Text>
                <Text style={s.statLabel}>{st.label}</Text>
              </View>
            ))}
          </View>

          {byStatus && typeof byStatus === 'object' && (
            <>
              <Text style={s.section}>Sự kiện theo trạng thái</Text>
              {Object.entries(byStatus).map(([k, v]) => {
                const max = Math.max(...Object.values(byStatus), 1);
                return (
                  <View key={k} style={s.barRow}>
                    <Text style={s.barLabel}>{k}</Text>
                    <View style={s.barTrack}>
                      <View style={[s.barFill, { width: `${(v / max) * 100}%` }]} />
                    </View>
                    <Text style={s.barNum}>{v}</Text>
                  </View>
                );
              })}
            </>
          )}

          {!byStatus && (
            <Text style={s.note}>Số liệu chi tiết hơn (biểu đồ theo tháng, top sự kiện…) xem trên bản web.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, paddingBottom: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  topTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stat: { width: '47%', flexGrow: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md },
  statNum: { fontSize: 20, fontWeight: '700', color: colors.ink, marginTop: 6 },
  statLabel: { fontSize: 12, color: colors.ink2, marginTop: 2 },
  section: { fontSize: 13, fontWeight: '700', color: colors.ink2, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.lg, marginBottom: spacing.sm },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  barLabel: { width: 90, fontSize: 12.5, color: colors.ink2 },
  barTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.surface2, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 5 },
  barNum: { width: 28, fontSize: 12.5, color: colors.ink, fontWeight: '600', textAlign: 'right' },
  note: { fontSize: 12.5, color: colors.ink3, marginTop: spacing.lg, textAlign: 'center' },
});
