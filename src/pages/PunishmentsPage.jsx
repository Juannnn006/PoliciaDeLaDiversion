import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Skull, Plus, CheckCircle, Clock, Calendar, X, AlertOctagon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function AddPunishmentModal({ onClose }) {
  const { members, currentPolice, addPunishment } = useApp();
  const currentDate = new Date();
  
  const [form, setForm] = useState({
    memberId: currentPolice?.id || (members[0]?.id || ''),
    description: '',
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const target = members.find(m => m.id === form.memberId);
    if (!target) return;

    setIsSubmitting(true);
    try {
      await addPunishment({
        month: form.month,
        year: form.year,
        memberId: target.id,
        memberName: target.displayName,
        description: form.description,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">💀 Acordar Castigo Mensual</h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar modal">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="punishment-target">¿Quién cumple el castigo?</label>
            <select
              id="punishment-target"
              className="form-select"
              value={form.memberId}
              onChange={e => setForm(prev => ({ ...prev, memberId: e.target.value }))}
              required
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.displayName} {m.id === currentPolice?.id ? '(🚨 Policía actual)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="punishment-month">Mes</label>
              <select
                id="punishment-month"
                className="form-select"
                value={form.month}
                onChange={e => setForm(prev => ({ ...prev, month: Number(e.target.value) }))}
              >
                {monthNames.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>{name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="punishment-year">Año</label>
              <input
                id="punishment-year"
                className="form-input"
                type="number"
                value={form.year}
                onChange={e => setForm(prev => ({ ...prev, year: Number(e.target.value) }))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="punishment-description">Castigo acordado por el grupo</label>
            <textarea
              id="punishment-description"
              className="form-textarea"
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Ej: Invitar a la primera ronda de cervezas / Llevar puesto un sombrero de fiesta ridículo todo el sábado"
              required
              rows={3}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-danger" 
              disabled={isSubmitting || !form.description.trim()}
            >
              {isSubmitting ? 'Guardando...' : 'Asignar Castigo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PunishmentsPage() {
  const { punishments, completePunishment, currentPolice } = useApp();
  const [showModal, setShowModal] = useState(false);

  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  const formatMonth = (monthString) => {
    if (!monthString) return { month: 'MES', year: '' };
    const [year, month] = monthString.split('-');
    const mIdx = parseInt(month, 10) - 1;
    return {
      month: monthNames[mIdx] || month,
      year: year
    };
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          <Skull size={22} /> Castigos Mensuales
        </h2>
        <button 
          className="btn btn-primary btn-sm" 
          onClick={() => setShowModal(true)}
          id="btn-add-punishment"
        >
          <Plus size={16} /> Acordar Castigo
        </button>
      </div>

      {currentPolice && (
        <div 
          className="card" 
          style={{ 
            marginBottom: '1.5rem', 
            background: 'linear-gradient(135deg, rgba(244,63,94,0.12), rgba(15,15,42,0.8))',
            borderColor: 'rgba(244,63,94,0.3)' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertOctagon size={28} color="var(--rose-400)" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                Condenado del Mes: {currentPolice.displayName}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Tiene {currentPolice.points} puntos acumulados. Debe cumplir la penitencia del grupo antes de final de mes.
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <AnimatePresence>
          {punishments.map((item, index) => {
            const { month, year } = formatMonth(item.month);
            const isCompleted = item.status === 'completed';

            return (
              <motion.div
                key={item.id}
                className="punishment-card"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
              >
                <div className="punishment-month">
                  <div className="punishment-month-label">{year}</div>
                  <div className="punishment-month-name">{month}</div>
                </div>

                <div className="punishment-info">
                  <div className="punishment-name">
                    {item.memberName}
                  </div>
                  <div className="punishment-description">
                    "{item.description}"
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span className={`punishment-status ${isCompleted ? 'completed' : 'pending'}`}>
                      {isCompleted ? '✓ Cumplido' : '⏳ Pendiente'}
                    </span>

                    {!isCompleted && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => completePunishment(item.id)}
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                      >
                        <CheckCircle size={14} color="var(--emerald-400)" />
                        Marcar cumplido
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {punishments.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">⚖️</div>
          <div className="empty-state-title">Aún no hay castigos registrados</div>
          <div className="empty-state-text">
            Cuando termine el mes, acuerden el castigo para el Policía de la Diversión y regístralo aquí.
          </div>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <AddPunishmentModal onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
