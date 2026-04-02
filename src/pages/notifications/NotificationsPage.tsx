import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import type { AppNotification } from '../../types/notification';

type FilterType = 'ALL' | 'UNREAD' | 'READ';

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Invalid date';

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const seconds = Math.round(diffMs / 1000);
  const minutes = Math.round(diffMs / (1000 * 60));
  const hours = Math.round(diffMs / (1000 * 60 * 60));
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (Math.abs(seconds) < 60) return rtf.format(seconds, 'second');
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
  if (Math.abs(days) < 7) return rtf.format(days, 'day');

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function matchesFilter(item: AppNotification, filter: FilterType) {
  if (filter === 'UNREAD') return !item.isRead;
  if (filter === 'READ') return item.isRead;
  return true;
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
    case 'GENERAL':
      return 'badge badge-neutral';
    default:
      return 'badge badge-neutral';
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showAllUnread, setShowAllUnread] = useState(false);
  const [showAllRead, setShowAllRead] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 200);
    return () => clearTimeout(timeout);
  }, [search]);

  const {
    unreadCount,
    readCount,
    todayCount,
    filteredNotifications,
    unreadNotifications,
    readNotifications,
  } = useMemo(() => {
    const query = normalizeText(debouncedSearch);
    const todayKey = new Date().toDateString();

    let unread = 0;
    let read = 0;
    let today = 0;
    const filtered: AppNotification[] = [];

    for (const item of notifications) {
      if (item.isRead) read += 1;
      else unread += 1;

      const created = new Date(item.createdAt);
      if (!Number.isNaN(created.getTime()) && created.toDateString() === todayKey) {
        today += 1;
      }

      if (!matchesFilter(item, filter)) continue;
      if (query) {
        const haystack = normalizeText(`${item.title} ${item.message} ${item.type}`);
        if (!haystack.includes(query)) continue;
      }

      filtered.push(item);
    }

    filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const unreadTop: AppNotification[] = [];
    const readTop: AppNotification[] = [];
    for (const item of filtered) {
      if (!item.isRead) unreadTop.push(item);
      else readTop.push(item);
    }

    return {
      unreadCount: unread,
      readCount: read,
      todayCount: today,
      filteredNotifications: filtered,
      unreadNotifications: unreadTop,
      readNotifications: readTop,
    };
  }, [notifications, filter, debouncedSearch]);

  const handleClick = useCallback(async (notification: AppNotification) => {
    if (!notification.isRead) {
      void markOneAsRead(notification._id);
    }

    if (notification.link) {
      navigate(notification.link);
    }
  }, [markOneAsRead, navigate]);

  const unreadTopFive = useMemo(() => unreadNotifications.slice(0, 5), [unreadNotifications]);
  const readTopFive = useMemo(() => readNotifications.slice(0, 5), [readNotifications]);
  const unreadSideList = showAllUnread ? unreadNotifications : unreadTopFive;
  const readSideList = showAllRead ? readNotifications : readTopFive;

  const renderNotificationCard = useCallback((notification: AppNotification) => (
    <button
      key={notification._id}
      type="button"
      className={`notifications-page-item ${notification.isRead ? '' : 'unread'}`}
      onClick={() => handleClick(notification)}
      aria-label={`Notification: ${notification.title}. ${notification.isRead ? 'Read' : 'Unread'}`}
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

        {!notification.isRead && <span className="notification-dot" aria-hidden="true" />}
      </div>

      <div className="notifications-page-meta">
        <span>{formatRelativeDate(notification.createdAt)}</span>
        <span>{formatDate(notification.createdAt)}</span>
      </div>
    </button>
  ), [handleClick]);

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
          <div className="sr-only" aria-live="polite">
            You have {unreadCount} unread notifications.
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

            <div className="tabs" style={{ marginBottom: 14 }} role="tablist" aria-label="Notification filters">
              <button
                className={`tab ${filter === 'ALL' ? 'active' : ''}`}
                type="button"
                onClick={() => setFilter('ALL')}
                role="tab"
                aria-selected={filter === 'ALL'}
                aria-controls="notifications-feed"
              >
                All
              </button>
              <button
                className={`tab ${filter === 'UNREAD' ? 'active' : ''}`}
                type="button"
                onClick={() => setFilter('UNREAD')}
                role="tab"
                aria-selected={filter === 'UNREAD'}
                aria-controls="notifications-feed"
              >
                Unread
              </button>
              <button
                className={`tab ${filter === 'READ' ? 'active' : ''}`}
                type="button"
                onClick={() => setFilter('READ')}
                role="tab"
                aria-selected={filter === 'READ'}
                aria-controls="notifications-feed"
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
                <div id="notifications-feed" className="sr-only" />
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
                {unreadSideList.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    className="history-item notification-side-item"
                    onClick={() => handleClick(item)}
                    aria-label={`Unread notification: ${item.title}`}
                  >
                    <div>
                      <div className="history-title">{item.title}</div>
                      <div className="history-date">{formatRelativeDate(item.createdAt)}</div>
                    </div>
                    <span className="notification-dot" aria-hidden="true" />
                  </button>
                ))}
                {unreadNotifications.length > 5 && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-small"
                    onClick={() => setShowAllUnread((prev) => !prev)}
                    aria-pressed={showAllUnread}
                    aria-label={showAllUnread ? 'Show fewer unread notifications' : 'Show all unread notifications'}
                  >
                    {showAllUnread ? 'See less' : `See more (${unreadNotifications.length - 5})`}
                  </button>
                )}
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
                {readSideList.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    className="history-item notification-side-item"
                    onClick={() => handleClick(item)}
                    aria-label={`Read notification: ${item.title}`}
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
                {readNotifications.length > 5 && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-small"
                    onClick={() => setShowAllRead((prev) => !prev)}
                    aria-pressed={showAllRead}
                    aria-label={showAllRead ? 'Show fewer read notifications' : 'Show all read notifications'}
                  >
                    {showAllRead ? 'See less' : `See more (${readNotifications.length - 5})`}
                  </button>
                )}
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