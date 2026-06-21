import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { skillApi, eventCategoryApi, badgeApi } from '../../api/client';
import { colors, radius, spacing } from '../../theme';

// Quản lý danh mục: kỹ năng / lĩnh vực / huy hiệu (thêm + xoá)
const TABS = [
  { key: 'skills', label: 'Kỹ năng' },
  { key: 'categories', label: 'Lĩnh vực' },
  { key: 'badges', label: 'Huy hiệu' },
];

const API = {
  skills: { list: skillApi.getAll, create: (name) => skillApi.create({ name, category: '' }), remove: skillApi.delete },
  categories: { list: eventCategoryApi.getAll, create: (name) => eventCategoryApi.create({ name, description: name, icon: 'fa-hand-holding-heart' }), remove: eventCategoryApi.delete },
  badges: { list: badgeApi.getAll, create: (name) => badgeApi.create({ name, description: name, iconUrl: '', condition: '{}' }), remove: badgeApi.delete },
};

export default function AdminCatalog() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState('skills');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');

  const load = useCallback(async (t = tab) => {
    setLoading(true);
    try {
      const { data } = await API[t].list();
      setItems(Array.isArray(data) ? data : (data?.items || []));
    } catch { setItems([]); } finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(tab); }, [tab]);

  const add = async () => {
    if (!newName.trim()) return;
    try {
      await API[tab].create(newName.trim());
      setNewName('');
      await load();
    } catch (e) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không thêm được.');
    }
  };

  const remove = (item) => {
    Alert.alert('Xoá?', `Xoá "${item.name}" khỏi hệ thống?`, [
      { text: 'Không', style: 'cancel' },
      { text: 'Xoá', style: 'destructive', onPress: async () => {
        try { await API[tab].remove(item.id); await load(); }
        catch (e) { Alert.alert('Lỗi', e?.response?.data?.message || 'Không xoá được (có thể đang được sử dụng).'); }
      } },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={[s.topbar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={24} color={colors.ink} /></TouchableOpacity>
        <Text style={s.topTitle}>Danh mục hệ thống</Text>
      </View>

      <View style={s.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.key} style={[s.seg, tab === t.key && s.segActive]} onPress={() => setTab(t.key)}>
            <Text style={[s.segText, tab === t.key && s.segTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.addRow}>
        <TextInput style={s.addInput} placeholder={`Thêm ${TABS.find((t) => t.key === tab).label.toLowerCase()} mới…`} placeholderTextColor={colors.ink3} value={newName} onChangeText={setNewName} />
        <TouchableOpacity style={s.addBtn} onPress={add}><Ionicons name="add" size={20} color="#fff" /></TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} /> : (
        <FlatList
          data={items}
          keyExtractor={(x) => String(x.id)}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: 0 }}
          ListEmptyComponent={<Text style={s.empty}>Danh sách trống.</Text>}
          renderItem={({ item }) => (
            <View style={s.row}>
              <Text style={s.name}>{item.name}</Text>
              {!!item.category && <Text style={s.sub}>[{item.category}]</Text>}
              <TouchableOpacity onPress={() => remove(item)} hitSlop={8} style={{ marginLeft: 'auto' }}>
                <Ionicons name="trash-outline" size={17} color={colors.danger} />
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
  tabs: { flexDirection: 'row', gap: 8, padding: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  seg: { flex: 1, paddingVertical: 9, borderRadius: radius.pill, alignItems: 'center', backgroundColor: colors.surface2 },
  segActive: { backgroundColor: colors.primary },
  segText: { fontSize: 13, fontWeight: '600', color: colors.ink2 },
  segTextActive: { color: '#fff' },
  addRow: { flexDirection: 'row', gap: 8, padding: spacing.lg, paddingBottom: spacing.md },
  addInput: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border2, borderRadius: radius.input, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 14, color: colors.ink },
  addBtn: { width: 44, height: 44, borderRadius: radius.input, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md, marginBottom: spacing.sm },
  name: { fontSize: 14.5, fontWeight: '500', color: colors.ink },
  sub: { fontSize: 12, color: colors.ink3 },
  empty: { textAlign: 'center', color: colors.ink2, marginTop: spacing.lg },
});
