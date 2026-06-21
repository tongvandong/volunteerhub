import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { notificationApi } from '../api/client';
import { colors, radius, spacing } from '../theme';
import { formatDateTime } from '../utils/format';

export default function Notifications() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await notificationApi.getAll();
      setItems(Array.isArray(data) ? data : (data?.items || []));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onTap = async (n) => {
    if (!n.isRead) {
      try { await notificationApi.markRead(n.id); } catch {}
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    }
  };

  const markAll = async () => {
    try { await notificationApi.markAllRead(); } catch {}
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={[s.topbar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={24} color={colors.ink} /></TouchableOpacity>
        <Text style={s.topTitle}>Thông báo</Text>
        <TouchableOpacity onPress={markAll}><Text style={s.markAll}>Đọc tất cả</Text></TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => String(n.id)}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.primary} />}
          contentContainerStyle={{ padding: spacing.lg }}
          ListEmptyComponent={<Text style={s.empty}>Chưa có thông báo nào.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={[s.card, !item.isRead && s.unread]} activeOpacity={0.85} onPress={() => onTap(item)}>
              {!item.isRead && <View style={s.dot} />}
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{item.title || 'Thông báo'}</Text>
                {!!(item.message || item.content) && <Text style={s.msg}>{item.message || item.content}</Text>}
                <Text style={s.time}>{formatDateTime(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, paddingBottom: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  topTitle: { fontSize: 16, fontWeight: '600', color: colors.ink, flex: 1 },
  markAll: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  card: { flexDirection: 'row', gap: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md, marginBottom: spacing.sm },
  unread: { backgroundColor: colors.primary50, borderColor: colors.primary50 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginTop: 6 },
  cardTitle: { fontSize: 14.5, fontWeight: '600', color: colors.ink },
  msg: { fontSize: 13, color: colors.ink2, marginTop: 3 },
  time: { fontSize: 11.5, color: colors.ink3, marginTop: 5 },
  empty: { textAlign: 'center', color: colors.ink2, marginTop: spacing.xl },
});
