import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing } from '../theme';

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('demo.vol01');
  const [password, setPassword] = useState('demo123');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!username.trim() || !password) return;
    setBusy(true);
    try {
      const u = await login(username.trim(), password);
      const home = u?.userType === 1 ? '/o'
        : u?.userType === 2 ? '/s'
        : u?.userType === 3 ? '/a'
        : '/v';
      router.replace(home);
    } catch (e) {
      Alert.alert('Đăng nhập thất bại', e?.response?.data?.message || 'Sai tài khoản hoặc mật khẩu, hoặc không kết nối được máy chủ.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.container}>
      <View style={s.brandDot} />
      <Text style={s.title}>VolunteerHub</Text>
      <Text style={s.sub}>Đăng nhập để tiếp tục</Text>

      <TextInput
        style={s.input}
        placeholder="Tên đăng nhập"
        placeholderTextColor={colors.ink3}
        autoCapitalize="none"
        autoCorrect={false}
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={s.input}
        placeholder="Mật khẩu"
        placeholderTextColor={colors.ink3}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={[s.btn, busy && { opacity: 0.6 }]} onPress={onSubmit} disabled={busy} activeOpacity={0.85}>
        <Text style={s.btnText}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/register')} style={{ marginTop: spacing.md }}>
        <Text style={s.registerLink}>Chưa có tài khoản? Đăng ký ngay</Text>
      </TouchableOpacity>

      <Text style={s.hint}>Demo: demo.vol01 / demo123</Text>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, backgroundColor: colors.canvas },
  brandDot: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.accent, marginBottom: spacing.md },
  title: { fontSize: 30, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  sub: { fontSize: 15, color: colors.ink2, marginTop: 4, marginBottom: spacing.lg },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border2,
    borderRadius: radius.input, paddingHorizontal: spacing.md, paddingVertical: 14,
    fontSize: 15, color: colors.ink, marginBottom: spacing.sm,
  },
  btn: {
    backgroundColor: colors.primary, borderRadius: radius.input, paddingVertical: 15,
    alignItems: 'center', marginTop: spacing.sm,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  registerLink: { textAlign: 'center', color: colors.primary, fontSize: 14, fontWeight: '500' },
  hint: { textAlign: 'center', color: colors.ink3, fontSize: 12.5, marginTop: spacing.md },
});
