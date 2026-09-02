'use client';
import NotificationsPage from '@/components/NotificationsPage';
import { useUnreadCount } from '@/lib/useUnreadCount';

export default function AdminNotificationsPage() {
  const { refresh } = useUnreadCount();
  return (
    <NotificationsPage
      title="Notifications"
      subtitle="Stay updated with platform activities."
      emptyText="Updates about new listings, registrations, and ratings will appear here."
      onRead={refresh}
      canClear
    />
  );
}