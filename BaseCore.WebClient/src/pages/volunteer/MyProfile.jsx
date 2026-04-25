import React, { useState, useEffect } from 'react';
import { profileApi, skillApi, profileSkillApi } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';

const LEVEL_COLOR = { Beginner: 'bg-yellow-100 text-yellow-700', Intermediate: 'bg-blue-100 text-blue-700', Expert: 'bg-primary-100 text-primary-700' };

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [form, setForm] = useState({ bloodType: '', languages: '', interests: '', bio: '', avatarUrl: '' });
  const [skillForm, setSkillForm] = useState({ skillId: '', level: 'Beginner' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([profileApi.getMyProfile(), skillApi.getAll()])
      .then(([pRes, sRes]) => {
        const p = pRes.data.profile;
        setProfile(p);
        setSkills(pRes.data.skills || []);
        setAllSkills(sRes.data || []);
        if (p) setForm({ bloodType: p.bloodType || '', languages: p.languages || '', interests: p.interests || '', bio: p.bio || '', avatarUrl: p.avatarUrl || '' });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await profileApi.updateProfile(form);
      setProfile(res.data);
      setMsg('Đã lưu hồ sơ thành công');
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('Lưu thất bại'); }
    finally { setSaving(false); }
  };

  const addSkill = async () => {
    if (!skillForm.skillId) return;
    try {
      await profileSkillApi.add({ skillId: parseInt(skillForm.skillId), level: skillForm.level });
      const res = await profileApi.getMyProfile();
      setSkills(res.data.skills || []);
      setShowSkillModal(false);
      setSkillForm({ skillId: '', level: 'Beginner' });
    } catch (err) { alert(err.response?.data?.message || 'Thêm kỹ năng thất bại'); }
  };

  const removeSkill = async (skillId) => {
    if (!confirm('Xóa kỹ năng này?')) return;
    await profileSkillApi.remove(skillId).catch(() => {});
    setSkills(prev => prev.filter(s => s.skillId !== skillId));
  };

  if (loading) return <LoadingSpinner />;

  const availableSkills = allSkills.filter(s => !skills.find(vs => vs.skillId === s.id));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Hồ sơ của tôi</h1>
        {profile?.totalVolunteerHours > 0 && (
          <div className="flex items-center gap-2 bg-primary-50 border border-primary-100 px-3 py-1.5 rounded-full">
            <i className="fa-solid fa-clock text-primary-600 text-sm" />
            <span className="text-sm font-semibold text-primary-700">{profile.totalVolunteerHours}h tình nguyện</span>
          </div>
        )}
      </div>

      {/* Avatar + basic */}
      <div className="card p-6">
        <div className="flex items-start gap-5 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {form.avatarUrl
              ? <img src={form.avatarUrl} alt="" className="w-full h-full object-cover" />
              : <i className="fa-solid fa-user text-primary-400 text-2xl" />}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">URL ảnh đại diện</p>
            <input type="url" value={form.avatarUrl} onChange={e => setForm({ ...form, avatarUrl: e.target.value })} placeholder="https://..." className="input-field w-72" />
          </div>
        </div>

        {msg && <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-700">{msg}</div>}

        <form onSubmit={saveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhóm máu</label>
              <select value={form.bloodType} onChange={e => setForm({ ...form, bloodType: e.target.value })} className="input-field">
                <option value="">Không rõ</option>
                {['A', 'B', 'AB', 'O'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngôn ngữ</label>
              <input type="text" value={form.languages} onChange={e => setForm({ ...form, languages: e.target.value })} placeholder="Tiếng Việt, English..." className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sở thích</label>
            <input type="text" value={form.interests} onChange={e => setForm({ ...form, interests: e.target.value })} placeholder="Cắm trại, nhiếp ảnh, âm nhạc..." className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giới thiệu bản thân</label>
            <textarea rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Viết vài dòng về bạn..." className="input-field resize-none" />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <i className="fa-solid fa-floppy-disk" /> Lưu hồ sơ
            </button>
          </div>
        </form>
      </div>

      {/* Skills */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Kỹ năng</h2>
          <button onClick={() => setShowSkillModal(true)} className="btn-primary btn-sm flex items-center gap-1">
            <i className="fa-solid fa-plus" /> Thêm kỹ năng
          </button>
        </div>
        {skills.length === 0
          ? <p className="text-sm text-gray-400 text-center py-4">Chưa có kỹ năng nào</p>
          : <div className="flex flex-wrap gap-2">
              {skills.map(vs => (
                <div key={vs.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full group">
                  <span className="text-sm font-medium text-gray-700">{vs.skill?.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${LEVEL_COLOR[vs.level]}`}>{vs.level}</span>
                  <button onClick={() => removeSkill(vs.skillId)} className="ml-1 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <i className="fa-solid fa-xmark text-xs" />
                  </button>
                </div>
              ))}
            </div>
        }
      </div>

      {/* Add skill modal */}
      <Modal open={showSkillModal} onClose={() => setShowSkillModal(false)} title="Thêm kỹ năng"
        footer={<><button onClick={() => setShowSkillModal(false)} className="btn-secondary">Hủy</button><button onClick={addSkill} className="btn-primary">Thêm</button></>}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kỹ năng</label>
            <select value={skillForm.skillId} onChange={e => setSkillForm({ ...skillForm, skillId: e.target.value })} className="input-field">
              <option value="">-- Chọn kỹ năng --</option>
              {availableSkills.map(s => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mức độ</label>
            <div className="flex gap-2">
              {['Beginner', 'Intermediate', 'Expert'].map(l => (
                <button key={l} type="button" onClick={() => setSkillForm({ ...skillForm, level: l })}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${skillForm.level === l ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600 hover:border-primary-300'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
