import { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { sponsorProfileApi } from '../api/client';
import { colors, radius, spacing } from '../theme';

export default function SponsorProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [repName, setRepName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    sponsorProfileApi.get().then((r) => {
      const d = r.data || {};
      setIsVerified(!!d.isVerified);
      setOrgName(d.organizationName || '');
      setRepName(d.representativeName || '');
      setEmail(d.contactEmail || '');
      setPhone(d.phone || '');
      setWebsite(d.website || '');
      setDescription(d.description || '');
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await sponsorProfileApi.update({
        organizationName: orgName.trim(),
        representativeName: repName.trim(),
        contactEmail: email.trim(),
        phone: phone.trim(),
        website: website.trim(),
        description: description.trim(),
      });
      Alert.alert('Đã lưu', 'Hồ sơ nhà tài trợ đã được cập nhật.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e) {
      Alert.alert('Không lưu được', e?.response?.data?.message || 'Vui lòng thử lại.');
    } finally { setSaving(false); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={[s.topbar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={24} color={colors.ink} /></TouchableOpacity>
        <Text style={s.topTitle}>Hồ sơ nhà tài trợ</Text>
        {isVerified && (
          <View style={s.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={13} color={colors.success} />
            <Text style={s.verifiedText}>Đã xác minh</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <Field label="Tên tổ chức/doanh nghiệp"><TextInput style={s.input} value={orgName} onChangeText={setOrgName} /></Field>
        <Field label="Người đại diện"><TextInput style={s.input} value={repName} onChangeText={setRepName} /></Field>
        <Field label="Email liên hệ"><TextInput style={s.input} value={email} onChangeText={setEmail} autoCapitalize="none" /></Field>
        <Field label="Số điện thoại"><TextInput style={s.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" /></Field>
        <Field label="Website"><TextInput style={s.input} value={website} onChangeText={setWebsite} autoCapitalize="none" /></Field>
        <Field label="Giới thiệu"><TextInput style={[s.input, { height: 90, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} multiline /></Field>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
          <Text style={s.saveText}>{saving ? 'Đang lưu…' : 'Lưu hồ sơ'}</Text>
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
  topTitle: { fontSize: 16, fontWeight: '600', color: colors.ink, flex: 1 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.success + '18', borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 },
  verifiedText: { fontSize: 11, fontWeight: '700', color: colors.success },
  label: { fontSize: 13, fontWeight: '600', color: colors.ink2, marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border2, borderRadius: radius.input, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 14.5, color: colors.ink },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.input, paddingVertical: 15, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
