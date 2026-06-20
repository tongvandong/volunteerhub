import { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventApi } from '../../../api/client';
import { colors, radius, spacing } from '../../../theme';

export default function EditEvent() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ev, setEv] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');

  useEffect(() => {
    eventApi.getById(id).then((r) => {
      const e = r.data;
      setEv(e);
      setTitle(e.title || '');
      setDescription(e.description || '');
      setLocation(e.location || '');
      setMaxParticipants(String(e.maxParticipants ?? ''));
    }).catch(() => setEv(null)).finally(() => setLoading(false));
  }, [id]);

  const save = async () => {
    if (!title.trim() || !location.trim()) return Alert.alert('Thiếu thông tin', 'Tên và địa điểm là bắt buộc.');
    setSaving(true);
    try {
      await eventApi.update(id, {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        maxParticipants: parseInt(maxParticipants, 10) || ev.maxParticipants,
        categoryId: ev.categoryId,
        startDate: ev.startDate,
        endDate: ev.endDate,
        requiresKyc: ev.requiresKyc,
        requiresInterview: ev.requiresInterview,
        requiredSkillIds: ev.requiredSkillIds,
      });
      Alert.alert('Đã lưu', 'Sự kiện đã được cập nhật. Lưu ý: đổi tên/mô tả có thể cần admin duyệt lại.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Không lưu được', e?.response?.data?.message || 'Vui lòng thử lại.');
    } finally { setSaving(false); }
  };

  const cancelEvent = () => {
    Alert.alert('Huỷ sự kiện?', 'Hành động này sẽ huỷ sự kiện và thông báo tới người đăng ký.', [
      { text: 'Không', style: 'cancel' },
      { text: 'Huỷ sự kiện', style: 'destructive', onPress: async () => {
        try {
          await eventApi.cancel(id, 'Ban tổ chức huỷ sự kiện.');
          Alert.alert('Đã huỷ', 'Sự kiện đã được huỷ.', [{ text: 'OK', onPress: () => router.back() }]);
        } catch (e) {
          Alert.alert('Không huỷ được', e?.response?.data?.message || 'Vui lòng thử lại.');
        }
      } },
    ]);
  };

  const completeEvent = () => {
    Alert.alert('Hoàn thành sự kiện?', 'Xác nhận sự kiện đã kết thúc và chốt giờ công.', [
      { text: 'Không', style: 'cancel' },
      { text: 'Hoàn thành', onPress: async () => {
        try {
          await eventApi.complete(id);
          Alert.alert('Đã hoàn thành', 'Sự kiện được đánh dấu hoàn thành.', [{ text: 'OK', onPress: () => router.back() }]);
        } catch (e) {
          Alert.alert('Không hoàn thành được', e?.response?.data?.message || 'Sự kiện có thể chưa kết thúc.');
        }
      } },
    ]);
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  if (!ev) return <View style={s.center}><Text style={{ color: colors.ink2 }}>Không tìm thấy sự kiện.</Text></View>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={[s.topbar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={24} color={colors.ink} /></TouchableOpacity>
        <Text style={s.topTitle}>Sửa sự kiện</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <Field label="Tên sự kiện *"><TextInput style={s.input} value={title} onChangeText={setTitle} /></Field>
        <Field label="Mô tả"><TextInput style={[s.input, { height: 90, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} multiline /></Field>
        <Field label="Địa điểm *"><TextInput style={s.input} value={location} onChangeText={setLocation} /></Field>
        <Field label="Số người tối đa"><TextInput style={s.input} value={maxParticipants} onChangeText={setMaxParticipants} keyboardType="numeric" /></Field>

        {ev.status === 'Approved' && (
          <TouchableOpacity style={[s.actBtn, { borderColor: colors.success }]} onPress={completeEvent}>
            <Ionicons name="checkmark-done" size={17} color={colors.success} />
            <Text style={[s.actText, { color: colors.success }]}>Đánh dấu hoàn thành</Text>
          </TouchableOpacity>
        )}
        {(ev.status === 'Approved' || ev.status === 'Pending') && (
          <TouchableOpacity style={[s.actBtn, { borderColor: colors.danger }]} onPress={cancelEvent}>
            <Ionicons name="close-circle" size={17} color={colors.danger} />
            <Text style={[s.actText, { color: colors.danger }]}>Huỷ sự kiện</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
          <Text style={s.saveText}>{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Field({ label, children }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={s.label}>{label}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.canvas },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, paddingBottom: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  topTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  label: { fontSize: 13, fontWeight: '600', color: colors.ink2, marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border2, borderRadius: radius.input, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 14.5, color: colors.ink },
  actBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: radius.input, paddingVertical: 12, marginTop: spacing.sm, backgroundColor: colors.surface },
  actText: { fontWeight: '600', fontSize: 14.5 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.input, paddingVertical: 15, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
