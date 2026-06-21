import { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { profileApi, ORIGIN } from '../api/client';
import { colors, radius, spacing } from '../theme';

const ROLE = { 0: 'Tình nguyện viên', 1: 'Tổ chức', 2: 'Nhà tài trợ', 3: 'Quản trị viên' };
const KYC_LABEL = { Verified: 'Đã xác minh', PendingVerification: 'Chờ xác minh', Unverified: 'Chưa xác minh', Rejected: 'Bị từ chối' };

export default function Profile() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [skillCount, setSkillCount] = useState(0);

  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await profileApi.getMyProfile();
        if (!active) return;
        setProfile(data?.profile || null);
        const sk = data?.volunteerSkills || data?.skills || [];
        setSkillCount(Array.isArray(sk) ? sk.length : 0);
      } catch { /* ignore */ }
    })();
    return () => { active = false; };
  }, []));

  const onLogout = async () => { await logout(); router.replace('/login'); };

  const isVolunteer = user?.userType === 0;
  const isOrganizer = user?.userType === 1;
  const isSponsor = user?.userType === 2;

  const avatarUri = profile?.avatarUrl
    ? (profile.avatarUrl.startsWith('http') ? profile.avatarUrl : `${ORIGIN}${profile.avatarUrl}`)
    : null;

  const menu = [
    { icon: 'create-outline', label: 'Chỉnh sửa hồ sơ', href: '/edit-profile', show: true },
    { icon: 'trophy-outline', label: 'Thành tích (hộ chiếu · chứng chỉ · huy hiệu)', href: '/achievements', show: isVolunteer },
    { icon: 'heart-outline', label: 'Quyên góp của tôi', href: '/my-donations', show: isVolunteer || isSponsor },
    { icon: 'notifications-outline', label: 'Thông báo', href: '/notifications', show: true },
    { icon: 'chatbubbles-outline', label: 'Kênh trao đổi', href: '/channels', show: true },
    { icon: 'videocam-outline', label: 'Phỏng vấn trực tuyến', href: '/interview', show: isVolunteer },
    { icon: 'business-outline', label: 'Hồ sơ tổ chức (xác minh)', href: '/organizer-verification', show: isOrganizer },
    { icon: 'stats-chart-outline', label: 'Thống kê hoạt động', href: '/insights', show: isOrganizer },
    { icon: 'storefront-outline', label: 'Hồ sơ nhà tài trợ', href: '/sponsor-profile', show: isSponsor },
    { icon: 'shield-checkmark-outline', label: 'Tra cứu chứng chỉ', href: '/verify-certificate', show: true },
  ].filter((m) => m.show);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}>
      <View style={{ alignItems: 'center' }}>
        {avatarUri ? <Image source={{ uri: avatarUri }} style={s.avatarImg} /> : (
          <View style={s.avatar}><Ionicons name="person" size={34} color={colors.primary} /></View>
        )}
        <Text style={s.name}>{user?.name || 'Người dùng'}</Text>
        <Text style={s.role}>{ROLE[user?.userType] ?? 'Thành viên'}</Text>
        {!!user?.email && <Text style={s.meta}>{user.email}</Text>}
      </View>

      {isVolunteer && (
        <View style={s.statsRow}>
          <Stat num={`${profile?.totalVolunteerHours ?? 0}h`} label="Giờ công" />
          <Stat num={skillCount} label="Kỹ năng" />
          <Stat num={KYC_LABEL[profile?.kycStatus] ?? '—'} label="KYC" small />
        </View>
      )}

      <View style={{ marginTop: spacing.lg }}>
        {menu.map((m) => (
          <TouchableOpacity key={m.href} style={s.menuRow} onPress={() => router.push(m.href)} activeOpacity={0.85}>
            <Ionicons name={m.icon} size={20} color={colors.ink2} />
            <Text style={s.menuText} numberOfLines={1}>{m.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.ink3} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.logout} onPress={onLogout} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={s.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Stat({ num, label, small }) {
  return (
    <View style={s.stat}>
      <Text style={[s.statNum, small && { fontSize: 13 }]}>{num}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  avatar: { width: 84, height: 84, borderRadius: radius.pill, backgroundColor: colors.primary50, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  avatarImg: { width: 84, height: 84, borderRadius: 42, marginBottom: spacing.md },
  name: { fontSize: 22, fontWeight: '700', color: colors.ink },
  role: { fontSize: 14, color: colors.accent, fontWeight: '600', marginTop: 4 },
  meta: { fontSize: 13, color: colors.ink2, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  stat: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, paddingVertical: spacing.md, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '700', color: colors.ink },
  statLabel: { fontSize: 11.5, color: colors.ink2, marginTop: 4 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, paddingHorizontal: spacing.md, paddingVertical: 14, backgroundColor: colors.surface, marginBottom: spacing.sm },
  menuText: { flex: 1, fontSize: 14, color: colors.ink, fontWeight: '500' },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing.md, borderWidth: 1, borderColor: colors.border2, borderRadius: radius.input, paddingVertical: 12, backgroundColor: colors.surface },
  logoutText: { color: colors.danger, fontWeight: '600', fontSize: 15 },
});
