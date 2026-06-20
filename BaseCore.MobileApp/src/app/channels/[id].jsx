import { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as signalR from '@microsoft/signalr';
import { channelApi, HUB_CHANNEL_URL } from '../../api/client';
import { colors, radius, spacing } from '../../theme';
import { formatDateTime } from '../../utils/format';

export default function Channel() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [openComments, setOpenComments] = useState({}); // postId -> { list, input }
  const connRef = useRef(null);

  useEffect(() => {
    channelApi.getPosts(id)
      .then((r) => setPosts(Array.isArray(r.data) ? r.data : (r.data?.items || [])))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [id]);

  // realtime
  useEffect(() => {
    let cancelled = false;
    let conn;
    (async () => {
      const token = await AsyncStorage.getItem('token');
      conn = new signalR.HubConnectionBuilder()
        .withUrl(HUB_CHANNEL_URL, { accessTokenFactory: () => token })
        .withAutomaticReconnect()
        .build();
      connRef.current = conn;
      conn.on('PostCreated', (post) => {
        setPosts((prev) => (prev.some((p) => p.id === post.id) ? prev : [post, ...prev]));
      });
      conn.on('CommentAdded', ({ postId, comment }) => {
        setOpenComments((prev) => {
          if (!prev[postId]) return prev;
          const list = prev[postId].list;
          if (list.some((c) => c.id === comment.id)) return prev;
          return { ...prev, [postId]: { ...prev[postId], list: [...list, comment] } };
        });
      });
      conn.on('PollUpdated', (poll) => {
        setPosts((prev) => prev.map((p) => (p.poll?.id === poll.id ? { ...p, poll } : p)));
      });
      try {
        await conn.start();
        await conn.invoke('JoinChannel', Number(id));
        if (!cancelled) setConnected(true);
      } catch { /* offline vẫn xem được */ }
    })();
    return () => {
      cancelled = true;
      const c = connRef.current;
      if (c) c.invoke('LeaveChannel', Number(id)).catch(() => {}).finally(() => c.stop());
    };
  }, [id]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    try {
      const { data } = await channelApi.createPost(id, { content: text });
      setPosts((prev) => (prev.some((p) => p.id === data.id) ? prev : [data, ...prev]));
    } catch (e) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không gửi được bài.');
    }
  };

  const toggleLike = async (post) => {
    try {
      await channelApi.toggleLike(id, post.id);
      setPosts((prev) => prev.map((p) => p.id === post.id
        ? { ...p, likedByMe: !p.likedByMe, likeCount: (p.likeCount || 0) + (p.likedByMe ? -1 : 1) }
        : p));
    } catch { /* ignore */ }
  };

  const toggleComments = async (post) => {
    if (openComments[post.id]) {
      setOpenComments((prev) => { const n = { ...prev }; delete n[post.id]; return n; });
      return;
    }
    try {
      const { data } = await channelApi.getComments(id, post.id);
      setOpenComments((prev) => ({ ...prev, [post.id]: { list: Array.isArray(data) ? data : (data?.items || []), input: '' } }));
    } catch {
      setOpenComments((prev) => ({ ...prev, [post.id]: { list: [], input: '' } }));
    }
  };

  const addComment = async (postId) => {
    const st = openComments[postId];
    const text = st?.input?.trim();
    if (!text) return;
    try {
      const { data } = await channelApi.addComment(id, postId, { content: text });
      setOpenComments((prev) => ({
        ...prev,
        [postId]: { list: prev[postId].list.some((c) => c.id === data.id) ? prev[postId].list : [...prev[postId].list, data], input: '' },
      }));
    } catch (e) {
      Alert.alert('Lỗi', 'Không gửi được bình luận.');
    }
  };

  const vote = async (poll, optionId) => {
    try {
      await channelApi.votePoll(id, poll.id, optionId);
      const { data } = await channelApi.getPollResults(id, poll.id);
      setPosts((prev) => prev.map((p) => (p.poll?.id === poll.id ? { ...p, poll: { ...p.poll, ...data } } : p)));
    } catch (e) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không bình chọn được.');
    }
  };

  const author = (p) => p.authorName || p.userName || p.user?.name || `User #${p.userId ?? ''}`;

  const renderPoll = (post) => {
    const poll = post.poll;
    if (!poll) return null;
    const options = poll.options || [];
    const totalVotes = options.reduce((sum, o) => sum + (o.voteCount ?? o.votes ?? 0), 0);
    return (
      <View style={s.poll}>
        <Text style={s.pollQ}>{poll.question}</Text>
        {options.map((o) => {
          const v = o.voteCount ?? o.votes ?? 0;
          const pct = totalVotes ? Math.round((v / totalVotes) * 100) : 0;
          return (
            <TouchableOpacity key={o.id} style={s.pollOpt} onPress={() => vote(poll, o.id)}>
              <View style={[s.pollFill, { width: `${pct}%` }]} />
              <Text style={s.pollOptText}>{o.text || o.content} · {v} ({pct}%)</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.topbar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={24} color={colors.ink} /></TouchableOpacity>
        <Text style={s.topTitle}>Kênh trao đổi</Text>
        <View style={[s.live, { backgroundColor: connected ? colors.success : colors.ink3 }]} />
      </View>

      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} /> : (
        <FlatList
          data={posts}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ padding: spacing.lg }}
          ListEmptyComponent={<Text style={s.empty}>Chưa có bài viết. Hãy bắt đầu trao đổi!</Text>}
          renderItem={({ item }) => {
            const cm = openComments[item.id];
            return (
              <View style={s.post}>
                {item.isPinned && (
                  <View style={s.pinRow}><Ionicons name="pin" size={12} color={colors.accent} /><Text style={s.pinText}>Đã ghim</Text></View>
                )}
                <Text style={s.author}>{author(item)}</Text>
                <Text style={s.content}>{item.content}</Text>
                {renderPoll(item)}
                <View style={s.actions}>
                  <TouchableOpacity style={s.actBtn} onPress={() => toggleLike(item)}>
                    <Ionicons name={item.likedByMe ? 'heart' : 'heart-outline'} size={16} color={item.likedByMe ? colors.accent : colors.ink3} />
                    <Text style={s.actText}>{item.likeCount || 0}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.actBtn} onPress={() => toggleComments(item)}>
                    <Ionicons name="chatbubble-outline" size={15} color={colors.ink3} />
                    <Text style={s.actText}>{item.commentCount ?? 'Bình luận'}</Text>
                  </TouchableOpacity>
                  <Text style={s.time}>{formatDateTime(item.createdAt)}</Text>
                </View>

                {cm && (
                  <View style={s.comments}>
                    {cm.list.map((c) => (
                      <View key={c.id} style={s.comment}>
                        <Text style={s.commentAuthor}>{c.authorName || c.userName || c.user?.name || 'Ẩn danh'}</Text>
                        <Text style={s.commentText}>{c.content}</Text>
                      </View>
                    ))}
                    <View style={s.commentInputRow}>
                      <TextInput
                        style={s.commentInput}
                        placeholder="Viết bình luận…"
                        placeholderTextColor={colors.ink3}
                        value={cm.input}
                        onChangeText={(t) => setOpenComments((prev) => ({ ...prev, [item.id]: { ...prev[item.id], input: t } }))}
                      />
                      <TouchableOpacity onPress={() => addComment(item.id)} hitSlop={8}>
                        <Ionicons name="send" size={17} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      <View style={[s.inputBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TextInput
          style={s.input}
          placeholder="Nhập tin nhắn…"
          placeholderTextColor={colors.ink3}
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity style={s.sendBtn} onPress={send}>
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, paddingBottom: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  topTitle: { fontSize: 16, fontWeight: '600', color: colors.ink, flex: 1 },
  live: { width: 9, height: 9, borderRadius: 5 },
  post: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md, marginBottom: spacing.sm },
  pinRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  pinText: { fontSize: 11, color: colors.accent, fontWeight: '600' },
  author: { fontSize: 13.5, fontWeight: '700', color: colors.primary },
  content: { fontSize: 14.5, color: colors.ink, marginTop: 4, lineHeight: 20 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  actBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actText: { fontSize: 12.5, color: colors.ink2 },
  time: { fontSize: 11, color: colors.ink3, marginLeft: 'auto' },
  poll: { backgroundColor: colors.surface2, borderRadius: radius.input, padding: spacing.sm, marginTop: spacing.sm },
  pollQ: { fontSize: 13.5, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  pollOpt: { borderWidth: 1, borderColor: colors.border2, borderRadius: 8, marginBottom: 6, overflow: 'hidden', position: 'relative' },
  pollFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.primary50 },
  pollOptText: { fontSize: 13, color: colors.ink, paddingHorizontal: 10, paddingVertical: 8 },
  comments: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.sm, paddingTop: spacing.sm },
  comment: { marginBottom: 8 },
  commentAuthor: { fontSize: 12, fontWeight: '700', color: colors.ink2 },
  commentText: { fontSize: 13, color: colors.ink, marginTop: 1 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentInput: { flex: 1, backgroundColor: colors.surface2, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, fontSize: 13, color: colors.ink },
  empty: { textAlign: 'center', color: colors.ink2, marginTop: spacing.xl },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: spacing.md, paddingTop: spacing.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, maxHeight: 110, backgroundColor: colors.surface2, borderRadius: radius.input, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 14.5, color: colors.ink },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
});
