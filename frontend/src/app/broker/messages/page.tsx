'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';
import { Search, Send, Loader2, ChevronLeft, AlertCircle, MessageCircle, RefreshCw, Mail, Phone, Clock } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

interface Conversation {
  key: string;
  client_id: number | null;
  name: string;
  email: string | null;
  phone: string | null;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

interface Msg {
  id: number;
  client_id: number | null;
  direction: 'inbound' | 'outbound';
  sender_name: string;
  sender_email: string | null;
  sender_phone: string | null;
  body: string;
  is_read: boolean;
  created_at: string;
}

function relativeTime(iso: string) {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24 && now.toDateString() === date.toDateString()) return `${hours}h ago`;
  if (hours < 24) return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (hours < 48) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function fullTime(iso: string) {
  if (!iso) return '';
  const date = new Date(iso);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function initials(name: string) {
  return name.trim().split(/\s+/).map((p) => p[0]).join('').toUpperCase().slice(0, 2) || '?';
}

export default function BrokerMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [convError, setConvError] = useState('');

  const [search, setSearch] = useState('');
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState('');

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const threadRef = useRef<HTMLDivElement | null>(null);
  const draftRef = useRef<HTMLTextAreaElement | null>(null);
  const lastAtRef = useRef<string>('');

  const fetchConversations = useCallback(async (silent = false) => {
    if (!silent) setLoadingConvs(true);
    try {
      const { data } = await api.get('/broker/messages/conversations');
      setConversations(data.conversations || []);
      setConvError('');
    } catch {
      if (!silent) setConvError('Could not load conversations. Please try again.');
    } finally {
      if (!silent) setLoadingConvs(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    const t = setInterval(() => {
      fetchConversations(true);
      if (activeKey) {
        api.get('/broker/messages/thread', { params: { key: activeKey } }).then(({ data }) => {
          if (data.conversation && data.conversation.lastAt && data.conversation.lastAt !== lastAtRef.current) {
            lastAtRef.current = data.conversation.lastAt;
          }
          if (data.messages?.length) setMessages(data.messages);
        }).catch(() => {});
      }
    }, 30000);
    return () => clearInterval(t);
  }, [fetchConversations, activeKey]);

  const openConversation = async (c: Conversation) => {
    setActiveKey(c.key);
    setActiveConv(c);
    setThreadError('');
    setSendError('');
    setThreadLoading(true);
    try {
      const { data } = await api.get('/broker/messages/thread', { params: { key: c.key } });
      setMessages(data.messages || []);
      lastAtRef.current = c.lastAt;
      if (c.unread > 0) {
        await api.post('/broker/messages/read', { key: c.key }).catch(() => {});
        setConversations((prev) => prev.map((x) => (x.key === c.key ? { ...x, unread: 0 } : x)));
        setActiveConv((x) => (x ? { ...x, unread: 0 } : x));
      }
    } catch {
      setThreadError('Could not open this conversation. Please try again.');
    } finally {
      setThreadLoading(false);
    }
  };

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [messages, activeKey, threadLoading]);

  useEffect(() => {
    if (activeKey) {
      const found = conversations.find((c) => c.key === activeKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (found) setActiveConv(found);
    }
  }, [conversations, activeKey]);

  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  });

  const sendMessage = async () => {
    const body = draft.trim();
    if (!body || !activeConv || sending) return;
    setSending(true);
    setSendError('');
    try {
      const payload: Record<string, unknown> = { body };
      if (activeConv.client_id) payload.client_id = activeConv.client_id;
      if (activeConv.email) payload.to_email = activeConv.email;
      if (activeConv.phone) payload.to_phone = activeConv.phone;
      if (!activeConv.client_id && !activeConv.email && !activeConv.phone) payload.to_name = activeConv.name;

      const { data } = await api.post('/broker/messages', payload);
      setMessages((prev) => [...prev, data.message]);
      setDraft('');
      const now = new Date().toISOString();
      setConversations((prev) =>
        prev.map((c) =>
          c.key === activeConv.key
            ? { ...c, lastMessage: `You: ${body}`, lastAt: now, unread: 0 }
            : c
        )
      );
      setActiveConv((c) => (c ? { ...c, lastMessage: `You: ${body}`, lastAt: now, unread: 0 } : c));
      lastAtRef.current = now;
      setTimeout(() => draftRef.current?.focus(), 50);
    } catch {
      setSendError('Could not send your message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-500 mt-1">Communicate with clients and team members.</p>
        </div>
        {totalUnread > 0 && (
          <span className="text-xs font-semibold text-white bg-[#E85D04] px-3 py-1.5 rounded-full">
            {totalUnread} unread
          </span>
        )}
      </div>

      {convError && (
        <div className="mb-4 flex items-center justify-between text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <span>{convError}</span>
          <button onClick={() => fetchConversations()} className="font-semibold underline inline-flex items-center gap-1">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden lg:h-[calc(100vh-11rem)] flex flex-col lg:flex-row">
        {/* Conversation list */}
        <aside className={`${activeKey ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 lg:shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100`}>
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-3 border border-gray-300 rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D04]/40 focus:border-[#E85D04]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="flex items-center justify-center gap-3 py-16 text-gray-400">
                <Loader2 size={20} className="animate-spin" /> Loading…
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center text-gray-400">
                <MessageCircle size={36} className="mb-3" />
                <p className="text-sm">
                  {conversations.length === 0
                    ? 'No conversations yet. Messages from your clients will appear here.'
                    : 'No conversations match your search.'}
                </p>
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.key}
                  onClick={() => openConversation(c)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 border-b border-gray-50 text-left transition ${activeKey === c.key ? 'bg-orange-50/60' : 'hover:bg-gray-50'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${c.unread > 0 ? 'bg-[#0f1e42]' : 'bg-gray-300'}`}>
                    {initials(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${c.unread > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>{c.name}</p>
                      <span className="text-[10px] text-gray-400 shrink-0">{relativeTime(c.lastAt)}</span>
                    </div>
                    <p className={`text-xs mt-0.5 truncate ${c.unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>{c.lastMessage}</p>
                  </div>
                  {c.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[#E85D04] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-1">
                      {c.unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Thread */}
        <section className={`${activeKey ? 'flex' : 'hidden lg:flex'} flex-1 flex-col min-w-0`}>
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <MessageCircle size={28} />
              </div>
              <p className="text-sm font-semibold text-gray-500">Select a conversation</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">Choose a client on the left to start messaging.</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                <button
                  onClick={() => { setActiveKey(null); setActiveConv(null); setMessages([]); }}
                  className="lg:hidden p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${activeConv.unread > 0 ? 'bg-[#0f1e42]' : 'bg-gray-300'}`}>
                  {initials(activeConv.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 truncate">{activeConv.name}</p>
                  <div className="flex items-center gap-3 text-[11px] text-gray-500">
                    {activeConv.email && <span className="flex items-center gap-1 truncate"><Mail size={11} /> {activeConv.email}</span>}
                    {activeConv.phone && <span className="flex items-center gap-1"><Phone size={11} /> {activeConv.phone}</span>}
                  </div>
                </div>
                {activeConv.unread > 0 && (
                  <span className="text-[10px] font-bold text-white bg-[#E85D04] px-2.5 py-1 rounded-full shrink-0">{activeConv.unread} new</span>
                )}
              </div>

              {/* Messages */}
              <div ref={threadRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-3 bg-gradient-to-b from-gray-50/40 to-white">
                {threadLoading ? (
                  <div className="flex items-center justify-center gap-3 py-12 text-gray-400">
                    <Loader2 size={20} className="animate-spin" /> Loading conversation…
                  </div>
                ) : threadError ? (
                  <div className="flex flex-col items-center justify-center py-12 text-red-500">
                    <AlertCircle size={24} className="mb-2" />
                    <p className="text-sm">{threadError}</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                    <MessageCircle size={32} className="mb-3" />
                    <p className="text-sm">No messages in this conversation yet.</p>
                    <p className="text-xs mt-1">Send a message below to get started.</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const outbound = m.direction === 'outbound';
                    return (
                      <div key={m.id} className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[78%] lg:max-w-[65%]`}>
                          <div
                            className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words rounded-2xl ${
                              outbound
                                ? 'text-white rounded-br-md shadow-sm'
                                : 'bg-gray-100 text-gray-800 rounded-bl-md'
                            }`}
                            style={outbound ? { background: `linear-gradient(135deg, ${NAVY}, ${ORG})` } : undefined}
                          >
                            {m.body}
                          </div>
                          <p className={`text-[10px] text-gray-400 mt-1 flex items-center gap-1 ${outbound ? 'justify-end' : ''}`}>
                            <Clock size={10} /> {fullTime(m.created_at)}
                            {outbound && (
                              <span className="text-green-500 ml-0.5">✓✓</span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Composer */}
              <div className="px-4 py-3 border-t border-gray-100">
                {sendError && (
                  <div className="mb-2 flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertCircle size={14} /> {sendError}
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <textarea
                    ref={draftRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder="Type a message… (Enter to send)"
                    className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D04]/40 focus:border-[#E85D04] max-h-32"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !draft.trim()}
                    className="w-11 h-11 shrink-0 rounded-xl text-white flex items-center justify-center transition disabled:opacity-50 hover:opacity-90"
                    style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORG})` }}
                  >
                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
