import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { channelApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ImageUploadField from '../../components/ui/ImageUploadField';

function fmt(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return d.toLocaleDateString('vi-VN');
}

function CommentSection({ channelId, postId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const r = await channelApi.getComments(channelId, postId);
      setComments(r.data || []);
      setLoaded(true);
    } catch {}
    finally { setLoading(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const r = await channelApi.addComment(channelId, postId, { content: text.trim() });
      setComments(prev => [...prev, r.data]);
      setText('');
    } catch {}
    finally { setSubmitting(false); }
  };

  const deleteComment = async (cid) => {
    try {
      await channelApi.deleteComment(channelId, postId, cid);
      setComments(prev => prev.filter(c => c.id !== cid));
    } catch {}
  };

  useEffect(() => { load(); }, [postId]);

  if (loading) return <div className="py-2 px-4"><LoadingSpinner size="sm" /></div>;

  return (
    <div className="bg-gray-50 border-t border-gray-100 px-4 py-3 space-y-3">
      {comments.map(c => (
        <div key={c.id} className="flex gap-2 group">
          <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <i className="fa-solid fa-user text-primary-500 text-xs" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100">
              <p className="text-xs font-semibold text-gray-800">{c.author?.fullName || 'Người dùng'}</p>
              <p className="text-sm text-gray-700 mt-0.5">{c.content}</p>
            </div>
            <div className="flex items-center gap-2 mt-1 pl-1">
              <span className="text-xs text-gray-400">{fmt(c.createdAt)}</span>
              {(c.authorId === user?.id || user?.role === 'Admin') && (
                <button onClick={() => deleteComment(c.id)} className="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Xóa
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {user && (
        <form onSubmit={submit} className="flex gap-2">
          <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <i className="fa-solid fa-user text-primary-500 text-xs" />
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Viết bình luận..."
              className="flex-1 text-sm border border-gray-200 rounded-full px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
            />
            <button type="submit" disabled={submitting || !text.trim()} className="text-primary-600 hover:text-primary-700 disabled:text-gray-300 transition-colors">
              <i className="fa-solid fa-paper-plane" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function PostCard({ channelId, post, onDelete, currentUser }) {
  const [liked, setLiked] = useState(post.isLikedByMe || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [toggling, setToggling] = useState(false);

  const toggleLike = async () => {
    if (toggling) return;
    setToggling(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount(c => wasLiked ? c - 1 : c + 1);
    try {
      await channelApi.toggleLike(channelId, post.id);
    } catch {
      setLiked(wasLiked);
      setLikeCount(c => wasLiked ? c + 1 : c - 1);
    }
    setToggling(false);
  };

  return (
    <div className="card overflow-hidden">
      {/* Post header */}
      <div className="p-4 flex items-start gap-3">
        <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
          <i className="fa-solid fa-user text-primary-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">{post.author?.fullName || 'Người dùng'}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{fmt(post.createdAt)}</span>
              {(post.authorId === currentUser?.id || currentUser?.role === 'Admin') && (
                <button onClick={() => onDelete(post.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <i className="fa-solid fa-trash text-xs" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-800 whitespace-pre-wrap">{post.content}</p>
        {post.imageUrl && (
          <img src={post.imageUrl} alt="" className="mt-3 rounded-lg w-full max-h-80 object-cover border border-gray-100" />
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-4">
        <button onClick={toggleLike} className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}>
          <i className={`fa-${liked ? 'solid' : 'regular'} fa-heart`} />
          <span>{likeCount}</span>
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary-600 transition-colors">
          <i className="fa-regular fa-comment" />
          <span>{post.commentCount || 0}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && <CommentSection channelId={channelId} postId={post.id} />}
    </div>
  );
}

export default function Channel() {
  const { id } = useParams();
  const { user } = useAuth();
  const [channel, setChannel] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    channelApi.getById(id)
      .then(r => setChannel(r.data))
      .catch(() => {});

    loadPosts(1);
  }, [id]);

  const loadPosts = async (p) => {
    if (p === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const r = await channelApi.getPosts(id, { page: p, pageSize: 10 });
      const data = r.data;
      if (p === 1) setPosts(data.items || []);
      else setPosts(prev => [...prev, ...(data.items || [])]);
      setTotalPages(data.totalPages || 1);
      setPage(p);
    } catch {}
    finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    setSubmitting(true);
    try {
      const r = await channelApi.createPost(id, { content: newPost.trim(), imageUrl: imageUrl.trim() || null });
      setPosts(prev => [r.data, ...prev]);
      setNewPost('');
      setImageUrl('');
      setShowForm(false);
    } catch (err) { alert(err.response?.data?.message || 'Đăng bài thất bại'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (postId) => {
    if (!confirm('Xóa bài đăng này?')) return;
    try {
      await channelApi.deletePost(id, postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) { alert(err.response?.data?.message || 'Xóa thất bại'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Channel header */}
      <div className="card p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <i className="fa-solid fa-hashtag text-primary-600 text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{channel?.name || `Kênh #${id}`}</h1>
            {channel?.description && <p className="text-sm text-gray-500 mt-0.5">{channel.description}</p>}
          </div>
        </div>
      </div>

      {/* Create post */}
      {user && (
        <div className="card p-4">
          {!showForm ? (
            <button onClick={() => setShowForm(true)} className="w-full flex items-center gap-3 text-left">
              <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-user text-primary-500" />
              </div>
              <div className="flex-1 bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-2 text-sm text-gray-400 cursor-text transition-colors">
                Chia sẻ điều gì đó...
              </div>
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-3">
                <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <i className="fa-solid fa-user text-primary-500" />
                </div>
                <div className="flex-1 space-y-2">
                  <textarea
                    value={newPost}
                    onChange={e => setNewPost(e.target.value)}
                    placeholder="Chia sẻ điều gì đó với cộng đồng..."
                    rows={3}
                    autoFocus
                    className="w-full text-sm border-0 resize-none focus:outline-none text-gray-800 placeholder-gray-400"
                  />
                  <ImageUploadField
                    label="Ảnh bài viết"
                    value={imageUrl}
                    onChange={setImageUrl}
                    helper="Tùy chọn, upload ảnh từ máy để đính kèm bài viết."
                    compact
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
                <button type="button" onClick={() => { setShowForm(false); setNewPost(''); setImageUrl(''); }} className="btn-secondary btn-sm">Hủy</button>
                <button type="submit" disabled={submitting || !newPost.trim()} className="btn-primary btn-sm flex items-center gap-1.5">
                  {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <i className="fa-solid fa-paper-plane" /> Đăng
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="card p-12 text-center">
          <i className="fa-solid fa-comments text-4xl text-gray-300 mb-3 block" />
          <p className="text-gray-500">Chưa có bài đăng nào. Hãy là người đầu tiên!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(p => (
            <PostCard key={p.id} channelId={id} post={p} onDelete={handleDelete} currentUser={user} />
          ))}
          {page < totalPages && (
            <div className="text-center">
              <button onClick={() => loadPosts(page + 1)} disabled={loadingMore} className="btn-secondary flex items-center gap-2 mx-auto">
                {loadingMore ? <><div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> Đang tải...</> : 'Xem thêm bài đăng'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
