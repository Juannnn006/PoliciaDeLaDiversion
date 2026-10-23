import { useApp } from '../context/AppContext';
import { Bell, Check, BellOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes}m`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days < 7) return `Hace ${days}d`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function NotificationsPage() {
  const { notifications, markNotificationRead } = useApp();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          <Bell size={22} /> Notificaciones
        </h2>
      </div>

      <div className="notification-list">
        <AnimatePresence>
          {notifications.map((notif, index) => (
            <motion.div
              key={notif.id}
              className={`notification-item ${!notif.read ? 'unread' : ''}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              onClick={() => !notif.read && markNotificationRead(notif.id)}
              style={{ cursor: !notif.read ? 'pointer' : 'default' }}
            >
              <div className="notification-dot" />
              <div className="notification-content">
                <div className="notification-text">
                  {notif.text}
                </div>
                <div className="notification-time">
                  {formatTimeAgo(notif.createdAt)}
                </div>
              </div>
              {!notif.read && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    markNotificationRead(notif.id);
                  }}
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                  title="Marcar como leída"
                >
                  <Check size={12} />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {notifications.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <BellOff size={48} />
          </div>
          <div className="empty-state-title">Todo al día</div>
          <div className="empty-state-text">
            No tienes notificaciones pendientes en este momento.
          </div>
        </div>
      )}
    </div>
  );
}
