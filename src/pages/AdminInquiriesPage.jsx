import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  Mail,
  CheckCircle2,
  Clock,
  Trash2,
  ExternalLink,
  FolderOpen,
  Filter,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { supabase } from '../lib/supabase';

export default function AdminInquiriesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'read'
  const [selectedMessage, setSelectedMessage] = useState(null);

  const fetchMessages = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('contact_messages query notice:', error.message);
      } else {
        setMessages(data || []);
      }
    } catch (err) {
      console.warn('Fetch contact_messages error:', err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const markAsRead = async (id, isRead = true) => {
    try {
      await supabase.from('contact_messages').update({ is_read: isRead }).eq('id', id);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_read: isRead } : m))
      );
      if (selectedMessage?.id === id) {
        setSelectedMessage((prev) => (prev ? { ...prev, is_read: isRead } : null));
      }
    } catch (err) {
      console.error('Error updating message status:', err);
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await supabase.from('contact_messages').delete().eq('id', id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedMessage?.id === id) setSelectedMessage(null);
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const filteredMessages = messages.filter((m) => {
    const term = search.toLowerCase();
    const matchesSearch =
      (m.name || '').toLowerCase().includes(term) ||
      (m.email || '').toLowerCase().includes(term) ||
      (m.subject || '').toLowerCase().includes(term) ||
      (m.message || '').toLowerCase().includes(term);

    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'unread'
        ? !m.is_read
        : Boolean(m.is_read);

    return matchesSearch && matchesFilter;
  });

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <AdminLayout title="Inquiries & Messages">
      <div className="max-w-[1500px]">
        {/* Section Header */}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-400 mb-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#00873E] animate-pulse" />
              <span>Admin</span>
              <span>/</span>
              <span className="text-gray-700 font-semibold">Inquiries</span>
            </div>
            <h1
              className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight"
              style={{ fontFamily: '"Besley", Georgia, serif' }}
            >
              Inquiries &amp; Messages
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl font-light">
              Direct telemetry of inquiries submitted through QuickHedge contact channels.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchMessages}
              disabled={refreshing}
              className="border border-gray-200 bg-white px-4 py-2 text-xs uppercase tracking-widest text-gray-700 hover:text-gray-900 hover:border-[#00873E] hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer shadow-xs font-semibold rounded-full"
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin text-[#00873E]' : 'text-[#00873E]'} />
              <span>{refreshing ? 'Syncing Live…' : 'Refresh'}</span>
            </button>
            <div className="text-xs font-mono px-3.5 py-1.5 rounded-full border border-[#C2E7D0] bg-[#E6F4EA] text-[#006837] font-semibold">
              {unreadCount} Unread &bull; {messages.length} Total
            </div>
          </div>
        </header>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3 flex-1 max-w-xl">
            <div className="relative flex-1 min-w-[240px]">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by sender, email, subject, keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 pl-9 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00873E] transition-colors rounded-xl shadow-2xs font-mono"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 px-3.5 py-2 text-xs text-gray-700 focus:outline-none focus:border-[#00873E] rounded-xl cursor-pointer shadow-2xs font-medium"
            >
              <option value="all">All Messages ({messages.length})</option>
              <option value="unread">Unread Only ({unreadCount})</option>
              <option value="read">Reviewed / Read</option>
            </select>
          </div>
        </div>

        {/* Messages List & Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages Column */}
          <div className="lg:col-span-2 border border-gray-200 bg-white shadow-xs rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/70 flex justify-between items-center text-xs font-semibold text-gray-500 uppercase font-mono">
              <span>Inbox ({filteredMessages.length})</span>
              <span>Date</span>
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-gray-400 font-mono">
                Querying database inquiries…
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="py-16 text-center p-8">
                <FolderOpen size={28} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-semibold text-gray-800 mb-1">No Inquiries Found</p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  New submissions from the public website contact form will appear here in real time.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredMessages.map((msg) => {
                  const isSelected = selectedMessage?.id === msg.id;
                  return (
                    <div
                      key={msg.id}
                      onClick={() => {
                        setSelectedMessage(msg);
                        if (!msg.is_read) markAsRead(msg.id, true);
                      }}
                      className={`p-4 transition-colors cursor-pointer flex items-start justify-between gap-4 ${
                        isSelected
                          ? 'bg-[#E6F4EA]/40 border-l-3 border-[#00873E]'
                          : !msg.is_read
                          ? 'bg-emerald-50/20 hover:bg-gray-50'
                          : 'hover:bg-gray-50/80 opacity-80'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {!msg.is_read && (
                            <span className="w-2 h-2 rounded-full bg-[#00873E] shrink-0" />
                          )}
                          <p className="text-xs font-semibold text-gray-900 truncate">
                            {msg.name || 'Anonymous Inquiry'}
                          </p>
                          <span className="text-[11px] font-mono text-gray-500 truncate">
                            &lt;{msg.email}&gt;
                          </span>
                        </div>
                        <p className="text-xs text-gray-800 font-medium truncate mb-1">
                          {msg.subject || 'Website Inquiry'}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {msg.message}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-gray-400 font-mono block">
                          {msg.created_at ? new Date(msg.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                        {msg.is_read ? (
                          <span className="text-[10px] text-gray-500 font-mono mt-1 inline-block">
                            Reviewed
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-700 font-mono mt-1 inline-block font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Message Detail Card */}
          <div className="border border-gray-200 bg-white shadow-xs rounded-2xl p-6 h-fit sticky top-24">
            {selectedMessage ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">
                      {selectedMessage.subject || 'Website Inquiry'}
                    </h3>
                    <p className="text-xs text-gray-600 font-medium">
                      From: <span className="text-gray-900 font-semibold">{selectedMessage.name}</span>
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      {selectedMessage.email}
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {selectedMessage.created_at
                      ? new Date(selectedMessage.created_at).toLocaleString()
                      : ''}
                  </span>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-2 font-semibold">
                    Message Content
                  </h4>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800 whitespace-pre-wrap leading-relaxed font-sans min-h-[140px]">
                    {selectedMessage.message}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3 border-t border-gray-100">
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(
                      selectedMessage.subject || 'QuickHedge Inquiry'
                    )}`}
                    className="flex-1 px-4 py-2 bg-[#00873E] hover:bg-[#006837] text-white text-xs font-semibold uppercase tracking-wider transition-colors rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Mail size={13} />
                    <span>Reply via Email</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => deleteMessage(selectedMessage.id)}
                    className="p-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                    title="Delete Message"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-gray-400 text-xs">
                <Mail size={28} className="mx-auto mb-3 text-gray-300" />
                <span>Select an inquiry from the list to view its complete details and reply.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
