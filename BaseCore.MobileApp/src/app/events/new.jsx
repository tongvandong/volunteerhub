import { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { eventApi, eventCategoryApi, skillApi } from '../../api/client';
import { colors, radius, spacing } from '../../theme';
import { formatDateTime } from '../../utils/format';

export default function NewEvent() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [cats, setCats] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [maxParticipants, setMaxParticipants] = useState('30');
  const [durationHours, setDurationHours] = useState('4');
  const [requiresKyc, setRequiresKyc] = useState(false);
  const [requiresInterview, setRequiresInterview] = useState(false);
  const [skillIds, setSkillIds] = useState([]);
  const [coords, setCoords] = useState(null);

  const initial = new Date(Date.now() + 24 * 3600 * 1000);
  const [start, setStart] = useState(initial);
  const [picker, setPicker] = useState(null); // 'date' | 'time' | null

  useEffect(() => {
    Promise.all([
      eventCategoryApi.getAll().catch(() => ({ data: [] })),
      skillApi.getAll().catch(() => ({ data: [] })),
    ]).then(([c, s]) => {
      const cArr = Array.isArray(c.data) ? c.data : (c.data?.items || []);
      const sArr = Array.isArray(s.data) ? s.data : (s.data?.items || []);
      setCats(cArr);
      setSkills(sArr);
      if (cArr[0]) setCategoryId(cArr[0].id);
    }).finally(() => setLoading(false));
  }, []);

  const onPick = (event, selected) => {
    if (event.type === 'dismissed' || !selected) { setPicker(null); return; }
    if (picker === 'date') {
      const d = new Date(start);
      d.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setStart(d);
      setPicker('time'); // chọn giờ tiếp
    } else {
      const d = new Date(start);
      d.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setStart(d);
      setPicker(null);
    }
  };

  const useCurrentLocation = async () => {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') { Alert.alert('Thiếu quyền', 'Cần quyền vị trí.'); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch { Alert.alert('Lỗi', 'Không lấy được vị trí.'); }
  };

  const toggleSkill = (id) => setSkillIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const submit = async () => {
    if (!title.trim()) return Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên sự kiện.');
    if (!location.trim()) return Alert.alert('Thiếu thông tin', 'Vui lòng nhập địa điểm.');
    if (!categoryId) return Alert.alert('Thiếu thông tin', 'Vui lòng chọn lĩnh vực.');
    const max = parseInt(maxParticipants, 10);
    if (!max || max < 1) return Alert.alert('Thiếu thông tin', 'Số người tối đa không hợp lệ.');
    const hours = parseFloat(durationHours) || 4;
    const end = new Date(start.getTime() + hours * 3600 * 1000);

    setSaving(true);
    try {
      await eventApi.create({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        categoryId,
        maxParticipants: max,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        requiresKyc,
        requiresInterview,
        requiredSkillIds: JSON.stringify(skillIds),
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
      Alert.alert('Thành công', 'Đã tạo sự kiện. Sự kiện chờ admin duyệt.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Không tạo được', e?.response?.data?.message || 'Vui lòng kiểm tra lại thông tin.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={[s.topbar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}><Ionicons name="close" size={24} color={colors.ink} /></TouchableOpacity>
        <Text style={s.topTitle}>Tạo sự kiện</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <Field label="Tên sự kiện *"><TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="VD: Ngày hội trồng cây" placeholderTextColor={colors.ink3} /></Field>
        <Field label="Mô tả"><TextInput style={[s.input, { height: 90, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} multiline placeholder="Mô tả ngắn về sự kiện" placeholderTextColor={colors.ink3} /></Field>
        <Field label="Địa điểm *"><TextInput style={s.input} value={location} onChangeText={setLocation} placeholder="VD: Công viên Thống Nhất, Hà Nội" placeholderTextColor={colors.ink3} /></Field>

        <Field label="Lĩnh vực *">
          <View style={s.chips}>
            {cats.map((c) => (
              <TouchableOpacity key={c.id} style={[s.chip, categoryId === c.id && s.chipActive]} onPress={() => setCategoryId(c.id)}>
                <Text style={[s.chipText, categoryId === c.id && s.chipTextActive]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label="Thời gian bắt đầu *">
          <TouchableOpacity style={s.input} onPress={() => setPicker('date')}>
            <Text style={{ color: colors.ink, fontSize: 14.5 }}>{formatDateTime(start)}</Text>
          </TouchableOpacity>
        </Field>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Field label="Thời lượng (giờ)" style={{ flex: 1 }}><TextInput style={s.input} value={durationHours} onChangeText={setDurationHours} keyboardType="numeric" /></Field>
          <Field label="Số người tối đa *" style={{ flex: 1 }}><TextInput style={s.input} value={maxParticipants} onChangeText={setMaxParticipants} keyboardType="numeric" /></Field>
        </View>

        <Field label="Kỹ năng yêu cầu">
          <View style={s.chips}>
            {skills.map((sk) => (
              <TouchableOpacity key={sk.id} style={[s.chip, skillIds.includes(sk.id) && s.chipActive]} onPress={() => toggleSkill(sk.id)}>
                <Text style={[s.chipText, skillIds.includes(sk.id) && s.chipTextActive]}>{sk.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <TouchableOpacity style={s.locBtn} onPress={useCurrentLocation}>
          <Ionicons name="location" size={16} color={colors.primary} />
          <Text style={s.locText}>{coords ? `Đã đặt vị trí (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})` : 'Dùng vị trí hiện tại (tuỳ chọn)'}</Text>
        </TouchableOpacity>

        <View style={s.switchRow}>
          <Text style={s.switchLabel}>Yêu cầu KYC</Text>
          <Switch value={requiresKyc} onValueChange={setRequiresKyc} trackColor={{ true: colors.primary }} />
        </View>
        <View style={s.switchRow}>
          <Text style={s.switchLabel}>Yêu cầu phỏng vấn</Text>
          <Switch value={requiresInterview} onValueChange={setRequiresInterview} trackColor={{ true: colors.primary }} />
        </View>
      </ScrollView>

      {picker && (
        <DateTimePicker
          value={start}
          mode={picker}
          is24Hour
          onChange={onPick}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        />
      )}

      <View style={[s.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TouchableOpacity style={[s.submit, saving && { opacity: 0.6 }]} onPress={submit} disabled={saving}>
          <Text style={s.submitText}>{saving ? 'Đang tạo…' : 'Tạo sự kiện'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Field({ label, children, style }) {
  return (
    <View style={[{ marginBottom: spacing.md }, style]}>
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
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border2, borderRadius: radius.input, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 14.5, color: colors.ink, justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.surface2, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: 'transparent' },
  chipActive: { backgroundColor: colors.primary50, borderColor: colors.primary },
  chipText: { fontSize: 12.5, color: colors.ink2 },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
  locBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, marginBottom: spacing.sm },
  locText: { color: colors.primary, fontSize: 13.5, fontWeight: '500' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, paddingHorizontal: spacing.md, paddingVertical: 10, marginBottom: spacing.sm },
  switchLabel: { fontSize: 14, color: colors.ink },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  submit: { backgroundColor: colors.primary, borderRadius: radius.input, paddingVertical: 15, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
