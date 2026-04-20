import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../api/userApi";
import formatDate from "../../utils/formatDate";

function NotificationBellIcon() {
  return (
    <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
      <path d="M7 17.25h10" />
      <path d="M9 20a3 3 0 0 0 6 0" />
      <path d="M6.5 17.25V11a5.5 5.5 0 1 1 11 0v6.25" />
      <path d="M6.5 17.25 4.75 19h14.5l-1.75-1.75" />
      <path d="M9.1 4.1A5.6 5.6 0 0 1 12 3.25a5.6 5.6 0 0 1 2.9.85" />
      <path d="M6 4.5a8.4 8.4 0 0 0-1.5 2.8" />
      <path d="M18 4.5a8.4 8.4 0 0 1 1.5 2.8" />
    </svg>
  );
}

function NotificationCenter({ userId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const applyNotificationSnapshot = (payload) => {
    setNotifications(payload.items || []);
    setUnreadCount(payload.unreadCount || 0);
  };

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setError("");
      return undefined;
    }

    let isMounted = true;

    const loadNotifications = async (background = false) => {
      try {
        if (!background && isMounted) {
          setLoading(true);
        }

        const response = await getNotifications({ limit: 12 });

        if (!isMounted) {
          return;
        }

        applyNotificationSnapshot(response.data || {});
        setError("");
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.response?.data?.message || "Không tải được thông báo.");
        }
      } finally {
        if (isMounted && !background) {
          setLoading(false);
        }
      }
    };

    loadNotifications();
    const intervalId = window.setInterval(() => {
      loadNotifications(true);
    }, isOpen ? 10000 : 18000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [userId, location.pathname, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleOpenNotification = async (notification) => {
    if (!notification.read) {
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                read: true,
                readAt: new Date().toISOString(),
              }
            : item
        )
      );
      setUnreadCount((current) => Math.max(0, current - 1));

      try {
        const response = await markNotificationRead(notification.id);
        if (response.data?.notification) {
          setNotifications((current) =>
            current.map((item) => (item.id === notification.id ? response.data.notification : item))
          );
          setUnreadCount(response.data.unreadCount ?? 0);
        }
      } catch {
        // Polling will reconcile notification state if this request fails.
      }
    }

    setIsOpen(false);

    if (notification.actionPath) {
      navigate(notification.actionPath);
    }
  };

  const handleMarkAll = async () => {
    try {
      setMarkingAll(true);
      const response = await markAllNotificationsRead();
      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          read: true,
          readAt: item.readAt || new Date().toISOString(),
        }))
      );
      setUnreadCount(response.data?.unreadCount ?? 0);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể đánh dấu đã đọc.");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="notification-center" ref={containerRef}>
      <button
        type="button"
        className={isOpen ? "notification-trigger is-open" : "notification-trigger"}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="notification-trigger__icon">
          <NotificationBellIcon />
        </span>
        <span className="notification-trigger__label">Thông báo</span>
        {unreadCount ? (
          <span className="notification-trigger__count">{unreadCount > 99 ? "99+" : unreadCount}</span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="notification-popover">
          <div className="notification-popover__header">
            <div>
              <p className="eyebrow">Trung tâm thông báo</p>
              <h3>Thông báo mới</h3>
            </div>
            <button
              type="button"
              className="ghost-button compact"
              onClick={handleMarkAll}
              disabled={!unreadCount || markingAll}
            >
              {markingAll ? "Đang cập nhật..." : "Đánh dấu tất cả"}
            </button>
          </div>

          {loading ? <div className="notification-popover__empty">Đang tải thông báo...</div> : null}
          {!loading && error ? <div className="notification-popover__empty">{error}</div> : null}
          {!loading && !error && !notifications.length ? (
            <div className="notification-popover__empty">Chưa có thông báo nào cho bạn.</div>
          ) : null}

          {!loading && !error && notifications.length ? (
            <div className="notification-list">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={notification.read ? "notification-item" : "notification-item is-unread"}
                  onClick={() => handleOpenNotification(notification)}
                >
                  <span
                    className={`notification-item__status notification-item__status--${notification.severity || "info"}`}
                  />
                  <div className="notification-item__content">
                    <div className="notification-item__topline">
                      <strong>{notification.title}</strong>
                      <span>{formatDate(notification.createdAt)}</span>
                    </div>
                    <p>{notification.message}</p>
                    {notification.actor ? (
                      <div className="notification-item__actor">
                        <span className="avatar-badge">{notification.actor.avatar || "NA"}</span>
                        <span>{notification.actor.fullName}</span>
                      </div>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default NotificationCenter;
