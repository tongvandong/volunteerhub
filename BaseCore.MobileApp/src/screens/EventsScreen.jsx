import { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { eventApi } from '../api/client';
import EventCard from '../components/EventCard';
import { colors, radius, spacing } from '../theme';

export default function Events() {
  const insets = useSafeAreaInsets();
  const [keyword, setKeyword] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (kw) => {
    setLoading(true);
    try {
      const { data } = await eventApi.getAll({ keyword: kw || undefined, status: 'Approved', page: 1, pageSize: 30 });
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(''); }, [load]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => load(keyword), 400);
    return () => clearTimeout(t);
  }, [keyword, load]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top + spacing.md }}>
      <View style={s.header}>
        <Text style={s.title}>Khám phá sự kiện</Text>
        <View style={s.searchBox}>
          <Ionicons name="search" size={16} color={colors.ink3} />
          <TextInput
            style={s.searchInput}
            placeholder="Tìm sự kiện…"
            placeholderTextColor={colors.ink3}
            value={keyword}
            onChangeText={setKeyword}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(e) => String(e.id)}
          renderItem={({ item }) => <EventCard event={item} />}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
          ListEmptyComponent={<Text style={s.empty}>Không tìm thấy sự kiện nào.</Text>}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  title: { fontSize: 24, fontWeight: '700', color: colors.ink, marginBottom: spacing.sm },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border2,
    borderRadius: radius.input, paddingHorizontal: spacing.md, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14.5, color: colors.ink },
  empty: { textAlign: 'center', color: colors.ink2, marginTop: spacing.xl },
});
