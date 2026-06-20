import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { adminApi } from '../../api/client';
import { colors, radius, spacing } from '../../theme';

const EXPORTS = [
  { key: 'events', label: 'Sự kiện', icon: 'calendar', fn: adminApi.exportEvents, file: 'events.csv' },
  { key: 'users', label: 'Người dùng', icon: 'people', fn: adminApi.exportUsers, file: 'users.csv' },
  { key: 'finance', label: 'Tài chính', icon: 'cash', fn: adminApi.exportFinance, file: 'finance.csv' },
];

export default function AdminExport() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [busy, setBusy] = useState(null);

  const doExport = async (exp) => {
    setBusy(exp.key);
    try {
      const { data } = await exp.fn();
      const csv = typeof data === 'string' ? data : JSON.stringify(data);
      const path = `${FileSystem.cacheDirectory}${exp.file}`;
      await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: `Xuất ${exp.label}` });
      } else {
        Alert.alert('Đã lưu', `File tại: ${path}`);
      }
    } catch (e) {
      Alert.alert('Không xuất được', e?.response?.data?.message || 'Vui lòng thử lại.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={[s.topbar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={24} color={colors.ink} /></TouchableOpacity>
        <Text style={s.topTitle}>Xuất dữ liệu (CSV)</Text>
      </View>

      <View style={{ padding: spacing.lg }}>
        <Text style={s.hint}>Xuất file CSV rồi chia sẻ qua email/Drive/Zalo…</Text>
        {EXPORTS.map((exp) => (
          <TouchableOpacity key={exp.key} style={s.row} activeOpacity={0.85} onPress={() => doExport(exp)} disabled={!!busy}>
            <View style={s.dot}><Ionicons name={exp.icon} size={17} color={colors.primary} /></View>
            <Text style={s.label}>{exp.label}</Text>
            {busy === exp.key ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="share-outline" size={18} color={colors.ink3} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, paddingBottom: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  topTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  hint: { fontSize: 13, color: colors.ink2, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md, marginBottom: spacing.sm },
  dot: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.primary50, justifyContent: 'center', alignItems: 'center' },
  label: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.ink },
});
