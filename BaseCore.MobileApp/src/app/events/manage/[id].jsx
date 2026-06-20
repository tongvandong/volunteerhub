import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventApi, registrationApi, recommendationApi, supportCampaignApi, sponsorshipProposalApi } from '../../../api/client';
import { colors, radius, spacing } from '../../../theme';
import { formatDateTime, regStatusLabel } from '../../../utils/format';

const money = (n) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';

const TABS = [
  { key: 'regs', label: 'Đăng ký' },
  { key: 'checkin', label: 'Điểm danh' },
  { key: 'shifts', label: 'Ca làm' },
  { key: 'fund', label: 'Gây quỹ' },
  { key: 'suggest', label: 'Gợi ý' },
];

export default function ManageEvent() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [ev, setEv] = useState(null);
  const [tab, setTab] = useState('regs');
  const [regs, setRegs] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [vols, setVols] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newShift, setNewShift] = useState(false);
  const [shiftName, setShiftName] = useState('');
  const [newCamp, setNewCamp] = useState(false);
  const [campTitle, setCampTitle] = useState('');
  const [campTarget, setCampTarget] = useState('10000000');
  const [donationsOf, setDonationsOf] = useState(null);
  const [donations, setDonations] = useState([]);

  const load = useCallback(async () => {
    try {
      const [evRes, regRes, shiftRes, campRes, propRes] = await Promise.all([
        eventApi.getById(id),
        eventApi.getRegistrations(id).catch(() => ({ data: [] })),
        eventApi.getShifts(id).catch(() => ({ data: [] })),
        supportCampaignApi.getByEvent(id).catch(() => ({ data: [] })),
        sponsorshipProposalApi.getByEvent(id).catch(() => ({ data: [] })),
      ]);
      setEv(evRes.data);
      setRegs(Array.isArray(regRes.data) ? regRes.data : (regRes.data?.items || []));
      setShifts(Array.isArray(shiftRes.data) ? shiftRes.data : (shiftRes.data?.items || []));
      setCampaigns(Array.isArray(campRes.data) ? campRes.data : (campRes.data?.items || []));
      setProposals(Array.isArray(propRes.data) ? propRes.data : (propRes.data?.items || []));
    } catch {
      setEv(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (tab !== 'suggest') return;
    recommendationApi.volunteersForEvent(id, 8).then((r) => setVols(r.data?.items || [])).catch(() => {});
    recommendationApi.sponsorsForEvent(id, 8).then((r) => setSponsors(r.data?.items || [])).catch(() => {});
  }, [tab, id]);

  const act = async (fn, okMsg) => {
    try {
      await fn();
      if (okMsg) Alert.alert('Thành công', okMsg);
      await load();
    } catch (e) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không thực hiện được.');
    }
  };

  const addShift = async () => {
    if (!shiftName.trim()) return;
    await act(() => eventApi.createShift(id, { name: shiftName.trim(), startTime: ev.startDate, endTime: ev.endDate }));
    setShiftName(''); setNewShift(false);
  };

  const addCampaign = async () => {
    if (!campTitle.trim()) return;
    const target = parseInt(campTarget, 10) || 0;
    await act(() => supportCampaignApi.create(id, {
      title: campTitle.trim(), description: '', targetAmount: target,
      startDate: new Date().toISOString(), endDate: ev.endDate,
      bankBin: '970422', bankAccountNo: '0000000000', bankAccountName: 'BAN TO CHUC',
    }), 'Đã tạo chiến dịch.');
    setCampTitle(''); setNewCamp(false);
  };

  const openDonations = async (camp) => {
    setDonationsOf(camp);
    try {
      const { data } = await supportCampaignApi.getDonations(camp.id);
      setDonations(Array.isArray(data) ? data : (data?.items || []));
    } catch { setDonations([]); }
  };

  const hoursOf = () => {
    if (!ev) return 4;
    return Math.max(1, Math.round((new Date(ev.endDate) - new Date(ev.startDate)) / 3600000));
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  if (!ev) return <View style={s.center}><Text style={{ color: colors.ink2 }}>Không tìm thấy sự kiện.</Text></View>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={[s.topbar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={24} color={colors.ink} /></TouchableOpacity>
        <Text style={s.topTitle} numberOfLines={1}>{ev.title}</Text>
        <TouchableOpacity onPress={() => router.push(`/events/edit/${id}`)} hitSlop={10}>
          <Ionicons name="create-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 8 }}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.key} style={[s.seg, tab === t.key && s.segActive]} onPress={() => setTab(t.key)}>
            <Text style={[s.segText, tab === t.key && s.segTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}>
        {/* ---- ĐĂNG KÝ ---- */}
        {tab === 'regs' && (regs.length === 0 ? <Text style={s.empty}>Chưa có đăng ký nào.</Text> :
          regs.map((r) => (
            <TouchableOpacity key={r.id} style={s.row} activeOpacity={0.85} onPress={() => r.userId && router.push(`/profile/${r.userId}`)}>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{r.user?.name || `User #${r.userId}`}</Text>
                <Text style={s.sub}>{r.isAttended ? `Đã tham gia · ${r.volunteerHours || 0}h` : regStatusLabel(r.status)}</Text>
              </View>
              {r.status === 'Pending' && (
                <TouchableOpacity style={s.confirmBtn} onPress={() => act(() => registrationApi.confirm(id, r.id))}>
                  <Text style={s.confirmText}>Duyệt</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )))}

        {/* ---- ĐIỂM DANH (organizer) ---- */}
        {tab === 'checkin' && (() => {
          const confirmed = regs.filter((r) => r.status === 'Confirmed');
          if (confirmed.length === 0) return <Text style={s.empty}>Chưa có TNV được xác nhận.</Text>;
          return confirmed.map((r) => (
            <View key={r.id} style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{r.user?.name || `User #${r.userId}`}</Text>
                <Text style={s.sub}>{r.isAttended ? `Đã điểm danh · ${r.volunteerHours || 0}h${r.checkedOutAt ? ' · đã checkout' : ''}` : 'Chưa điểm danh'}</Text>
              </View>
              {!r.isAttended ? (
                <TouchableOpacity style={s.confirmBtn} onPress={() => act(() => registrationApi.manualAttend(id, r.id, hoursOf()), 'Đã chấm công.')}>
                  <Text style={s.confirmText}>Chấm công</Text>
                </TouchableOpacity>
              ) : !r.checkedOutAt ? (
                <TouchableOpacity style={[s.confirmBtn, { backgroundColor: colors.accent }]} onPress={() => act(() => registrationApi.checkOut(id, r.id), 'Đã checkout.')}>
                  <Text style={s.confirmText}>Checkout</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ));
        })()}

        {/* ---- CA LÀM ---- */}
        {tab === 'shifts' && (
          <>
            {shifts.map((sh) => (
              <View key={sh.id} style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{sh.name || `Ca #${sh.id}`}</Text>
                  <Text style={s.sub}>{formatDateTime(sh.startTime)} → {formatDateTime(sh.endTime)}</Text>
                </View>
                <TouchableOpacity onPress={() => act(() => eventApi.deleteShift(id, sh.id))} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
            {newShift ? (
              <View style={s.row}>
                <TextInput style={[s.inlineInput, { flex: 1 }]} placeholder="Tên ca (VD: Ca sáng)" placeholderTextColor={colors.ink3} value={shiftName} onChangeText={setShiftName} />
                <TouchableOpacity style={s.confirmBtn} onPress={addShift}><Text style={s.confirmText}>Thêm</Text></TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={s.addRow} onPress={() => setNewShift(true)}>
                <Ionicons name="add" size={18} color={colors.primary} />
                <Text style={s.addText}>Thêm ca làm việc</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* ---- GÂY QUỸ + TÀI TRỢ DN ---- */}
        {tab === 'fund' && (
          <>
            <Text style={s.section}>Chiến dịch gây quỹ</Text>
            {campaigns.map((c) => {
              const raised = c.raisedAmount ?? c.totalRaised ?? 0;
              return (
                <TouchableOpacity key={c.id} style={s.row} activeOpacity={0.85} onPress={() => openDonations(c)}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name} numberOfLines={1}>{c.title}</Text>
                    <Text style={s.sub}>{money(raised)} / {money(c.targetAmount)} · {c.status}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
                </TouchableOpacity>
              );
            })}
            {newCamp ? (
              <View style={s.campForm}>
                <TextInput style={s.inlineInput} placeholder="Tên chiến dịch" placeholderTextColor={colors.ink3} value={campTitle} onChangeText={setCampTitle} />
                <TextInput style={[s.inlineInput, { marginTop: 8 }]} placeholder="Mục tiêu (đ)" placeholderTextColor={colors.ink3} keyboardType="numeric" value={campTarget} onChangeText={setCampTarget} />
                <TouchableOpacity style={[s.confirmBtn, { marginTop: 8, alignSelf: 'flex-end' }]} onPress={addCampaign}><Text style={s.confirmText}>Tạo</Text></TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={s.addRow} onPress={() => setNewCamp(true)}>
                <Ionicons name="add" size={18} color={colors.primary} />
                <Text style={s.addText}>Tạo chiến dịch gây quỹ</Text>
              </TouchableOpacity>
            )}

            <Text style={[s.section, { marginTop: spacing.lg }]}>Đề xuất tài trợ doanh nghiệp</Text>
            {proposals.length === 0 ? <Text style={s.empty}>Chưa có đề xuất nào.</Text> :
              proposals.map((p) => (
                <View key={p.id} style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{p.sponsorName || p.sponsor?.name || `Sponsor #${p.sponsorId}`}</Text>
                    <Text style={s.sub}>{money(p.amount)} · {p.status}</Text>
                  </View>
                </View>
              ))}
          </>
        )}

        {/* ---- GỢI Ý (graph) ---- */}
        {tab === 'suggest' && (
          <>
            <Text style={s.section}>Tình nguyện viên phù hợp</Text>
            {vols.length === 0 ? <Text style={s.empty}>Chưa có gợi ý.</Text> :
              vols.map((v) => (
                <TouchableOpacity key={`v${v.userId}`} style={s.row} activeOpacity={0.85} onPress={() => router.push(`/profile/${v.userId}`)}>
                  <View style={s.dot}><Ionicons name="person" size={14} color={colors.primary} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{v.name}</Text>
                    <Text style={s.sub}>{v.skillMatch} kỹ năng khớp · {v.hours}h · điểm {v.score}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
                </TouchableOpacity>
              ))}
            <Text style={[s.section, { marginTop: spacing.lg }]}>Nhà tài trợ gợi ý</Text>
            {sponsors.length === 0 ? <Text style={s.empty}>Chưa có gợi ý.</Text> :
              sponsors.map((sp) => (
                <View key={`s${sp.sponsorId}`} style={s.row}>
                  <View style={[s.dot, { backgroundColor: colors.accent50 }]}><Ionicons name="business" size={14} color={colors.accent} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{sp.name}</Text>
                    <Text style={s.sub}>Đã tài trợ {sp.pastInField} sự kiện cùng lĩnh vực</Text>
                  </View>
                </View>
              ))}
          </>
        )}
      </ScrollView>

      {/* Modal: donations của một chiến dịch (xác nhận quyên góp) */}
      <Modal visible={!!donationsOf} transparent animationType="slide" onRequestClose={() => setDonationsOf(null)}>
        <View style={s.overlay}>
          <View style={[s.modal, { maxHeight: '75%' }]}>
            <Text style={s.modalTitle}>Quyên góp — {donationsOf?.title}</Text>
            <ScrollView>
              {donations.length === 0 ? <Text style={s.empty}>Chưa có quyên góp nào.</Text> :
                donations.map((d) => (
                  <View key={d.id} style={s.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.name}>{d.isAnonymous ? 'Ẩn danh' : (d.displayName || d.userName || `User #${d.userId}`)}</Text>
                      <Text style={s.sub}>{money(d.amount)} · {d.status}</Text>
                    </View>
                    {d.status === 'PendingConfirmation' && (
                      <TouchableOpacity style={s.confirmBtn} onPress={() => act(async () => {
                        await supportCampaignApi.confirmDonation(d.id);
                        await openDonations(donationsOf);
                      }, 'Đã xác nhận quyên góp.')}>
                        <Text style={s.confirmText}>Xác nhận</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
            </ScrollView>
            <TouchableOpacity style={[s.mBtn, s.mCancel]} onPress={() => setDonationsOf(null)}>
              <Text style={{ color: colors.ink2, fontWeight: '600' }}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.canvas },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, paddingBottom: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  topTitle: { fontSize: 16, fontWeight: '600', color: colors.ink, flex: 1 },
  tabBar: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.sm, flexGrow: 0 },
  seg: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.surface2 },
  segActive: { backgroundColor: colors.primary },
  segText: { fontSize: 13, fontWeight: '600', color: colors.ink2 },
  segTextActive: { color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md, marginBottom: spacing.sm },
  dot: { width: 32, height: 32, borderRadius: 9, backgroundColor: colors.primary50, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 14.5, fontWeight: '600', color: colors.ink },
  sub: { fontSize: 12.5, color: colors.ink2, marginTop: 2 },
  confirmBtn: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7 },
  confirmText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  section: { fontSize: 13, fontWeight: '700', color: colors.ink2, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  empty: { color: colors.ink2, fontSize: 13.5, marginBottom: spacing.sm },
  addRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border2, borderRadius: radius.card, paddingVertical: 12 },
  addText: { color: colors.primary, fontWeight: '600', fontSize: 13.5 },
  inlineInput: { backgroundColor: colors.surface2, borderRadius: radius.input, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 14, color: colors.ink },
  campForm: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: spacing.md },
  mBtn: { paddingVertical: 12, borderRadius: radius.input, alignItems: 'center', marginTop: spacing.sm },
  mCancel: { backgroundColor: colors.surface2 },
});
