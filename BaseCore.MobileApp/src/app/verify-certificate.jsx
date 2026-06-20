import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { certificateApi } from '../api/client';
import { colors, radius, spacing } from '../theme';
import { formatDate } from '../utils/format';

export default function VerifyCertificate() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { ok, cert?, message? }

  const verify = async () => {
    if (!code.trim()) return;
    setBusy(true); setResult(null);
    try {
      const { data } = await certificateApi.verify(code.trim());
      setResult({ ok: true, cert: data });
    } catch (e) {
      setResult({ ok: false, message: e?.response?.status === 404 ? 'Không tìm thấy chứng chỉ với mã này.' : 'Không tra cứu được, thử lại.' });
    } finally { setBusy(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={[s.topbar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={24} color={colors.ink} /></TouchableOpacity>
        <Text style={s.topTitle}>Tra cứu chứng chỉ</Text>
      </View>

      <View style={{ padding: spacing.lg }}>
        <Text style={s.hint}>Nhập mã chứng chỉ (in trên PDF hoặc quét từ QR) để xác thực.</Text>
        <TextInput
          style={s.input}
          placeholder="VD: CERT-ABC123"
          placeholderTextColor={colors.ink3}
          autoCapitalize="characters"
          value={code}
          onChangeText={setCode}
        />
        <TouchableOpacity style={[s.btn, busy && { opacity: 0.6 }]} onPress={verify} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Tra cứu</Text>}
        </TouchableOpacity>

        {result && (
          <View style={[s.result, { borderColor: result.ok ? colors.success : colors.danger }]}>
            <Ionicons name={result.ok ? 'checkmark-circle' : 'close-circle'} size={22} color={result.ok ? colors.success : colors.danger} />
            {result.ok ? (
              <View style={{ flex: 1 }}>
                <Text style={[s.resultTitle, { color: colors.success }]}>Chứng chỉ hợp lệ</Text>
                <Text style={s.resultLine}>Tình nguyện viên: {result.cert.volunteerName || result.cert.userName || '—'}</Text>
                <Text style={s.resultLine}>Sự kiện: {result.cert.eventTitle || '—'}</Text>
                <Text style={s.resultLine}>Giờ công: {result.cert.volunteerHours ?? '—'}h · Cấp ngày {formatDate(result.cert.issuedAt)}</Text>
              </View>
            ) : (
              <Text style={[s.resultTitle, { color: colors.danger, flex: 1 }]}>{result.message}</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, paddingBottom: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  topTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  hint: { fontSize: 13.5, color: colors.ink2, marginBottom: spacing.md },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border2, borderRadius: radius.input, paddingHorizontal: spacing.md, paddingVertical: 13, fontSize: 15, color: colors.ink, marginBottom: spacing.sm },
  btn: { backgroundColor: colors.primary, borderRadius: radius.input, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 15.5, fontWeight: '600' },
  result: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderRadius: radius.card, padding: spacing.md, marginTop: spacing.lg },
  resultTitle: { fontSize: 14.5, fontWeight: '700' },
  resultLine: { fontSize: 13, color: colors.ink2, marginTop: 3 },
});
