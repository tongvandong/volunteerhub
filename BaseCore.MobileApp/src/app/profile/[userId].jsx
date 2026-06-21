import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { profileApi } from '../../api/client';
import { colors, radius, spacing } from '../../theme';

export default function PublicProfile() {
  const { userId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    profileApi.getUserProfile(userId)
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>;

  const u = data?.user || data || {};
  const p = data?.profile || {};
  const skills = data?.volunteerSkills || data?.skills || [];
  const name = u.name || data?.name || 'Người dùng';

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={[s.topbar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={24} color={colors.ink} /></TouchableOpacity>
        <Text style={s.topTitle}>Hồ sơ công khai</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, alignItems: 'center' }}>
        <View style={s.avatar}><Ionicons name="person" size={34} color={colors.primary} /></View>
        <Text style={s.name}>{name}</Text>
        {!!p.bio && <Text style={s.bio}>{p.bio}</Text>}

        <View style={s.statsRow}>
          <Stat num={`${p.totalVolunteerHours ?? 0}h`} label="Giờ công" />
          <Stat num={skills.length} label="Kỹ năng" />
        </View>

        {skills.length > 0 && (
          <View style={{ alignSelf: 'stretch', marginTop: spacing.lg }}>
            <Text style={s.section}>Kỹ năng</Text>
            <View style={s.chips}>
              {skills.map((sk, i) => (
                <View key={i} style={s.chip}><Text style={s.chipText}>{sk.skillName || sk.name || `#${sk.skillId}`}</Text></View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Stat({ num, label }) {
  return <View style={s.stat}><Text style={s.statNum}>{num}</Text><Text style={s.statLabel}>{label}</Text></View>;
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.canvas },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, paddingBottom: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  topTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  avatar: { width: 84, height: 84, borderRadius: radius.pill, backgroundColor: colors.primary50, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  name: { fontSize: 22, fontWeight: '700', color: colors.ink },
  bio: { fontSize: 13.5, color: colors.ink2, marginTop: 6, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, alignSelf: 'stretch' },
  stat: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, paddingVertical: spacing.md, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '700', color: colors.ink },
  statLabel: { fontSize: 11.5, color: colors.ink2, marginTop: 4 },
  section: { fontSize: 13, fontWeight: '700', color: colors.ink2, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.surface2, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 12.5, color: colors.ink },
});
