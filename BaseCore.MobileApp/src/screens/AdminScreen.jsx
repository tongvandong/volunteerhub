import { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { dashboardApi } from '../api/client';
import { colors, radius, spacing } from '../theme';

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await dashboardApi.get();
      setData(res.data || {});
    } catch {
      setData({});
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const inbox = data.inbox || data || {};
  const rows = [
    { key: 'pendingEvents', label: 'Sự kiện chờ duyệt', icon: 'calendar', href: '/admin/events' },
    { key: 'pendingOrganizerVerifications', label: 'Tổ chức chờ xác minh', icon: 'business', href: '/admin/organizers' },
    { key: 'pendingKyc', label: 'KYC chờ duyệt', icon: 'id-card', href: '/admin/kyc' },
    { key: 'pendingSkillVerifications', label: 'Kỹ năng chờ duyệt', icon: 'school', href: '/admin/skill-verifications' },
  ];
  const tools = [
    { label: 'Quản lý người dùng', icon: 'people', href: '/admin/users' },
    { label: 'Kiểm duyệt đánh giá', icon: 'star', href: '/admin/ratings' },
    { label: 'Giám sát tài chính', icon: 'cash', href: '/admin/finance' },
    { label: 'Danh mục (kỹ năng · lĩnh vực · huy hiệu)', icon: 'pricetags', href: '/admin/catalog' },
    { label: 'Giám sát hệ thống', icon: 'pulse', href: '/admin/monitoring' },
    { label: 'Xuất dữ liệu CSV', icon: 'download', href: '/admin/export' },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: insets.top + spacing.md, paddingBottom: spacing.xl }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.primary} />}
    >
      <Text style={s.title}>Tổng quan quản trị</Text>

      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} /> : (
        <>
          <Text style={s.section}>Hộp việc cần xử lý</Text>
          {rows.map((r) => (
            <TouchableOpacity key={r.key} style={s.row} activeOpacity={0.85} onPress={() => router.push(r.href)}>
              <View style={s.dot}><Ionicons name={r.icon} size={16} color={colors.primary} /></View>
              <Text style={s.rowLabel}>{r.label}</Text>
              <View style={s.countBadge}><Text style={s.countText}>{inbox[r.key] ?? 0}</Text></View>
              <Ionicons name="chevron-forward" size={18} color={colors.ink3} />
            </TouchableOpacity>
          ))}

          <Text style={[s.section, { marginTop: spacing.md }]}>Công cụ quản trị</Text>
          {tools.map((t) => (
            <TouchableOpacity key={t.href} style={s.row} activeOpacity={0.85} onPress={() => router.push(t.href)}>
              <View style={[s.dot, { backgroundColor: colors.accent50 }]}><Ionicons name={t.icon} size={16} color={colors.accent} /></View>
              <Text style={s.rowLabel} numberOfLines={1}>{t.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.ink3} />
            </TouchableOpacity>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: colors.ink, marginBottom: spacing.lg },
  section: { fontSize: 13, fontWeight: '700', color: colors.ink2, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md, marginBottom: spacing.sm },
  dot: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primary50, justifyContent: 'center', alignItems: 'center' },
  rowLabel: { flex: 1, fontSize: 14.5, fontWeight: '500', color: colors.ink },
  countBadge: { minWidth: 26, height: 24, borderRadius: 12, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 7 },
  countText: { color: '#fff', fontWeight: '700', fontSize: 12.5 },
});
