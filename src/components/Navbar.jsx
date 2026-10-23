import { useApp, getInitials, getAvatarColor } from '../context/AppContext';
import { Shield, Bell, LogOut } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { userProfile, unreadNotifications, logout, currentPolice } = useApp();

  return (
    <header className="navbar">
      <div 
        className="navbar-brand" 
        style={{ cursor: 'pointer' }}
        onClick={() => setActiveTab('ranking')}
      >
        <div className="navbar-logo">
          <Shield size={20} color="#fff" />
        </div>
        <div>
          <div className="navbar-title">Policía de la Diversión</div>
          <div className="navbar-subtitle">
            {currentPolice ? `🚨 Alerta: ${currentPolice.displayName}` : 'Caza al aguafiestas'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          className="bottom-nav-item"
          style={{ position: 'relative', padding: '0.4rem', border: 'none' }}
          onClick={() => setActiveTab('notifications')}
          title="Notificaciones"
        >
          <Bell size={20} color={activeTab === 'notifications' ? 'var(--purple-400)' : 'var(--text-secondary)'} />
          {unreadNotifications > 0 && (
            <span style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              background: 'var(--rose-500)',
              color: 'white',
              fontSize: '0.65rem',
              fontWeight: 800,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {unreadNotifications}
            </span>
          )}
        </button>

        {userProfile && (
          <div 
            className="navbar-user"
            title={`${userProfile.displayName} (${userProfile.points} puntos)`}
          >
            <div 
              className="avatar avatar-sm"
              style={{ 
                background: getAvatarColor(userProfile.avatarIndex || 0),
                width: '26px',
                height: '26px',
                fontSize: '0.75rem'
              }}
            >
              {getInitials(userProfile.displayName)}
            </div>
            <span className="navbar-user-name">
              {userProfile.displayName.split(' ')[0]}
            </span>
            <span className="navbar-user-points">
              {userProfile.points}p
            </span>
          </div>
        )}

        <button
          className="btn btn-secondary btn-sm"
          style={{ padding: '0.4rem', display: 'flex', alignItems: 'center' }}
          onClick={logout}
          title="Cerrar sesión"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
