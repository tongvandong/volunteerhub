import { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { profileApi, profileSkillApi, skillApi, uploadApi, ORIGIN } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing } from '../theme';

const KYC_LABEL = { Verified: 'Đã xác minh', PendingVerification: 'Chờ xác minh', Unverified: 'Chưa xác minh', Rejected: 'Bị từ chối' };

async function pickAndUpload() {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
  if (res.canceled || !res.assets?.[0]) return null;
  const { data } = await uploadApi.uploadImage(res.assets[0]);
  return data?.url || data?.path || data?.imageUrl || null;
}

export default function EditProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, updateLocalUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [kycStatus, setKycStatus] = useState('Unverified');
  const [mySkills, setMySkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [kycBusy, setKycBusy] = useState(false);

  const load = async () => {
    try {
      const [{ data }, skillsRes] = await Promise.all([
        profileApi.getMyProfile(),
        skillApi.getAll().catch(() => ({ data: [] })),
      ]);
      const p = data?.profile || {};
      setName(data?.user?.name ?? user?.name ?? '');
      setPhone(data?.user?.phone ?? user?.phone ?? '');
      setBio(p.bio || '');
      setInterests(p.interests || '');
      setAvatarUrl(p.avatarUrl || '');
      setKycStatus(p.kycStatus || 'Unverified');
      setMySkills(data?.volunteerSkills || data?.skills || []);
      setAllSkills(Array.isArray(skillsRes.data) ? skillsRes.data : (skillsRes.data?.items || []));
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const changeAvatar = async () => {
    try {
      const url = await pickAndUpload();
      if (url) setAvatarUrl(url);
    } catch (e) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không tải được ảnh lên.');
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await profileApi.updateProfile({ name: name.trim(), phone: phone.trim(), bio: bio.trim(), interests: interests.trim(), avatarUrl });
      if (updateLocalUser) updateLocalUser({ name: name.trim(), phone: phone.trim() });
      Alert.alert('Đã lưu', 'Hồ sơ đã được cập nhật.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e) {
      Alert.alert('Không lưu được', e?.response?.data?.message || 'Vui lòng thử lại.');
    } finally { setSaving(false); }
  };

  const mySkillIds = new Set(mySkills.map((x) => x.skillId ?? x.id));
  const toggleSkill = async (sk) => {
    try {
      if (mySkillIds.has(sk.id)) {
        await profileSkillApi.remove(sk.id);
        setMySkills((prev) => prev.filter((x) => (x.skillId ?? x.id) !== sk.id));
      } else {
        await profileSkillApi.add({ skillId: sk.id, level: 'Beginner' });
        setMySkills((prev) => [...prev, { skillId: sk.id, skillName: sk.name }]);
      }
    } catch (e) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không cập nhật được kỹ năng.');
    }
  };

  const submitKyc = async () => {
    setKycBusy(true);
    try {
      Alert.alert('Nộp KYC', 'Lần lượt chọn 3 ảnh: CCCD mặt trước → mặt sau → chân dung.', [
        { text: 'Bắt đầu', onPress: async () => {
          try {
            const front = await pickAndUpload(); if (!front) return setKycBusy(false);
            const back = await pickAndUpload(); if (!back) return setKycBusy(false);
            const portrait = await pickAndUpload(); if (!portrait) return setKycBusy(false);
            await profileApi.submitKyc({ identityFrontImageUrl: front, identityBackImageUrl: back, portraitImageUrl: portrait });
            setKycStatus('PendingVerification');
            Alert.alert('Đã nộp', 'Hồ sơ KYC đang chờ admin duyệt.');
          } catch (e) {
            Alert.alert('Không nộp được', e?.response?.data?.message || 'Vui lòng thử lại.');
          } finally { setKycBusy(false); }
        } },
        { text: 'Huỷ', style: 'cancel', onPress: () => setKycBusy(false) },
      ]);
    } catch { setKycBusy(false); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>;

  const avatarSrc = avatarUrl ? { uri: avatarUrl.startsWith('http') ? avatarUrl : `${ORIGIN}${avatarUrl}` } : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={[s.topbar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={24} color={colors.ink} /></TouchableOpacity>
        <Text style={s.topTitle}>Chỉnh sửa hồ sơ</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        {/* Avatar */}
        <TouchableOpacity style={s.avatarWrap} onPress={changeAvatar} activeOpacity={0.85}>
          {avatarSrc ? <Image source={avatarSrc} style={s.avatar} /> : (
            <View style={[s.avatar, s.avatarEmpty]}><Ionicons name="person" size={34} color={colors.primary} /></View>
          )}
          <View style={s.camBadge}><Ionicons name="camera" size={13} color="#fff" /></View>
        </TouchableOpacity>

        <Field label="Họ tên"><TextInput style={s.input} value={name} onChangeText={setName} /></Field>
        <Field label="Số điện thoại"><TextInput style={s.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" /></Field>
        <Field label="Giới thiệu (bio)"><TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} value={bio} onChangeText={setBio} multiline /></Field>
        <Field label="Sở thích (phân cách bằng dấu phẩy)"><TextInput style={s.input} value={interests} onChangeText={setInterests} /></Field>

        {user?.userType === 0 && (
          <>
            <Field label="Kỹ năng (chạm để thêm/bỏ)">
              <View style={s.chips}>
                {allSkills.map((sk) => {
                  const active = mySkillIds.has(sk.id);
                  return (
                    <TouchableOpacity key={sk.id} style={[s.chip, active && s.chipActive]} onPress={() => toggleSkill(sk)}>
                      <Text style={[s.chipText, active && s.chipTextActive]}>{sk.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Field>

            <View style={s.kycRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.kycLabel}>Xác minh danh tính (KYC)</Text>
                <Text style={s.kycStatus}>{KYC_LABEL[kycStatus] || kycStatus}</Text>
              </View>
              {kycStatus !== 'Verified' && kycStatus !== 'PendingVerification' && (
                <TouchableOpacity style={[s.kycBtn, kycBusy && { opacity: 0.6 }]} onPress={submitKyc} disabled={kycBusy}>
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Nộp KYC</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
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
  topTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  avatarWrap: { alignSelf: 'center', marginBottom: spacing.lg },
  avatar: { width: 92, height: 92, borderRadius: 46 },
  avatarEmpty: { backgroundColor: colors.primary50, justifyContent: 'center', alignItems: 'center' },
  camBadge: { position: 'absolute', right: 0, bottom: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.canvas },
  label: { fontSize: 13, fontWeight: '600', color: colors.ink2, marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border2, borderRadius: radius.input, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 14.5, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.surface2, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: 'transparent' },
  chipActive: { backgroundColor: colors.primary50, borderColor: colors.primary },
  chipText: { fontSize: 12.5, color: colors.ink2 },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
  kycRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md, marginTop: spacing.sm },
  kycLabel: { fontSize: 14, fontWeight: '600', color: colors.ink },
  kycStatus: { fontSize: 12.5, color: colors.ink2, marginTop: 2 },
  kycBtn: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.input, paddingVertical: 15, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
