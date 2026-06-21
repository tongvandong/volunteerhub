import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../api/client';
import { colors, radius, spacing } from '../../theme';

const REJECT_REASON = 'Hồ sơ tổ chức chưa đạt yêu cầu, vui lòng bổ sung tài liệu.';

export default function AdminOrganizers() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getOrganizerVerifications({ status: 'PendingVerification' });
      const arr = Array.isArray(data) ? data : (data?.items || []);
      setItems(arr.filter((x) => x.status === 'PendingVerification'));
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
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không thực hiện được.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={[s.topbar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={24} color={colors.ink} /></TouchableOpacity>
        <Text style={s.topTitle}>Tổ chức chờ xác minh</Text>
      </View>
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} /> : (
        <FlatList
          data={items}
          keyExtractor={(x) => String(x.id)}
          contentContainerStyle={{ padding: spacing.lg }}
          ListEmptyComponent={<Text style={s.empty}>Không có hồ sơ nào chờ xác minh 🎉</Text>}
          renderItem={({ item }) => (
            <View style={s.card}>
              <Text style={s.name}>{item.organizationName || item.representativeName || `Hồ sơ #${item.id}`}</Text>
              {!!item.contactEmail && <Text style={s.sub}>{item.contactEmail}</Text>}
              <View style={s.actions}>
                <TouchableOpacity style={[s.btn, s.approve]} onPress={() => act(() => adminApi.approveOrganizerVerification(item.id), item.id, 'Đã xác minh tổ chức.')}>
                  <Text style={s.btnText}>Duyệt</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btn, s.reject]} onPress={() => act(() => adminApi.rejectOrganizerVerification(item.id, { reason: REJECT_REASON }), item.id, 'Đã từ chối.')}>
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
