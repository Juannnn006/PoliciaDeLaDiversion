import { useState } from 'react';
import { useApp, getInitials, getAvatarColor } from '../context/AppContext';
import { Trophy, TrendingUp, TrendingDown, Shield, Crown, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomePage() {
  const { members, currentPolice, groupId, userProfile, addToast } = useApp();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    if (groupId) {
      try {
        await navigator.clipboard.writeText(groupId);
        setCopied(true);
        addToast('Código copiado al portapapeles', 'success');
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback for browsers without clipboard API
        addToast('No se pudo copiar automáticamente', 'error');
      }
    }
  };

  return (
    <div>
      {/* Shame Crown Section */}
      {currentPolice && (
        <motion.div
          className="shame-crown"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="shame-crown-content">
            <div className="shame-badge">
              <Shield size={36} />
            </div>
            <div className="shame-info">
              <div className="shame-label">🚨 Policía de la Diversión Actual</div>
              <div className="shame-name">{currentPolice.displayName}</div>
              <div className="shame-points">
                <strong>{currentPolice.points} pts</strong> — El aguafiestas del mes
              </div>
              <div className="shame-description">
                {currentPolice.id === userProfile?.id 
                  ? '¡Eres tú! 😱 Más te vale portarte bien para bajar esos puntos...'
                  : `${currentPolice.displayName} ostenta la corona de la vergüenza este mes.`}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Group Code */}
      {groupId && (
        <motion.div 
          className="card" 
          style={{ marginBottom: '1.5rem', cursor: 'pointer' }}
          onClick={handleCopyCode}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Código del grupo
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--purple-400)', fontWeight: 700, marginTop: '0.25rem' }}>
                {groupId}
              </div>
            </div>
            {copied ? <Check size={18} color="var(--emerald-400)" /> : <Copy size={18} color="var(--text-muted)" />}
          </div>
        </motion.div>
      )}

      {/* Ranking */}
      <h2 className="section-title">
        <Trophy size={22} /> Clasificación General
      </h2>

      <div className="ranking-list">
        <AnimatePresence>
          {members.map((member, index) => (
            <motion.div
              key={member.id}
              className={`ranking-item ${index === 0 ? 'top-1' : ''} ${index === 1 ? 'top-2' : ''} ${index === 2 ? 'top-3' : ''}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              layout
            >
              <div className="ranking-position">
                {index === 0 ? <Crown size={20} /> : `#${index + 1}`}
              </div>

              <div 
                className="ranking-avatar"
                style={{ background: getAvatarColor(member.avatarIndex || index) }}
              >
                {getInitials(member.displayName)}
              </div>

              <div className="ranking-info">
                <div className="ranking-name">
                  {member.displayName}
                  {member.id === userProfile?.id && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--purple-400)', marginLeft: '0.5rem' }}>
                      (Tú)
                    </span>
                  )}
                </div>
                <div className="ranking-subtitle">
                  {index === 0 ? '🚨 Policía de la Diversión' : `Puesto #${index + 1}`}
                </div>
              </div>

              <div className="ranking-points">{member.points} pts</div>

              {member.points !== 0 && (
                <div className={`ranking-trend ${member.points > 0 ? 'up' : 'down'}`}>
                  {member.points > 0 ? (
                    <><TrendingUp size={12} /> +{member.points}</>
                  ) : (
                    <><TrendingDown size={12} /> {member.points}</>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {members.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-title">Sin miembros aún</div>
          <div className="empty-state-text">
            Comparte el código del grupo con tus amigos para que se unan
          </div>
        </div>
      )}
    </div>
  );
}
