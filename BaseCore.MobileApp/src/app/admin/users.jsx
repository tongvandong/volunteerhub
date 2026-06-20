import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../api/client';
import { colors, radius, spacing } from '../../theme';

const ROLE = { 0: 'TNV', 1: 'Tổ chức', 2: 'Nhà tài trợ', 3: 'Admin' };

export default function AdminUsers() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getUsers({ page: 1, pageSize: 50 });
      setItems(Array.isArray(data) ? data : (data?.items || []));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (u) => {
    try {
      await adminApi.toggleUserStatus(u.id);
      setItems((prev) => prev.map((x) => (x.id === u.id ? { ...x, isActive: !x.isActive } : x)));
    } catch (e) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không đổi được trạng thái.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={[s.topbar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={24} color={colors.ink} /></TouchableOpacity>
        <Text style={s.topTitle}>Người dùng</Text>
      </View>
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} /> : (
        <FlatList
          data={items}
          keyExtractor={(u) => String(u.id)}
          contentContainerStyle={{ padding: spacing.lg }}
          ListEmptyComponent={<Text style={s.empty}>Không có người dùng.</Text>}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={{ flex: 1 }}>
                <Text style={s.name} numberOfLines={1}>{item.name || item.userName}</Text>
                <Text style={s.sub}>@{item.userName} · {ROLE[item.userType] ?? '—'}</Text>
              </View>
              <TouchableOpacity
                style={[s.toggle, { backgroundColor: item.isActive ? colors.success + '22' : colors.ink3 + '22' }]}
                onPress={() => toggle(item)}
              >
                <Text style={[s.toggleText, { color: item.isActive ? colors.success : colors.ink3 }]}>
                  {item.isActive ? 'Đang hoạt động' : 'Đã khoá'}
                </Text>
              </TouchableOpacity>
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
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md, marginBottom: spacing.sm },
  name: { fontSize: 14.5, fontWeight: '600', color: colors.ink },
  sub: { fontSize: 12.5, color: colors.ink2, marginTop: 2 },
  toggle: { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  toggleText: { fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', color: colors.ink2, marginTop: spacing.xl },
});
