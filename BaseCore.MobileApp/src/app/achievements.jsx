import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { certificateApi, badgeApi, profileApi, ORIGIN } from '../api/client';
import { colors, radius, spacing } from '../theme';
import { formatDate } from '../utils/format';

export default function Achievements() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState('passport'); // passport | certs | badges
  const [passport, setPassport] = useState(null);
  const [certs, setCerts] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      profileApi.getPassport().catch(() => ({ data: null })),
      certificateApi.getMyCertificates().catch(() => ({ data: [] })),
      badgeApi.getMyBadges().catch(() => ({ data: [] })),
    ]).then(([p, c, b]) => {
      setPassport(p.data || null);
      setCerts(Array.isArray(c.data) ? c.data : (c.data?.items || []));
      setBadges(Array.isArray(b.data) ? b.data : (b.data?.items || []));
    }).finally(() => setLoading(false));
  }, []);

  const openPdf = (cert) => {
    const url = cert.pdfUrl
      ? (cert.pdfUrl.startsWith('http') ? cert.pdfUrl : `${ORIGIN}${cert.pdfUrl}`)
      : certificateApi.pdfUrl(cert.certificateCode || cert.code);
    Linking.openURL(url).catch(() => {});
  };

  const pp = passport || {};
  const stats = [
    { num: `${pp.totalHours ?? pp.totalVolunteerHours ?? 0}h`, label: 'Giờ tình nguyện' },
    { num: pp.attendedEvents ?? pp.totalEvents ?? 0, label: 'Sự kiện' },
    { num: badges.length, label: 'Huy hiệu' },
    { num: certs.length, label: 'Chứng chỉ' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={[s.topbar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={24} color={colors.ink} /></TouchableOpacity>
        <Text style={s.topTitle}>Thành tích của tôi</Text>
      </View>

      <View style={s.tabs}>
        <Seg label="Hộ chiếu" active={tab === 'passport'} onPress={() => setTab('passport')} />
        <Seg label={`Chứng chỉ (${certs.length})`} active={tab === 'certs'} onPress={() => setTab('certs')} />
        <Seg label={`Huy hiệu (${badges.length})`} active={tab === 'badges'} onPress={() => setTab('badges')} />
      </View>

      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} /> : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}>
          {tab === 'passport' && (
            <>
              <View style={s.statGrid}>
                {stats.map((st, i) => (
                  <View key={i} style={s.stat}>
                    <Text style={s.statNum}>{st.num}</Text>
                    <Text style={s.statLabel}>{st.label}</Text>
                  </View>
                ))}
              </View>
              {Array.isArray(pp.timeline) && pp.timeline.length > 0 && (
                <>
                  <Text style={s.section}>Hành trình</Text>
                  {pp.timeline.map((t, i) => (
                    <View key={i} style={s.row}>
                      <View style={s.dot}><Ionicons name="flag" size={13} color={colors.primary} /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.rowTitle}>{t.title || t.eventTitle}</Text>
                        <Text style={s.rowSub}>{formatDate(t.date || t.attendedAt)}{t.hours ? ` · ${t.hours}h` : ''}</Text>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </>
          )}

          {tab === 'certs' && (certs.length === 0 ? <Text style={s.empty}>Chưa có chứng chỉ nào.</Text> :
            certs.map((c) => (
              <TouchableOpacity key={c.id} style={s.row} activeOpacity={0.85} onPress={() => openPdf(c)}>
                <View style={[s.dot, { backgroundColor: colors.accent50 }]}><Ionicons name="ribbon" size={14} color={colors.accent} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle} numberOfLines={1}>{c.eventTitle || c.certificateCode}</Text>
                  <Text style={s.rowSub}>{c.certificateCode} · {formatDate(c.issuedAt)} · {c.volunteerHours}h</Text>
                </View>
                <Ionicons name="open-outline" size={17} color={colors.primary} />
              </TouchableOpacity>
            )))}

          {tab === 'badges' && (badges.length === 0 ? <Text style={s.empty}>Chưa có huy hiệu nào.</Text> :
            badges.map((b, i) => (
              <View key={b.id ?? i} style={s.row}>
                <View style={[s.dot, { backgroundColor: '#f7edd8' }]}><Ionicons name="medal" size={14} color="#b8860b" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>{b.badgeName || b.badge?.name || b.name}</Text>
                  <Text style={s.rowSub}>{b.awardedAt ? `Nhận ngày ${formatDate(b.awardedAt)}` : (b.badge?.description || b.description || '')}</Text>
                </View>
              </View>
            )))}
        </ScrollView>
      )}
    </View>
  );
}

function Seg({ label, active, onPress }) {
  return (
    <TouchableOpacity style={[s.seg, active && s.segActive]} onPress={onPress}>
      <Text style={[s.segText, active && s.segTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, paddingBottom: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  topTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  tabs: { flexDirection: 'row', gap: 8, padding: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  seg: { flex: 1, paddingVertical: 9, borderRadius: radius.pill, alignItems: 'center', backgroundColor: colors.surface2 },
  segActive: { backgroundColor: colors.primary },
  segText: { fontSize: 12.5, fontWeight: '600', color: colors.ink2 },
  segTextActive: { color: '#fff' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  stat: { width: '47%', flexGrow: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '700', color: colors.ink },
  statLabel: { fontSize: 12, color: colors.ink2, marginTop: 4 },
  section: { fontSize: 13, fontWeight: '700', color: colors.ink2, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md, marginBottom: spacing.sm },
  dot: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primary50, justifyContent: 'center', alignItems: 'center' },
  rowTitle: { fontSize: 14, fontWeight: '600', color: colors.ink },
  rowSub: { fontSize: 12, color: colors.ink2, marginTop: 2 },
  empty: { textAlign: 'center', color: colors.ink2, marginTop: spacing.lg },
});
