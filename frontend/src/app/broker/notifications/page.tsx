'use client';
import { Bell } from '@/lib/icons';

export default function BrokerNotificationsPage() {
  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">Stay updated with your broker activities.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <Bell size={20} className="text-gray-400" />
        </div>
        <p className="text-sm font-semibold text-gray-700">No notifications yet</p>
        <p className="text-xs text-gray-400 mt-1">Updates about leads, approvals, and commissions will appear here.</p>
      </div>
    </div>
  );
}
