'use client';
import NotificationsPage from '@/components/NotificationsPage';
import { useUnreadCount } from '@/lib/useUnreadCount';

export default function BrokerNotificationsPage() {
  const { refresh } = useUnreadCount();
  return (
    <NotificationsPage
      title="Notifications"
      subtitle="Stay updated with your broker activities."
      emptyText="Updates about leads, approvals, and commissions will appear here."
      onRead={refresh}
      canClear
    />
  );
}