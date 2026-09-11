import { Bell, Calendar, Pin, Plus, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';

interface NoticeboardModalProps {
  onClose: () => void;
}

interface Notice {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  isImportant?: boolean;
}

export const NoticeboardModal: React.FC<NoticeboardModalProps> = ({ onClose }) => {
  const [notices, setNotices] = useState<Notice[]>([
    {
      id: 'n1',
      title: 'Chef Special Today: Roasted Garlic Alfredo',
      content: 'Fresh batch of organic fettuccine prepared. Offer with garlic bread combo at 10% off for dine-in guests.',
      author: 'Head Chef',
      date: new Date().toISOString().split('T')[0],
      isImportant: true,
    },
    {
      id: 'n2',
      title: 'POS Terminal Sync Notice',
      content: 'All offline tokens will automatically sync every 5 minutes. If network drops, keep billing normally in offline queue mode.',
      author: 'Store Manager',
      date: new Date().toISOString().split('T')[0],
      isImportant: false,
    },
    {
      id: 'n3',
      title: 'Table Reservation VIP - 8:00 PM',
      content: 'Table T-05 (Rooftop) reserved for Mr. Sharma (party of 6). Keep complimentary welcome drinks ready.',
      author: 'Hostess Desk',
      date: new Date().toISOString().split('T')[0],
      isImportant: true,
    },
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const notice: Notice = {
      id: `n-${Date.now()}`,
      title: newTitle.trim(),
      content: newContent.trim(),
      author: 'Cashier / POS Staff',
      date: new Date().toISOString().split('T')[0],
      isImportant,
    };

    setNotices([notice, ...notices]);
    setNewTitle('');
    setNewContent('');
    setIsImportant(false);
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500 text-white">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Store Noticeboard & Daily Bulletins</h3>
              <p className="text-xs text-slate-400">Kitchen updates, soup of the day, VIP reservations</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notices Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {isAdding ? (
            <form onSubmit={handleAddNotice} className="p-4 bg-orange-50/60 dark:bg-orange-950/30 rounded-2xl border border-orange-200 dark:border-orange-900/60 space-y-3">
              <h4 className="font-bold text-xs text-orange-900 dark:text-orange-300">Post New Notice</h4>
              <input
                type="text"
                placeholder="Notice headline..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                required
              />
              <textarea
                placeholder="Detailed message or instructions for kitchen/floor staff..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                required
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isImportant}
                    onChange={(e) => setIsImportant(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Mark as Priority / Urgent</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Publish Notice
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="flex justify-between items-center pb-1">
              <span className="text-xs font-bold text-slate-500">{notices.length} active announcements</span>
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Notice</span>
              </button>
            </div>
          )}

          <div className="space-y-2.5">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className={`p-4 rounded-2xl border transition-all ${
                  notice.isImportant
                    ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {notice.isImportant && <Pin className="w-4 h-4 text-amber-600 fill-amber-600 shrink-0" />}
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{notice.title}</h4>
                  </div>
                  <button
                    onClick={() => setNotices(notices.filter((n) => n.id !== notice.id))}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">{notice.content}</p>
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>Posted by: {notice.author}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {notice.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 font-bold text-xs rounded-xl">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
