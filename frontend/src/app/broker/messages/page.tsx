'use client';
import { useState } from 'react';

const initialMessages = [
  { id: 1, from: 'David Habimana', subject: 'Inquiry about 3-Bedroom House', preview: 'I am interested in viewing the property...', date: 'Today', unread: true },
  { id: 2, from: 'Eva Uwase', subject: 'Commercial Plot Pricing', preview: 'Could you provide more details about the...', date: 'Yesterday', unread: true },
  { id: 3, from: 'Admin Team', subject: 'Broker Verification Update', preview: 'Your broker profile has been verified...', date: '2 days ago', unread: false },
  { id: 4, from: 'Claire Niyonzima', subject: 'New Listing Request', preview: 'I would like to list my new property...', date: '3 days ago', unread: false },
];

export default function BrokerMessagesPage() {
  const [messages] = useState(initialMessages);

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Messages</h1>
      <p className="text-sm text-gray-500 mb-6">Communicate with clients and team members.</p>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {messages.map((m) => (
          <div key={m.id} className={`flex items-start gap-3 px-4 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition cursor-pointer ${m.unread ? 'bg-blue-50/30' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${m.unread ? 'bg-[#0f1e42]' : 'bg-gray-300'}`}>
              {m.from.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900 truncate">{m.from}</p>
                <span className="text-[10px] text-gray-400 shrink-0">{m.date}</span>
              </div>
              <p className="text-xs font-medium text-gray-700 mt-0.5">{m.subject}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{m.preview}</p>
            </div>
            {m.unread && <div className="w-2 h-2 rounded-full bg-[#E85D04] mt-2 shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}
