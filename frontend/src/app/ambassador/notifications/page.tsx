'use client';
import NotificationsPage from '@/components/NotificationsPage';
import { useUnreadCount } from '@/lib/useUnreadCount';

export default function AmbassadorNotificationsPage() {
  const { refresh } = useUnreadCount();
  return (
    <NotificationsPage
      title="Notifications"
      subtitle="Stay updated with your ambassador activities."
      emptyText="Updates about referrals, rewards, and announcements will appear here."
      onRead={refresh}
      canClear
    />
  );
}