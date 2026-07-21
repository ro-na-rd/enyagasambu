'use client';
import { useState } from 'react';
import { FileText, CheckCircle, Coins, Mail, Lock } from '@/lib/icons';

const initialNotifs = [
  { id: 1, text: 'New lead: David Habimana interested in 3-Bedroom House', time: '5 min ago', read: false },
  { id: 2, text: 'Listing approved: 3-Bedroom House Kacyiru', time: '2 hours ago', read: false },
  { id: 3, text: 'Commission of RWF 4,250 has been credited', time: '1 day ago', read: false },
  { id: 4, text: 'Message from Claire Niyonzima: New Listing Request', time: '2 days ago', read: true },
  { id: 5, text: 'Your broker profile has been verified', time: '3 days ago', read: true },
  { id: 6, text: 'Monthly report for May 2026 is ready', time: '5 days ago', read: true },
];

export default function BrokerNotificationsPage() {
  const [notifs, setNotifs] = useState(initialNotifs);

  const markAllRead = () => {
    setNotifs(notifs.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">Stay updated with your broker activities.</p>
        </div>
        <button onClick={markAllRead} className="text-xs font-semibold text-[#E85D04] hover:underline">
          Mark all as read
        </button>
      </div>

      <div className="space-y-2">
        {notifs.map((n) => (
          <div key={n.id} className={`flex items-start gap-3 bg-white rounded-xl border border-gray-100 shadow-sm p-4 transition ${!n.read ? 'border-l-4 border-l-[#E85D04]' : ''}`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 ${!n.read ? 'bg-[#E85D04]/10' : 'bg-gray-100'}`}>
              {n.text.includes('lead') ? <FileText size={16} /> : n.text.includes('approved') ? <CheckCircle size={16} /> : n.text.includes('commission') ? <Coins size={16} /> : n.text.includes('Message') ? <Mail size={16} /> : n.text.includes('verified') ? <Lock size={16} /> : <FileText size={16} />}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700">{n.text}</p>
              <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
            </div>
            {!n.read && <div className="w-2 h-2 rounded-full bg-[#E85D04] mt-2 shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}
