import { useCallback, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { sponsorApi, sponsorshipProposalApi } from '../api/client';
import { colors, radius, spacing } from '../theme';
import { formatDate } from '../utils/format';

const money = (n) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';
const PROP_STATUS = { Pending: ['Chờ phản hồi', colors.accent], Accepted: ['Đã chấp nhận', colors.success], Rejected: ['Đã từ chối', colors.danger], Received: ['Đã nhận', colors.primary], Cancelled: ['Đã huỷ', colors.ink3] };

export default function MySponsorships() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('sponsorships'); // sponsorships | proposals
  const [items, setItems] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([
        sponsorApi.getMySponsorships().catch(() => ({ data: [] })),
        sponsorshipProposalApi.getMy().catch(() => ({ data: [] })),
      ]);
      setItems(Array.isArray(a.data) ? a.data : (a.data?.items || []));
      setProposals(Array.isArray(b.data) ? b.data : (b.data?.items || []));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const act = async (fn, okMsg) => {
    try { await fn(); Alert.alert('Thành công', okMsg); await load(); }
    catch (e) { Alert.alert('Lỗi', e?.response?.data?.message || 'Không thực hiện được.'); }
  };

  const total = items.reduce((sum, x) => sum + (Number(x.amount) || 0), 0);
  const data = tab === 'sponsorships' ? items : proposals;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top + spacing.md }}>
      <Text style={s.title}>Tài trợ của tôi</Text>

      <View style={s.tabs}>
        <Seg label={`Đã tài trợ (${items.length})`} active={tab === 'sponsorships'} onPress={() => setTab('sponsorships')} />
        <Seg label={`Đề xuất (${proposals.length})`} active={tab === 'proposals'} onPress={() => setTab('proposals')} />
      </View>

      {tab === 'sponsorships' && !loading && items.length > 0 && (
        <View style={s.summary}>
          <Text style={s.summaryNum}>{money(total)}</Text>
          <Text style={s.summaryLabel}>Tổng đã tài trợ · {items.length} sự kiện</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(x, i) => String(x.id ?? i)}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.primary} />}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
          ListEmptyComponent={<Text style={s.empty}>{tab === 'sponsorships' ? 'Bạn chưa tài trợ sự kiện nào.' : 'Chưa có đề xuất tài trợ nào.'}</Text>}
          renderItem={({ item }) => tab === 'sponsorships' ? (
            <View style={s.card}>
              <View style={s.dot}><Ionicons name="gift" size={16} color={colors.accent} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.name} numberOfLines={1}>{item.eventTitle || item.event?.title || `Sự kiện #${item.eventId}`}</Text>
                <Text style={s.sub}>{item.contributionType === 'Supplies' ? 'Hiện vật' : 'Tài chính'} · {money(item.amount)}{item.sponsoredAt ? ` · ${formatDate(item.sponsoredAt)}` : ''}</Text>
              </View>
            </View>
          ) : (() => {
            const [label, tint] = PROP_STATUS[item.status] || [item.status, colors.ink3];
            return (
              <View style={s.cardCol}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <View style={s.dot}><Ionicons name="document-text" size={15} color={colors.accent} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name} numberOfLines={1}>{item.eventTitle || item.event?.title || `Sự kiện #${item.eventId}`}</Text>
                    <Text style={s.sub}>{money(item.amount)}{item.note ? ` · ${item.note}` : ''}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: tint + '22' }]}><Text style={[s.badgeText, { color: tint }]}>{label}</Text></View>
                </View>
                {item.status === 'Pending' && (
                  <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                    <TouchableOpacity style={[s.pBtn, { backgroundColor: colors.primary }]} onPress={() => act(() => sponsorshipProposalApi.accept(item.id), 'Đã chấp nhận đề xuất.')}>
                      <Text style={s.pBtnText}>Chấp nhận</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.pBtn, s.pReject]} onPress={() => act(() => sponsorshipProposalApi.reject(item.id, { reason: 'Không phù hợp ngân sách hiện tại.' }), 'Đã từ chối đề xuất.')}>
                      <Text style={[s.pBtnText, { color: colors.danger }]}>Từ chối</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })()}
        />
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
  title: { fontSize: 24, fontWeight: '700', color: colors.ink, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  seg: { flex: 1, paddingVertical: 9, borderRadius: radius.pill, alignItems: 'center', backgroundColor: colors.surface2 },
  segActive: { backgroundColor: colors.primary },
  segText: { fontSize: 12.5, fontWeight: '600', color: colors.ink2 },
  segTextActive: { color: '#fff' },
  summary: { marginHorizontal: spacing.lg, marginBottom: spacing.md, backgroundColor: colors.accent50, borderRadius: radius.card, padding: spacing.md },
  summaryNum: { fontSize: 22, fontWeight: '700', color: colors.accent },
  summaryLabel: { fontSize: 12.5, color: colors.ink2, marginTop: 2 },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md, marginBottom: spacing.sm },
  cardCol: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md, marginBottom: spacing.sm },
  dot: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accent50, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 14.5, fontWeight: '600', color: colors.ink },
  sub: { fontSize: 12.5, color: colors.ink2, marginTop: 2 },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  pBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.input, alignItems: 'center' },
  pReject: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.danger },
  pBtnText: { color: '#fff', fontWeight: '600', fontSize: 13.5 },
  empty: { textAlign: 'center', color: colors.ink2, marginTop: spacing.xl },
});
