import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { authApi } from '../api/client';
import { colors, radius, spacing } from '../theme';

const ROLES = [
  { type: 0, label: 'Tình nguyện viên' },
  { type: 1, label: 'Tổ chức' },
  { type: 2, label: 'Nhà tài trợ' },
];

export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [userType, setUserType] = useState(0);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!username.trim() || !password) return Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên đăng nhập và mật khẩu.');
    if (password.length < 6) return Alert.alert('Mật khẩu yếu', 'Mật khẩu cần ít nhất 6 ký tự.');
    if (password !== confirm) return Alert.alert('Sai xác nhận', 'Mật khẩu nhập lại không khớp.');
    setBusy(true);
    try {
      await authApi.register({
        username: username.trim(),
        name: name.trim() || username.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        userType,
      });
      Alert.alert('Thành công', 'Tạo tài khoản thành công. Hãy đăng nhập.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Không đăng ký được', e?.response?.data?.message || 'Tên đăng nhập/email có thể đã tồn tại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.title}>Tạo tài khoản</Text>
        <Text style={s.sub}>Tham gia cộng đồng VolunteerHub</Text>

        <View style={s.roleRow}>
          {ROLES.map((r) => (
            <TouchableOpacity key={r.type} style={[s.roleChip, userType === r.type && s.roleActive]} onPress={() => setUserType(r.type)}>
              <Text style={[s.roleText, userType === r.type && s.roleTextActive]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput style={s.input} placeholder="Tên đăng nhập *" placeholderTextColor={colors.ink3} autoCapitalize="none" value={username} onChangeText={setUsername} />
        <TextInput style={s.input} placeholder="Họ tên" placeholderTextColor={colors.ink3} value={name} onChangeText={setName} />
        <TextInput style={s.input} placeholder="Email" placeholderTextColor={colors.ink3} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={s.input} placeholder="Số điện thoại" placeholderTextColor={colors.ink3} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <TextInput style={s.input} placeholder="Mật khẩu *" placeholderTextColor={colors.ink3} secureTextEntry value={password} onChangeText={setPassword} />
        <TextInput style={s.input} placeholder="Nhập lại mật khẩu *" placeholderTextColor={colors.ink3} secureTextEntry value={confirm} onChangeText={setConfirm} />

        <TouchableOpacity style={[s.btn, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy} activeOpacity={0.85}>
          <Text style={s.btnText}>{busy ? 'Đang tạo…' : 'Đăng ký'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: spacing.md }}>
          <Text style={s.link}>Đã có tài khoản? Đăng nhập</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { padding: spacing.lg, paddingTop: 80 },
  title: { fontSize: 28, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  sub: { fontSize: 14.5, color: colors.ink2, marginTop: 4, marginBottom: spacing.lg },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  roleChip: { flex: 1, paddingVertical: 10, borderRadius: radius.pill, alignItems: 'center', backgroundColor: colors.surface2, borderWidth: 1, borderColor: 'transparent' },
  roleActive: { backgroundColor: colors.primary50, borderColor: colors.primary },
  roleText: { fontSize: 12.5, color: colors.ink2, fontWeight: '500' },
  roleTextActive: { color: colors.primary, fontWeight: '700' },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border2, borderRadius: radius.input, paddingHorizontal: spacing.md, paddingVertical: 13, fontSize: 15, color: colors.ink, marginBottom: spacing.sm },
  btn: { backgroundColor: colors.primary, borderRadius: radius.input, paddingVertical: 15, alignItems: 'center', marginTop: spacing.sm },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', color: colors.primary, fontSize: 14, fontWeight: '500' },
});
