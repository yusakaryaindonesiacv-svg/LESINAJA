import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  Send,
  User,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Search
} from 'lucide-react';

interface DiscussionForumProps {
  courseId: string;
  moduleId?: string;
}

export const DiscussionForum: React.FC<DiscussionForumProps> = ({ courseId, moduleId }) => {
  const { discussions, addDiscussion, addDiscussionReply, currentUser, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});

  const courseDiscussions = discussions.filter(d => d.courseId === courseId);
  const filteredDiscussions = courseDiscussions.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePostTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Silakan login untuk berpartisipasi dalam diskusi.');
      return;
    }
    if (!newTopicTitle.trim() || !newTopicContent.trim()) return;

    addDiscussion(courseId, newTopicTitle.trim(), newTopicContent.trim(), moduleId);
    setNewTopicTitle('');
    setNewTopicContent('');
    setIsCreatingTopic(false);
  };

  const handlePostReply = (discussionId: string) => {
    const text = replyTextMap[discussionId];
    if (!text || !text.trim()) return;

    addDiscussionReply(discussionId, text.trim());
    setReplyTextMap(prev => ({ ...prev, [discussionId]: '' }));
  };

  return (
    <div id="discussion-forum-container" className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari pertanyaan diskusi..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 rounded-xl border border-slate-700 text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <button
          id="toggle-create-topic-btn"
          onClick={() => setIsCreatingTopic(!isCreatingTopic)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isCreatingTopic ? 'Batal' : 'Buat Pertanyaan Baru'}</span>
        </button>
      </div>

      {/* New Topic Form */}
      {isCreatingTopic && (
        <form
          onSubmit={handlePostTopic}
          className="p-4 bg-slate-900/90 rounded-2xl border border-indigo-500/40 space-y-3 animate-in fade-in duration-200"
        >
          <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-indigo-400">
            Tanyakan ke Pengajar & Rekan Belajar
          </h4>
          <input
            type="text"
            required
            placeholder="Judul topik (misal: Kendala import modul React di Vite)"
            value={newTopicTitle}
            onChange={e => setNewTopicTitle(e.target.value)}
            className="w-full p-2.5 text-xs bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none"
          />
          <textarea
            required
            rows={4}
            placeholder="Jelaskan detail pertanyaan, potongan error, atau konteks..."
            value={newTopicContent}
            onChange={e => setNewTopicContent(e.target.value)}
            className="w-full p-2.5 text-xs bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreatingTopic(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              Kirim Pertanyaan
            </button>
          </div>
        </form>
      )}

      {/* Topics List */}
      <div className="space-y-4">
        {filteredDiscussions.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Belum ada diskusi untuk kursus ini. Jadilah yang pertama bertanya!
          </div>
        ) : (
          filteredDiscussions.map(disc => (
            <div
              key={disc.id}
              className="p-4 bg-slate-900/60 rounded-2xl border border-slate-700 space-y-3"
            >
              {/* Question Header */}
              <div className="flex items-start gap-3">
                <img
                  src={disc.studentAvatar}
                  alt={disc.studentName}
                  className="w-8 h-8 rounded-full object-cover border border-indigo-500/40"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h5 className="font-heading font-bold text-sm text-white">
                      {disc.title}
                    </h5>
                    <span className="text-[10px] text-slate-400">
                      {new Date(disc.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-300 font-semibold">{disc.studentName}</p>
                </div>
              </div>

              {/* Question Body */}
              <p className="text-xs text-slate-300 pl-11 leading-relaxed">
                {disc.content}
              </p>

              {/* Replies Section */}
              <div className="pl-11 space-y-3 pt-2">
                {disc.replies.map(rep => (
                  <div
                    key={rep.id}
                    className={`p-3 rounded-xl text-xs space-y-1 ${
                      rep.userRole === 'instructor' || rep.userRole === 'admin'
                        ? 'bg-indigo-950/40 border border-indigo-800/60'
                        : 'bg-slate-800/60 border border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={rep.userAvatar}
                          alt={rep.userName}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="font-bold text-slate-200">{rep.userName}</span>
                        {(rep.userRole === 'instructor' || rep.userRole === 'admin') && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-600 text-white uppercase">
                            Mentor Terverifikasi
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400">
                        {new Date(rep.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed pl-6.5">
                      {rep.content}
                    </p>
                  </div>
                ))}

                {/* Reply Input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Tulis balasan atau solusi..."
                    value={replyTextMap[disc.id] || ''}
                    onChange={e =>
                      setReplyTextMap(prev => ({ ...prev, [disc.id]: e.target.value }))
                    }
                    onKeyDown={e => {
                      if (e.key === 'Enter') handlePostReply(disc.id);
                    }}
                    className="flex-1 px-3 py-2 text-xs bg-slate-800 rounded-xl border border-slate-700 text-white focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handlePostReply(disc.id)}
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center justify-center"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
