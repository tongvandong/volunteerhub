import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ratingApi } from '../../api/client';
import { colors, radius, spacing } from '../../theme';

export default function AdminRatings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await ratingApi.getAdminRatings({ page: 1, pageSize: 50 });
      setItems(Array.isArray(data) ? data : (data?.items || []));
    } catch { setItems([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleHide = async (r) => {
    try {
      if (r.isHidden) await ratingApi.unhide(r.id);
      else await ratingApi.hide(r.id, 'Nội dung không phù hợp.');
      setItems((prev) => prev.map((x) => (x.id === r.id ? { ...x, isHidden: !x.isHidden } : x)));
    } catch (e) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không thực hiện được.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={[s.topbar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={24} color={colors.ink} /></TouchableOpacity>
        <Text style={s.topTitle}>Kiểm duyệt đánh giá</Text>
      </View>
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} /> : (
        <FlatList
          data={items}
          keyExtractor={(x) => String(x.id)}
          contentContainerStyle={{ padding: spacing.lg }}
          ListEmptyComponent={<Text style={s.empty}>Chưa có đánh giá nào.</Text>}
          renderItem={({ item }) => (
            <View style={[s.card, item.isHidden && { opacity: 0.55 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Ionicons key={n} name={n <= item.score ? 'star' : 'star-outline'} size={13} color={colors.accent} />
                ))}
                <Text style={s.sub}>· {item.raterName || `User #${item.raterId}`} → {item.rateeName || `User #${item.rateeId}`}</Text>
              </View>
              {!!item.comment && <Text style={s.comment}>{item.comment}</Text>}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
                <Text style={[s.sub, { flex: 1 }]}>{item.eventTitle || `Sự kiện #${item.eventId}`}{item.isHidden ? ' · ĐÃ ẨN' : ''}</Text>
                <TouchableOpacity style={[s.hideBtn, item.isHidden && { backgroundColor: colors.success + '22' }]} onPress={() => toggleHide(item)}>
                  <Text style={[s.hideText, item.isHidden && { color: colors.success }]}>{item.isHidden ? 'Hiện lại' : 'Ẩn'}</Text>
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
  sub: { fontSize: 12.5, color: colors.ink2 },
  comment: { fontSize: 13.5, color: colors.ink, marginTop: 6 },
  hideBtn: { backgroundColor: colors.danger + '18', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  hideText: { fontSize: 12, fontWeight: '700', color: colors.danger },
  empty: { textAlign: 'center', color: colors.ink2, marginTop: spacing.xl },
});
