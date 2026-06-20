import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../api/client';
import { colors, radius, spacing } from '../../theme';

export default function AdminMonitoring() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getMonitoringSummary()
      .then((r) => setData(r.data || {}))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const render = (obj, prefix = '') => Object.entries(obj || {}).flatMap(([k, v]) => {
    if (v !== null && typeof v === 'object') return render(v, `${prefix}${k}.`);
    return [{ key: `${prefix}${k}`, value: String(v) }];
  });

  const rows = data ? render(data) : [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={[s.topbar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={24} color={colors.ink} /></TouchableOpacity>
        <Text style={s.topTitle}>Giám sát hệ thống</Text>
      </View>
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} /> : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          {rows.length === 0 ? <Text style={s.empty}>Không lấy được dữ liệu giám sát.</Text> :
            rows.map((r) => (
              <View key={r.key} style={s.row}>
                <Text style={s.key}>{r.key}</Text>
                <Text style={s.val} numberOfLines={1}>{r.value}</Text>
              </View>
            ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, paddingBottom: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  topTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, paddingHorizontal: spacing.md, paddingVertical: 10, marginBottom: 6 },
  key: { flex: 1, fontSize: 12.5, color: colors.ink2 },
  val: { fontSize: 13, fontWeight: '600', color: colors.ink, maxWidth: '50%' },
  empty: { textAlign: 'center', color: colors.ink2, marginTop: spacing.lg },
});
