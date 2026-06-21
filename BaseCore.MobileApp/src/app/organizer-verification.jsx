import { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { organizerVerificationApi, uploadApi } from '../api/client';
import { colors, radius, spacing } from '../theme';

const STATUS_LABEL = { Verified: ['Đã xác minh', colors.success], PendingVerification: ['Chờ admin duyệt', colors.accent], Unverified: ['Chưa xác minh', colors.ink3], Rejected: ['Bị từ chối', colors.danger], ChangesRequested: ['Cần bổ sung', colors.accent] };

export default function OrganizerVerification() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('Unverified');
  const [orgName, setOrgName] = useState('');
  const [repName, setRepName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');

  useEffect(() => {
    organizerVerificationApi.getMine().then((r) => {
      const d = r.data || {};
      setStatus(d.status || 'Unverified');
      setOrgName(d.organizationName || '');
      setRepName(d.representativeName || '');
      setEmail(d.contactEmail || '');
      setPhone(d.phone || '');
      setAddress(d.address || '');
      setDescription(d.description || '');
      setDocumentUrl(d.documentUrl || '');
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const pickDocument = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (res.canceled || !res.assets?.[0]) return;
      const { data } = await uploadApi.uploadImage(res.assets[0]);
      setDocumentUrl(data?.url || data?.path || data?.imageUrl || '');
    } catch (e) {
      Alert.alert('Lỗi', 'Không tải được tài liệu lên.');
    }
  };

  const submit = async () => {
    if (!orgName.trim()) return Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên tổ chức.');
    setSaving(true);
    try {
      await organizerVerificationApi.submit({
        organizationName: orgName.trim(),
        representativeName: repName.trim(),
        contactEmail: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        description: description.trim(),
        documentUrl,
        commitmentAccepted: true,
      });
      setStatus('PendingVerification');
      Alert.alert('Đã nộp', 'Hồ sơ tổ chức đang chờ admin duyệt.');
    } catch (e) {
      Alert.alert('Không nộp được', e?.response?.data?.message || 'Vui lòng thử lại.');
    } finally { setSaving(false); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>;

  const [stLabel, stColor] = STATUS_LABEL[status] || [status, colors.ink3];
  const locked = status === 'Verified' || status === 'PendingVerification';

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={[s.topbar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={24} color={colors.ink} /></TouchableOpacity>
        <Text style={s.topTitle}>Hồ sơ tổ chức</Text>
        <View style={[s.statusBadge, { backgroundColor: stColor + '22' }]}>
          <Text style={[s.statusText, { color: stColor }]}>{stLabel}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <Field label="Tên tổ chức *"><TextInput style={s.input} value={orgName} onChangeText={setOrgName} editable={!locked} /></Field>
        <Field label="Người đại diện"><TextInput style={s.input} value={repName} onChangeText={setRepName} editable={!locked} /></Field>
        <Field label="Email liên hệ"><TextInput style={s.input} value={email} onChangeText={setEmail} autoCapitalize="none" editable={!locked} /></Field>
        <Field label="Số điện thoại"><TextInput style={s.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" editable={!locked} /></Field>
        <Field label="Địa chỉ"><TextInput style={s.input} value={address} onChangeText={setAddress} editable={!locked} /></Field>
        <Field label="Giới thiệu"><TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} multiline editable={!locked} /></Field>

        {!locked && (
          <TouchableOpacity style={s.docBtn} onPress={pickDocument}>
            <Ionicons name={documentUrl ? 'checkmark-circle' : 'cloud-upload-outline'} size={18} color={documentUrl ? colors.success : colors.primary} />
            <Text style={[s.docText, documentUrl && { color: colors.success }]}>
              {documentUrl ? 'Đã tải tài liệu minh chứng' : 'Tải ảnh tài liệu minh chứng (giấy phép…)'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {!locked && (
        <View style={[s.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={submit} disabled={saving}>
            <Text style={s.saveText}>{saving ? 'Đang nộp…' : 'Nộp hồ sơ xác minh'}</Text>
          </TouchableOpacity>
        </View>
      )}
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
  topTitle: { fontSize: 16, fontWeight: '600', color: colors.ink, flex: 1 },
  statusBadge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11.5, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', color: colors.ink2, marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border2, borderRadius: radius.input, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 14.5, color: colors.ink },
  docBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border2, borderRadius: radius.card, paddingVertical: 14, backgroundColor: colors.surface },
  docText: { color: colors.primary, fontWeight: '600', fontSize: 13.5 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.input, paddingVertical: 15, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
