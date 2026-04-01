import type { AppNotification } from '../../types/notification';

type Props = {
  notification: AppNotification;
  onClick: (notification: AppNotification) => void;
};

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} h ago`;
  if (days < 7) return `${days} d ago`;

  return date.toLocaleDateString();
}

export default function NotificationItem({ notification, onClick }: Props) {
  return (
    <button
      type="button"
      className={`notification-item ${notification.isRead ? '' : 'unread'}`}
      onClick={() => onClick(notification)}
    >
      <div className="notification-item-top">
        <h4 className="notification-title">{notification.title}</h4>
        {!notification.isRead && <span className="notification-dot" />}
      </div>

      <p className="notification-message">{notification.message}</p>

      <div className="notification-meta">
        <span className="notification-type">{notification.type}</span>
        <span className="notification-date">
          {formatRelativeDate(notification.createdAt)}
        </span>
      </div>
    </button>
  );
}