import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import type { AppNotification } from '../../types/notification';

type FilterType = 'ALL' | 'UNREAD' | 'READ';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString();
}

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

function getTypeBadgeClass(type: string) {
  switch (type) {
    case 'REQUEST_CREATED':
      return 'badge badge-medium';
    case 'REQUEST_APPROVED':
      return 'badge badge-expert';
    case 'REQUEST_REJECTED':
      return 'badge badge-low';
    case 'SKILL_SUBMITTED':
      return 'badge badge-medium';
    case 'SKILL_APPROVED':
      return 'badge badge-expert';
    case 'SKILL_REJECTED':
      return 'badge badge-low';
    case 'ACTIVITY_ASSIGNED':
      return 'badge badge-high';
    default:
      return 'badge';
  }
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const {
    notifications,
    loading,
    markOneAsRead,
    markEverythingAsRead,
  } = useNotifications();

  const [filter, setFilter] = useState<FilterType>('ALL');
  const [search, setSearch] = useState('');

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  const readCount = useMemo(
    () => notifications.filter((item) => item.isRead).length,
    [notifications]
  );

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return notifications.filter(
      (item) => new Date(item.createdAt).toDateString() === today
    ).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    if (filter === 'UNREAD') {
      result = result.filter((item) => !item.isRead);
    } else if (filter === 'READ') {
      result = result.filter((item) => item.isRead);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((item) => {
        return (
          item.title.toLowerCase().includes(q) ||
          item.message.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q)
        );
      });
    }

    return result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notifications, filter, search]);

  const unreadNotifications = filteredNotifications.filter((item) => !item.isRead);
  const readNotifications = filteredNotifications.filter((item) => item.isRead);

  const handleClick = async (notification: AppNotification) => {
    if (!notification.isRead) {
      await markOneAsRead(notification._id);
    }

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const renderNotificationCard = (notification: AppNotification) => (
    <button
      key={notification._id}
      type="button"
      className={`notifications-page-item ${notification.isRead ? '' : 'unread'}`}
      onClick={() => handleClick(notification)}
    >
      <div className="notifications-page-item-top">
        <div>
          <div className="notifications-page-headline-row">
            <h3>{notification.title}</h3>
            <span className={getTypeBadgeClass(notification.type)}>
              {notification.type.replaceAll('_', ' ')}
            </span>
          </div>

          <p>{notification.message}</p>
        </div>

        {!notification.isRead && <span className="notification-dot" />}
      </div>

      <div className="notifications-page-meta">
        <span>{formatRelativeDate(notification.createdAt)}</span>
        <span>{formatDate(notification.createdAt)}</span>
      </div>
    </button>
  );

  return (
    <div className="page notifications-page-shell">
      <div className="container">
      <div className="section-head" style={{ marginBottom: 12 }}>
        <div>
          <div className="header-title" style={{ fontSize: 26 }}>
            Notifications Center
          </div>
          <div className="muted" style={{ marginTop: 4 }}>
            Stay updated with requests, approvals, skill changes, and activity alerts.
          </div>
        </div>

        <div className="hr-actions">
          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={markEverythingAsRead}
          >
            Mark all as read
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="card header-card">
          <div className="section-title">Total Notifications</div>
          <div className="score-value">{notifications.length}</div>
          <div className="score-sub">All alerts and updates</div>
        </div>

        <div className="card header-card">
          <div className="section-title">Unread</div>
          <div className="score-value">{unreadCount}</div>
          <div className="score-sub">Notifications waiting for review</div>
        </div>

        <div className="card header-card">
          <div className="section-title">Today</div>
          <div className="score-value">{todayCount}</div>
          <div className="score-sub">New notifications received today</div>
        </div>
      </div>

      <div className="hr-grid" style={{ marginTop: 14 }}>
        <div>
          <div className="card section-card">
            <div className="section-head">
              <div className="section-title">Notification Feed</div>
              <span className="muted">{filteredNotifications.length} items</span>
            </div>

            <div className="tabs" style={{ marginBottom: 14 }}>
              <button
                className={`tab ${filter === 'ALL' ? 'active' : ''}`}
                type="button"
                onClick={() => setFilter('ALL')}
              >
                All
              </button>
              <button
                className={`tab ${filter === 'UNREAD' ? 'active' : ''}`}
                type="button"
                onClick={() => setFilter('UNREAD')}
              >
                Unread
              </button>
              <button
                className={`tab ${filter === 'READ' ? 'active' : ''}`}
                type="button"
                onClick={() => setFilter('READ')}
              >
                Read
              </button>
            </div>

            <div className="skills-toolbar" style={{ marginBottom: 16 }}>
              <div className="skills-search-wrapper" style={{ width: '100%' }}>
                <span className="skills-search-icon">⌕</span>
                <input
                  type="text"
                  placeholder="Search notifications by title, message, or type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="skills-search-input"
                />
              </div>
            </div>

            {loading ? (
              <div className="empty-state">Loading notifications...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="empty-state">No notifications available.</div>
            ) : (
              <div className="notifications-page-list">
                {filteredNotifications.map(renderNotificationCard)}
              </div>
            )}
          </div>
        </div>

        <div className="hr-right">
          <div className="card section-card">
            <div className="section-head">
              <div className="section-title">Unread Notifications</div>
              <span className="badge badge-medium">{unreadNotifications.length}</span>
            </div>

            {loading ? (
              <div className="notification-empty">Loading...</div>
            ) : unreadNotifications.length === 0 ? (
              <div className="notification-empty">No unread notifications.</div>
            ) : (
              <div className="stack">
                {unreadNotifications.slice(0, 5).map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    className="history-item notification-side-item"
                    onClick={() => handleClick(item)}
                  >
                    <div>
                      <div className="history-title">{item.title}</div>
                      <div className="history-date">{formatRelativeDate(item.createdAt)}</div>
                    </div>
                    <span className="notification-dot" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card section-card">
            <div className="section-head">
              <div className="section-title">Recently Read</div>
              <span className="badge">{readCount}</span>
            </div>

            {loading ? (
              <div className="notification-empty">Loading...</div>
            ) : readNotifications.length === 0 ? (
              <div className="notification-empty">No read notifications yet.</div>
            ) : (
              <div className="stack">
                {readNotifications.slice(0, 5).map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    className="history-item notification-side-item"
                    onClick={() => handleClick(item)}
                  >
                    <div>
                      <div className="history-title">{item.title}</div>
                      <div className="history-date">{formatRelativeDate(item.createdAt)}</div>
                    </div>
                    <span className={getTypeBadgeClass(item.type)}>
                      {item.type.replaceAll('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card section-card">
            <div className="section-head">
              <div className="section-title">Notification Tips</div>
            </div>

            <div className="stack">
              <div className="history-item">
                <div>
                  <div className="history-title">Requests & approvals</div>
                  <div className="history-date">
                    Managers, HR, and employees will all see workflow updates here.
                  </div>
                </div>
                <span className="badge badge-high">Live</span>
              </div>

              <div className="history-item">
                <div>
                  <div className="history-title">Skills & certifications</div>
                  <div className="history-date">
                    Use this center for pending skill approvals and training alerts.
                  </div>
                </div>
                <span className="badge badge-medium">Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}