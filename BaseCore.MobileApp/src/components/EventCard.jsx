import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, spacing } from '../theme';
import { formatDate } from '../utils/format';
import { eventImageSource, eventFallback } from '../utils/eventImage';

export default function EventCard({ event }) {
  const router = useRouter();
  const img = eventImageSource(event);
  const fb = eventFallback(event);

  return (
    <TouchableOpacity
      style={s.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/events/${event.id}`)}
    >
      {/* Cover 16:9 — ảnh thật hoặc pastel + icon */}
      {img ? (
        <Image source={img} style={s.cover} resizeMode="cover" />
      ) : (
        <View style={[s.cover, s.coverFallback, { backgroundColor: fb.bg }]}>
          <Ionicons name={fb.icon} size={38} color={fb.fg} style={{ opacity: 0.55 }} />
        </View>
      )}

      <View style={s.body}>
        <Text style={s.title} numberOfLines={2}>{event.title}</Text>
        <View style={s.row}>
          <Ionicons name="location-outline" size={13} color={colors.ink3} />
          <Text style={s.meta} numberOfLines={1}>{event.location || 'Chưa rõ địa điểm'}</Text>
          <Ionicons name="calendar-outline" size={13} color={colors.ink3} style={{ marginLeft: 8 }} />
          <Text style={s.meta}>{formatDate(event.startDate)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.card, marginBottom: spacing.sm, overflow: 'hidden',
  },
  cover: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.surface2 },
  coverFallback: { justifyContent: 'center', alignItems: 'center' },
  body: { padding: spacing.md },
  title: { fontSize: 15, fontWeight: '600', color: colors.ink, marginBottom: 6, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 12, color: colors.ink2, flexShrink: 1 },
});
