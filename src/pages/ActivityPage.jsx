import { useApp } from '../context/AppContext';
import { Activity, Vote, AlertTriangle, Award, Skull } from 'lucide-react';
import { motion } from 'framer-motion';

function getActivityIcon(type) {
  switch (type) {
    case 'vote': return { icon: '📋', className: 'vote' };
    case 'penalty': return { icon: '🔴', className: 'penalty' };
    case 'reward': return { icon: '🟢', className: 'reward' };
    case 'punishment': return { icon: '💀', className: 'punishment' };
    case 'join': return { icon: '🎉', className: 'vote' };
    default: return { icon: '📌', className: 'vote' };
  }
}

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

export default function ActivityPage() {
  const { activities } = useApp();

  return (
    <div>
      <h2 className="section-title">
        <Activity size={22} /> Actividad Reciente
      </h2>

      <div className="card">
        {activities.length > 0 ? (
          activities.map((activity, index) => {
            const { icon, className } = getActivityIcon(activity.type);
            return (
              <motion.div
                key={activity.id}
                className="activity-item"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <div className={`activity-icon ${className}`}>
                  {icon}
                </div>
                <div className="activity-text">
                  {activity.text}
                </div>
                <div className="activity-time">
                  {formatTimeAgo(activity.createdAt)}
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">Sin actividad aún</div>
            <div className="empty-state-text">
              Aquí aparecerá toda la actividad del grupo
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
