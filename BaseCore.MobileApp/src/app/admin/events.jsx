import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventApi } from '../../api/client';
import { colors, radius, spacing } from '../../theme';
import { formatDate } from '../../utils/format';

const REJECT_REASON = 'Hồ sơ sự kiện chưa đạt yêu cầu, vui lòng bổ sung thông tin.';

export default function AdminEvents() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await eventApi.getAll({ status: 'Pending', page: 1, pageSize: 50 });
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (fn, id, okMsg) => {
    try {
      await fn();
      Alert.alert('Thành công', okMsg);
      setItems((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không thực hiện được.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={[s.topbar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={24} color={colors.ink} /></TouchableOpacity>
        <Text style={s.topTitle}>Sự kiện chờ duyệt</Text>
      </View>
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} /> : (
        <FlatList
          data={items}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={{ padding: spacing.lg }}
          ListEmptyComponent={<Text style={s.empty}>Không có sự kiện nào chờ duyệt 🎉</Text>}
          renderItem={({ item }) => (
            <View style={s.card}>
              <Text style={s.name} numberOfLines={2}>{item.title}</Text>
              <Text style={s.sub}>{item.location || '—'} · {formatDate(item.startDate)}</Text>
              <View style={s.actions}>
                <TouchableOpacity style={[s.btn, s.approve]} onPress={() => act(() => eventApi.approve(item.id), item.id, 'Đã duyệt sự kiện.')}>
                  <Text style={s.btnText}>Duyệt</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btn, s.reject]} onPress={() => act(() => eventApi.reject(item.id, { reason: REJECT_REASON }), item.id, 'Đã từ chối.')}>
                  <Text style={[s.btnText, { color: colors.danger }]}>Từ chối</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, paddingBottom: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  topTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md, marginBottom: spacing.sm },
  name: { fontSize: 15, fontWeight: '600', color: colors.ink },
  sub: { fontSize: 12.5, color: colors.ink2, marginTop: 3 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  btn: { flex: 1, paddingVertical: 10, borderRadius: radius.input, alignItems: 'center' },
  approve: { backgroundColor: colors.primary },
  reject: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.danger },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  empty: { textAlign: 'center', color: colors.ink2, marginTop: spacing.xl },
});
