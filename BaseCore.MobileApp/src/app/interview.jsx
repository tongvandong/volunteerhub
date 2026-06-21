import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { registrationApi, interviewCallApi } from '../api/client';
import { colors, radius, spacing } from '../theme';
import { formatDateTime } from '../utils/format';

// tìm slotId từ một registration (tên field có thể khác nhau tuỳ DTO)
const slotIdOf = (r) => r.interviewSlotId ?? r.interviewSlot?.id ?? r.slotId ?? r.interviewSlot?.slotId ?? null;

export default function Interview() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [reg, setReg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [status, setStatus] = useState(null); // { ok, message, room }

  const load = useCallback(async () => {
    try {
      const { data } = await registrationApi.getMyRegistrations();
      const arr = Array.isArray(data) ? data : (data?.items || []);
      const scheduled = arr.find((r) => r.interviewStatus === 'Scheduled');
      setReg(scheduled || null);
    } catch {
      setReg(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const join = async () => {
    const slotId = reg && slotIdOf(reg);
    if (!slotId) {
      setStatus({ ok: false, message: 'Không tìm thấy mã buổi phỏng vấn (slot).' });
      return;
    }
    setJoining(true);
    setStatus(null);
    try {
      const { data } = await interviewCallApi.getTrtcToken(slotId);
      setStatus({ ok: true, message: 'Sẵn sàng vào phòng họp.', room: data });
    } catch (e) {
      const code = e?.response?.status;
      const msg = code === 503
        ? 'Tính năng gọi video chưa được cấu hình TRTC trên máy chủ.'
        : (e?.response?.data?.message || 'Không lấy được phòng họp.');
      setStatus({ ok: false, message: msg });
    } finally {
      setJoining(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={[s.topbar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={24} color={colors.ink} /></TouchableOpacity>
        <Text style={s.topTitle}>Phỏng vấn trực tuyến</Text>
      </View>

      <View style={{ padding: spacing.lg }}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
        ) : !reg ? (
          <View style={s.card}>
            <Ionicons name="videocam-off-outline" size={28} color={colors.ink3} />
            <Text style={s.emptyTitle}>Chưa có lịch phỏng vấn</Text>
            <Text style={s.emptyText}>Khi ban tổ chức lên lịch phỏng vấn cho bạn, buổi họp sẽ hiện ở đây.</Text>
          </View>
        ) : (
          <>
            <View style={s.card}>
              <View style={s.iconWrap}><Ionicons name="videocam" size={22} color={colors.primary} /></View>
              <Text style={s.evTitle}>{reg.event?.title || `Sự kiện #${reg.eventId}`}</Text>
              {!!reg.interviewSlot?.startTime && <Text style={s.evMeta}>Thời gian: {formatDateTime(reg.interviewSlot.startTime)}</Text>}
              <Text style={s.evMeta}>Trạng thái: Đã lên lịch</Text>

              <TouchableOpacity style={[s.btn, joining && { opacity: 0.6 }]} onPress={join} disabled={joining}>
                <Ionicons name="enter-outline" size={18} color="#fff" />
                <Text style={s.btnText}>{joining ? 'Đang kết nối…' : 'Vào phòng họp'}</Text>
              </TouchableOpacity>
            </View>

            {status && (
              <View style={[s.statusBox, { borderColor: status.ok ? colors.success : colors.danger }]}>
                <Ionicons name={status.ok ? 'checkmark-circle' : 'alert-circle'} size={18} color={status.ok ? colors.success : colors.danger} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.statusText, { color: status.ok ? colors.success : colors.danger }]}>{status.message}</Text>
                  {status.ok && status.room && (
                    <Text style={s.roomInfo}>Phòng #{status.room.roomId} · SDKAppID {status.room.sdkAppId}{'\n'}Gọi video thật cần bản dev build + TUICallKit (Pha 8B).</Text>
                  )}
                </View>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, paddingBottom: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  topTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.lg, alignItems: 'center' },
  iconWrap: { width: 52, height: 52, borderRadius: 14, backgroundColor: colors.primary50, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  evTitle: { fontSize: 17, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  evMeta: { fontSize: 13, color: colors.ink2, marginTop: 4 },
  btn: { flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.input, paddingVertical: 14, alignSelf: 'stretch', marginTop: spacing.lg },
  btnText: { color: '#fff', fontSize: 15.5, fontWeight: '600' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.ink, marginTop: spacing.sm },
  emptyText: { fontSize: 13.5, color: colors.ink2, textAlign: 'center', marginTop: 6 },
  statusBox: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderRadius: radius.card, padding: spacing.md, marginTop: spacing.md },
  statusText: { fontSize: 14, fontWeight: '600' },
  roomInfo: { fontSize: 12, color: colors.ink2, marginTop: 4, lineHeight: 17 },
});
