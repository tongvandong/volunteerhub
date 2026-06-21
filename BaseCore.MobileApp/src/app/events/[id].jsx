import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, Linking, Modal, TextInput, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventApi, registrationApi, supportCampaignApi } from '../../api/client';
import { colors, radius, spacing } from '../../theme';
import { formatDateTime, regStatusLabel } from '../../utils/format';
import { eventImageSource, eventFallback } from '../../utils/eventImage';

const money = (n) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';

export default function EventDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [ev, setEv] = useState(null);
  const [reg, setReg] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [shiftPicker, setShiftPicker] = useState(false);
  const [donateTo, setDonateTo] = useState(null); // campaign
  const [donateAmount, setDonateAmount] = useState('100000');

  const load = useCallback(async () => {
    try {
      const [evRes, regRes, shiftRes, campRes] = await Promise.all([
        eventApi.getById(id),
        registrationApi.getMyRegistration(id).catch(() => ({ data: null })),
        eventApi.getShifts(id).catch(() => ({ data: [] })),
        supportCampaignApi.getByEvent(id).catch(() => ({ data: [] })),
      ]);
      setEv(evRes.data);
      setReg(regRes?.data || null);
      setShifts(Array.isArray(shiftRes.data) ? shiftRes.data : (shiftRes.data?.items || []));
      const camps = Array.isArray(campRes.data) ? campRes.data : (campRes.data?.items || []);
      setCampaigns(camps.filter((c) => c.status === 'Active' || c.status === 'Open' || c.status === 'Closed'));
    } catch {
      setEv(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const isRegistered = reg && reg.status && reg.status !== 'Cancelled';

  const doRegister = async (shiftId) => {
    setBusy(true); setShiftPicker(false);
    try {
      await registrationApi.register(id, shiftId ? { shiftId } : {});
      Alert.alert('Thành công', 'Bạn đã đăng ký sự kiện này.');
      await load();
    } catch (e) {
      Alert.alert('Không đăng ký được', e?.response?.data?.message || 'Vui lòng thử lại.');
    } finally { setBusy(false); }
  };

  const onRegister = () => {
    if (shifts.length > 0) setShiftPicker(true);
    else doRegister(null);
  };

  const onWithdraw = async () => {
    setBusy(true);
    try {
      await registrationApi.withdraw(id);
      Alert.alert('Đã huỷ', 'Bạn đã rút khỏi sự kiện.');
      await load();
    } catch (e) {
      Alert.alert('Không huỷ được', e?.response?.data?.message || 'Vui lòng thử lại.');
    } finally { setBusy(false); }
  };

  const submitDonate = async () => {
    const amount = parseInt(donateAmount, 10);
    if (!amount || amount < 1000) return Alert.alert('Số tiền không hợp lệ', 'Tối thiểu 1.000đ.');
    setBusy(true);
    try {
      await supportCampaignApi.donate(donateTo.id, { amount, note: '' });
      Alert.alert('Cảm ơn bạn!', 'Đã ghi nhận quyên góp, chờ ban tổ chức xác nhận.');
      setDonateTo(null);
      await load();
    } catch (e) {
      Alert.alert('Không quyên góp được', e?.response?.data?.message || 'Vui lòng thử lại.');
    } finally { setBusy(false); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  if (!ev) return <View style={s.center}><Text style={{ color: colors.ink2 }}>Không tìm thấy sự kiện.</Text></View>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={[s.topbar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={s.topTitle} numberOfLines={1}>Chi tiết sự kiện</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
        {/* Hero cover */}
        {(() => {
          const img = eventImageSource(ev);
          const fb = eventFallback(ev);
          return img ? (
            <Image source={img} style={s.hero} resizeMode="cover" />
          ) : (
            <View style={[s.hero, { backgroundColor: fb.bg, justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name={fb.icon} size={56} color={fb.fg} style={{ opacity: 0.5 }} />
            </View>
          );
        })()}

        <View style={{ padding: spacing.lg }}>
        <Text style={s.title}>{ev.title}</Text>

        <Row icon="location-outline" text={ev.location || 'Chưa rõ địa điểm'} />
        <Row icon="time-outline" text={`${formatDateTime(ev.startDate)} → ${formatDateTime(ev.endDate)}`} />
        <Row icon="people-outline" text={`${ev.currentParticipants ?? 0}/${ev.maxParticipants ?? '∞'} người tham gia`} />

        {ev.latitude != null && ev.longitude != null && (
          <TouchableOpacity
            style={s.mapBtn}
            onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${ev.latitude},${ev.longitude}`)}
          >
            <Ionicons name="map-outline" size={16} color={colors.primary} />
            <Text style={s.mapText}>Xem trên bản đồ</Text>
          </TouchableOpacity>
        )}

        {!!ev.description && (
          <>
            <Text style={s.section}>Mô tả</Text>
            <Text style={s.desc}>{ev.description}</Text>
          </>
        )}

        {shifts.length > 0 && (
          <>
            <Text style={s.section}>Ca làm việc</Text>
            {shifts.map((sh) => (
              <View key={sh.id} style={s.shiftRow}>
                <Ionicons name="time-outline" size={15} color={colors.ink3} />
                <Text style={s.shiftText}>{sh.name || `Ca #${sh.id}`} · {formatDateTime(sh.startTime)} → {formatDateTime(sh.endTime)}</Text>
              </View>
            ))}
          </>
        )}

        {campaigns.length > 0 && (
          <>
            <Text style={s.section}>Chiến dịch gây quỹ</Text>
            {campaigns.map((c) => {
              const raised = c.raisedAmount ?? c.totalRaised ?? 0;
              const pct = c.targetAmount ? Math.min(100, Math.round((raised / c.targetAmount) * 100)) : 0;
              return (
                <View key={c.id} style={s.campCard}>
                  <Text style={s.campTitle} numberOfLines={1}>{c.title}</Text>
                  <View style={s.progressTrack}><View style={[s.progressFill, { width: `${pct}%` }]} /></View>
                  <Text style={s.campMeta}>{money(raised)} / {money(c.targetAmount)} ({pct}%)</Text>
                  {(c.status === 'Active' || c.status === 'Open') && (
                    <TouchableOpacity style={s.donateBtn} onPress={() => setDonateTo(c)}>
                      <Ionicons name="heart" size={14} color="#fff" />
                      <Text style={s.donateText}>Ủng hộ</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </>
        )}

        {isRegistered && (
          <View style={s.regBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={s.regText}>Trạng thái đăng ký: {regStatusLabel(reg.status)}</Text>
          </View>
        )}
        </View>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        {isRegistered ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TouchableOpacity style={[s.btn, { flex: 1 }, busy && { opacity: 0.6 }]} onPress={() => router.push(`/checkin/${id}`)} disabled={busy}>
              <Text style={s.btnText}>Điểm danh</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btn, s.btnOutline, { flex: 1 }, busy && { opacity: 0.6 }]} onPress={onWithdraw} disabled={busy}>
              <Text style={[s.btnText, { color: colors.danger }]}>{busy ? '…' : 'Huỷ'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={[s.btn, busy && { opacity: 0.6 }]} onPress={onRegister} disabled={busy}>
            <Text style={s.btnText}>{busy ? 'Đang xử lý…' : 'Đăng ký tham gia'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal chọn ca */}
      <Modal visible={shiftPicker} transparent animationType="fade" onRequestClose={() => setShiftPicker(false)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Chọn ca làm việc</Text>
            {shifts.map((sh) => (
              <TouchableOpacity key={sh.id} style={s.shiftOption} onPress={() => doRegister(sh.id)}>
                <Text style={s.shiftOptName}>{sh.name || `Ca #${sh.id}`}</Text>
                <Text style={s.shiftOptTime}>{formatDateTime(sh.startTime)} → {formatDateTime(sh.endTime)}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.shiftOption} onPress={() => doRegister(null)}>
              <Text style={[s.shiftOptName, { color: colors.ink2 }]}>Không chọn ca cụ thể</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.mBtn, s.mCancel]} onPress={() => setShiftPicker(false)}>
              <Text style={{ color: colors.ink2, fontWeight: '600' }}>Huỷ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal quyên góp */}
      <Modal visible={!!donateTo} transparent animationType="fade" onRequestClose={() => setDonateTo(null)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Ủng hộ "{donateTo?.title}"</Text>
            <TextInput
              style={s.amountInput}
              keyboardType="numeric"
              value={donateAmount}
              onChangeText={setDonateAmount}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.md }}>
              {[50000, 100000, 200000, 500000].map((a) => (
                <TouchableOpacity key={a} style={s.quickAmt} onPress={() => setDonateAmount(String(a))}>
                  <Text style={s.quickAmtText}>{a / 1000}k</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity style={[s.mBtn, s.mCancel]} onPress={() => setDonateTo(null)}>
                <Text style={{ color: colors.ink2, fontWeight: '600' }}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.mBtn, s.mSubmit, busy && { opacity: 0.6 }]} onPress={submitDonate} disabled={busy}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{busy ? '…' : 'Ủng hộ'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Row({ icon, text }) {
  return (
    <View style={s.row}>
      <Ionicons name={icon} size={16} color={colors.ink3} />
      <Text style={s.rowText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.canvas },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, paddingBottom: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  topTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  hero: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.surface2 },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  rowText: { fontSize: 14, color: colors.ink2, flex: 1 },
  mapBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, alignSelf: 'flex-start' },
  mapText: { color: colors.primary, fontSize: 13.5, fontWeight: '600' },
  section: { fontSize: 13, fontWeight: '700', color: colors.ink2, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.md, marginBottom: 6 },
  desc: { fontSize: 14.5, color: colors.ink, lineHeight: 21 },
  shiftRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  shiftText: { fontSize: 13, color: colors.ink2, flex: 1 },
  campCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md, marginBottom: spacing.sm },
  campTitle: { fontSize: 14.5, fontWeight: '600', color: colors.ink },
  progressTrack: { height: 7, borderRadius: 4, backgroundColor: colors.surface2, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 4 },
  campMeta: { fontSize: 12, color: colors.ink2, marginTop: 6 },
  donateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 9, marginTop: spacing.sm },
  donateText: { color: '#fff', fontWeight: '600', fontSize: 13.5 },
  regBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.success + '18', borderRadius: radius.input, padding: spacing.md, marginTop: spacing.lg },
  regText: { color: colors.success, fontWeight: '600', fontSize: 13.5 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  btn: { backgroundColor: colors.primary, borderRadius: radius.input, paddingVertical: 15, alignItems: 'center' },
  btnOutline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.danger },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: spacing.lg },
  modal: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, textAlign: 'center', marginBottom: spacing.md },
  shiftOption: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, padding: spacing.md, marginBottom: spacing.sm },
  shiftOptName: { fontSize: 14.5, fontWeight: '600', color: colors.ink },
  shiftOptTime: { fontSize: 12.5, color: colors.ink2, marginTop: 2 },
  amountInput: { backgroundColor: colors.surface2, borderRadius: radius.input, padding: spacing.md, fontSize: 18, fontWeight: '700', color: colors.ink, textAlign: 'center', marginBottom: spacing.sm },
  quickAmt: { flex: 1, backgroundColor: colors.accent50, borderRadius: radius.pill, paddingVertical: 8, alignItems: 'center' },
  quickAmtText: { color: colors.accent, fontWeight: '700', fontSize: 13 },
  mBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.input, alignItems: 'center' },
  mCancel: { backgroundColor: colors.surface2 },
  mSubmit: { backgroundColor: colors.accent },
});
