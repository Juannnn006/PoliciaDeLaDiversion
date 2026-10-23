import { useState, useMemo } from 'react';
import { useApp, getInitials, getAvatarColor } from '../context/AppContext';
import { Vote, Clock, Users, Plus, X, AlertTriangle, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function CreatePollModal({ onClose }) {
  const { members, userProfile, createPoll } = useApp();
  const [form, setForm] = useState({
    question: '',
    targetMemberId: '',
    sanctionType: 'penalty',
    sanctionPoints: 10,
    expiresInHours: 24,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const otherMembers = members.filter(m => m.id !== userProfile?.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const target = members.find(m => m.id === form.targetMemberId);
    if (!target) return;

    setIsSubmitting(true);
    try {
      await createPoll({
        ...form,
        targetMemberName: target.displayName,
      });
      onClose();
    } catch (err) {
      // Error handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">📋 Nueva Votación</h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar modal">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="poll-question">¿Cuál es la acusación?</label>
            <textarea
              id="poll-question"
              className="form-textarea"
              name="question"
              value={form.question}
              onChange={e => setForm(prev => ({ ...prev, question: e.target.value }))}
              placeholder="Ej: ¿Quién canceló los planes del viernes?"
              required
              maxLength={200}
            />
            <p className="form-helper">{form.question.length}/200 caracteres</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="poll-target">¿A quién acusas?</label>
            <select
              id="poll-target"
              className="form-select"
              value={form.targetMemberId}
              onChange={e => setForm(prev => ({ ...prev, targetMemberId: e.target.value }))}
              required
            >
              <option value="">Selecciona un miembro</option>
              {otherMembers.map(m => (
                <option key={m.id} value={m.id}>{m.displayName}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="poll-sanction-type">Tipo de sanción</label>
            <select
              id="poll-sanction-type"
              className="form-select"
              value={form.sanctionType}
              onChange={e => setForm(prev => ({ ...prev, sanctionType: e.target.value }))}
            >
              <option value="penalty">🔴 Penalización (sube puntos = más cerca de ser policía)</option>
              <option value="reward">🟢 Recompensa (baja puntos = se aleja de ser policía)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="poll-points">Puntos en juego</label>
            <input
              id="poll-points"
              className="form-input"
              type="number"
              min="1"
              max="50"
              value={form.sanctionPoints}
              onChange={e => setForm(prev => ({ ...prev, sanctionPoints: e.target.value }))}
              required
            />
            <p className="form-helper">Entre 1 y 50 puntos</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="poll-duration">Duración de la votación</label>
            <select
              id="poll-duration"
              className="form-select"
              value={form.expiresInHours}
              onChange={e => setForm(prev => ({ ...prev, expiresInHours: Number(e.target.value) }))}
            >
              <option value={6}>6 horas</option>
              <option value={12}>12 horas</option>
              <option value={24}>24 horas</option>
              <option value={48}>48 horas</option>
              <option value={72}>72 horas</option>
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isSubmitting || !form.targetMemberId}
              id="submit-poll"
            >
              {isSubmitting ? 'Creando...' : 'Crear Votación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PollCard({ poll }) {
  const { user, votePoll, members, resolvePoll } = useApp();
  const [isVoting, setIsVoting] = useState(false);

  const totalVotes = poll.votesFor.length + poll.votesAgainst.length;
  const forPercent = totalVotes > 0 ? (poll.votesFor.length / totalVotes) * 100 : 50;
  const againstPercent = totalVotes > 0 ? (poll.votesAgainst.length / totalVotes) * 100 : 50;
  const hasVoted = poll.votesFor.includes(user?.uid) || poll.votesAgainst.includes(user?.uid);
  const isExpired = new Date(poll.expiresAt) < new Date();
  const isClosed = poll.status === 'closed';
  const isActive = !isClosed && !isExpired;

  // Time remaining
  const getTimeRemaining = () => {
    if (isClosed) return 'Cerrada';
    const now = new Date();
    const expires = new Date(poll.expiresAt);
    const diff = expires - now;
    if (diff <= 0) return 'Expirada';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleVote = async (voteType) => {
    setIsVoting(true);
    try {
      await votePoll(poll.id, voteType);
    } finally {
      setIsVoting(false);
    }
  };

  // Auto-resolve expired polls
  const handleResolve = async () => {
    await resolvePoll(poll.id);
  };

  const targetMember = members.find(m => m.id === poll.targetMemberId);

  return (
    <motion.div
      className={`poll-card ${isClosed ? 'expired' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="poll-header">
        <div className="poll-question">{poll.question}</div>
        <span className={`poll-badge ${isActive ? 'active' : 'closed'}`}>
          {isActive ? 'Activa' : 'Cerrada'}
        </span>
      </div>

      <div className="poll-meta">
        <span>Propuesta por {poll.createdByName}</span>
        <span className="poll-sanction-badge">•</span>
        <span className={`poll-sanction ${poll.sanctionType}`}>
          {poll.sanctionType === 'penalty' ? (
            <><AlertTriangle size={12} /> +{poll.sanctionPoints} pts</>
          ) : (
            <><Award size={12} /> -{poll.sanctionPoints} pts</>
          )}
        </span>
      </div>

      {/* Target member display */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem', 
        padding: '0.75rem',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '1rem'
      }}>
        <div 
          className="avatar avatar-sm"
          style={{ background: getAvatarColor(targetMember?.avatarIndex || 0) }}
        >
          {getInitials(poll.targetMemberName)}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
            Acusado: {poll.targetMemberName}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {poll.sanctionType === 'penalty' ? 'Recibirá puntos de penalización' : 'Será recompensado'}
          </div>
        </div>
      </div>

      {/* Voting buttons */}
      {isActive && !hasVoted && user?.uid !== poll.targetMemberId && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <button
            className="btn btn-danger btn-block"
            onClick={() => handleVote('for')}
            disabled={isVoting}
            style={{ flex: 1 }}
          >
            👎 Culpable
          </button>
          <button
            className="btn btn-secondary btn-block"
            onClick={() => handleVote('against')}
            disabled={isVoting}
            style={{ flex: 1 }}
          >
            👍 Inocente
          </button>
        </div>
      )}

      {hasVoted && (
        <div style={{ 
          textAlign: 'center', 
          padding: '0.5rem', 
          fontSize: '0.8rem', 
          color: 'var(--purple-400)',
          fontWeight: 600,
          marginBottom: '0.75rem'
        }}>
          ✓ Ya has votado
        </div>
      )}

      {user?.uid === poll.targetMemberId && isActive && (
        <div style={{ 
          textAlign: 'center', 
          padding: '0.5rem', 
          fontSize: '0.8rem', 
          color: 'var(--amber-400)',
          fontWeight: 600,
          marginBottom: '0.75rem'
        }}>
          ⚠️ Eres el acusado, no puedes votar
        </div>
      )}

      {/* Progress bar */}
      <div className="poll-progress">
        <div 
          className="poll-progress-bar left" 
          style={{ width: `${forPercent}%` }}
        />
        <div 
          className="poll-progress-bar right" 
          style={{ width: `${againstPercent}%` }}
        />
      </div>

      <div className="poll-footer">
        <div className="poll-timer">
          <Clock size={12} />
          {getTimeRemaining()}
        </div>
        <div className="poll-total-votes">
          <Users size={12} style={{ marginRight: '0.25rem' }} />
          {totalVotes} votos
        </div>
      </div>

      {/* Resolve button for expired polls */}
      {isExpired && !isClosed && (
        <button 
          className="btn btn-primary btn-sm btn-block" 
          onClick={handleResolve}
          style={{ marginTop: '0.75rem' }}
        >
          Resolver votación
        </button>
      )}
    </motion.div>
  );
}

export default function PollsPage() {
  const { polls } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('active');

  const filteredPolls = useMemo(() => {
    if (filter === 'active') return polls.filter(p => p.status === 'active');
    if (filter === 'closed') return polls.filter(p => p.status === 'closed');
    return polls;
  }, [polls, filter]);

  return (
    <div>
      <h2 className="section-title">
        <Vote size={22} /> Votaciones
      </h2>

      <div className="tabs">
        <button 
          className={`tab ${filter === 'active' ? 'active' : ''}`} 
          onClick={() => setFilter('active')}
        >
          Activas
        </button>
        <button 
          className={`tab ${filter === 'closed' ? 'active' : ''}`} 
          onClick={() => setFilter('closed')}
        >
          Cerradas
        </button>
        <button 
          className={`tab ${filter === 'all' ? 'active' : ''}`} 
          onClick={() => setFilter('all')}
        >
          Todas
        </button>
      </div>

      <div className="polls-grid">
        <AnimatePresence>
          {filteredPolls.map(poll => (
            <PollCard key={poll.id} poll={poll} />
          ))}
        </AnimatePresence>
      </div>

      {filteredPolls.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">
            {filter === 'active' ? 'No hay votaciones activas' : 'No hay votaciones'}
          </div>
          <div className="empty-state-text">
            Crea una nueva votación para acusar a alguien del grupo
          </div>
        </div>
      )}

      {/* FAB */}
      <button 
        className="btn-fab" 
        onClick={() => setShowCreateModal(true)}
        aria-label="Crear nueva votación"
        id="create-poll-fab"
      >
        <Plus size={24} />
      </button>

      {/* Create Poll Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreatePollModal onClose={() => setShowCreateModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
