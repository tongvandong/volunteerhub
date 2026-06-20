import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl, Modal, TextInput, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { registrationApi, ratingApi } from '../api/client';
import { colors, radius, spacing } from '../theme';
import { formatDate, regStatusLabel } from '../utils/format';
import { eventImageSource, eventFallback } from '../utils/eventImage';

function Thumb({ event }) {
  const img = eventImageSource(event);
  const fb = eventFallback(event);
  if (img) return <Image source={img} style={th.thumb} />;
  return (
    <View style={[th.thumb, { backgroundColor: fb.bg, justifyContent: 'center', alignItems: 'center' }]}>
      <Ionicons name={fb.icon} size={18} color={fb.fg} style={{ opacity: 0.6 }} />
    </View>
  );
}
const th = StyleSheet.create({ thumb: { width: 46, height: 46, borderRadius: 11 } });

const STATUS_TINT = {
  Confirmed: colors.success,
  Pending: colors.accent,
  Cancelled: colors.ink3,
};

export default function Activity() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(null); // registration đang đánh giá
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await registrationApi.getMyRegistrations();
      setItems(Array.isArray(data) ? data : (data?.items || []));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const canRate = (r) => r.isAttended && r.event?.status === 'Completed' && !r.hasRated;

  const submitRating = async () => {
    const ev = rating?.event;
    if (!ev?.organizerId) { Alert.alert('Lỗi', 'Không xác định được ban tổ chức.'); return; }
    setSending(true);
    try {
      await ratingApi.create(ev.id, { rateeId: ev.organizerId, score, comment: comment.trim() });
      Alert.alert('Cảm ơn bạn!', 'Đã gửi đánh giá.');
      setRating(null); setComment(''); setScore(5);
      load();
    } catch (e) {
      Alert.alert('Không gửi được', e?.response?.data?.message || 'Có thể bạn đã đánh giá sự kiện này.');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top + spacing.md }}>
      <Text style={s.title}>Hoạt động của tôi</Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(r) => String(r.id)}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.primary} />}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
          ListEmptyComponent={<Text style={s.empty}>Bạn chưa đăng ký sự kiện nào.</Text>}
          renderItem={({ item }) => {
            const ev = item.event || {};
            return (
              <View style={s.card}>
                <TouchableOpacity style={s.cardMain} activeOpacity={0.85} onPress={() => ev.id && router.push(`/events/${ev.id}`)}>
                  <Thumb event={ev} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardTitle} numberOfLines={1}>{ev.title || `Sự kiện #${item.eventId}`}</Text>
                    <Text style={s.meta}>{formatDate(ev.startDate)}{item.isAttended ? ` · ${item.volunteerHours || 0}h` : ''}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: (STATUS_TINT[item.status] || colors.ink3) + '22' }]}>
                    <Text style={[s.badgeText, { color: STATUS_TINT[item.status] || colors.ink3 }]}>
                      {item.isAttended ? 'Đã tham gia' : regStatusLabel(item.status)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.ink3} />
                </TouchableOpacity>
                {canRate(item) && (
                  <TouchableOpacity style={s.rateBtn} onPress={() => setRating(item)}>
                    <Ionicons name="star" size={14} color={colors.accent} />
                    <Text style={s.rateText}>Đánh giá ban tổ chức</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}

      {/* Modal đánh giá */}
      <Modal visible={!!rating} transparent animationType="fade" onRequestClose={() => setRating(null)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Đánh giá "{rating?.event?.title}"</Text>
            <View style={s.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setScore(n)} hitSlop={6}>
                  <Ionicons name={n <= score ? 'star' : 'star-outline'} size={32} color={colors.accent} />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={s.commentInput}
              placeholder="Cảm nhận của bạn (tuỳ chọn)…"
              placeholderTextColor={colors.ink3}
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity style={[s.mBtn, s.mCancel]} onPress={() => setRating(null)}>
                <Text style={{ color: colors.ink2, fontWeight: '600' }}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.mBtn, s.mSubmit, sending && { opacity: 0.6 }]} onPress={submitRating} disabled={sending}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{sending ? 'Đang gửi…' : 'Gửi đánh giá'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: colors.ink, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, marginBottom: spacing.sm, overflow: 'hidden' },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  cardTitle: { fontSize: 14.5, fontWeight: '600', color: colors.ink },
  meta: { fontSize: 12.5, color: colors.ink2, marginTop: 2 },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11.5, fontWeight: '600' },
  rateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 10, backgroundColor: colors.accent50 },
  rateText: { color: colors.accent, fontWeight: '600', fontSize: 13 },
  empty: { textAlign: 'center', color: colors.ink2, marginTop: spacing.xl },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: spacing.lg },
  modal: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginVertical: spacing.md },
  commentInput: { backgroundColor: colors.surface2, borderRadius: radius.input, padding: spacing.md, minHeight: 70, textAlignVertical: 'top', fontSize: 14, color: colors.ink, marginBottom: spacing.md },
  mBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.input, alignItems: 'center' },
  mCancel: { backgroundColor: colors.surface2 },
  mSubmit: { backgroundColor: colors.primary },
});
