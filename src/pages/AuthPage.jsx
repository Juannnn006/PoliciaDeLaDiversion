import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { KeyRound, LogIn, UserPlus, Plus, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function AuthPage() {
  const { login, register, createGroup, joinGroup, addToast, loginAsDemoUser, user } = useApp();
  const [activeMode, setActiveMode] = useState('code'); // 'code', 'login', 'create'
  
  const [formData, setFormData] = useState({
    displayName: '',
    groupCode: '',
    email: '',
    password: '',
    groupName: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Join or reconnect to group directly via code
  const handleJoinByCode = async (e) => {
    e.preventDefault();
    const cleanCode = (formData.groupCode || '').trim().toUpperCase();
    const cleanName = (formData.displayName || '').trim();

    if (!cleanCode) {
      addToast('Por favor escribe el código del grupo', 'error');
      return;
    }
    if (!cleanName) {
      addToast('Por favor escribe tu nombre o apodo', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await joinGroup(cleanCode, user?.uid, cleanName, formData.email);
      // joinGroup automatically redirects to activeTab 'ranking' and deduplicates
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Login via email/password
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password.trim()) {
      addToast('Completa todos los campos', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await login(formData.email.trim(), formData.password.trim());
    } catch (err) {
      addToast('Credenciales incorrectas: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Create new group
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    const cleanGroupName = (formData.groupName || '').trim();
    const cleanName = (formData.displayName || '').trim();

    if (!cleanGroupName) {
      addToast('Escribe un nombre para el grupo', 'error');
      return;
    }
    if (!cleanName) {
      addToast('Escribe tu nombre', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await createGroup(cleanGroupName, user?.uid, cleanName);
    } catch (err) {
      addToast('Error al crear grupo: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">🚔</div>
        <h1 className="auth-title">Policía de la Diversión</h1>
        <p className="auth-subtitle">
          Ranking y encuestas para cazar al aguafiestas del mes
        </p>

        {/* Tab selection */}
        <div className="tabs" style={{ marginBottom: '1.25rem' }}>
          <button
            type="button"
            className={`tab ${activeMode === 'code' ? 'active' : ''}`}
            onClick={() => setActiveMode('code')}
            id="tab-join-code"
          >
            <KeyRound size={15} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            Entrar con Código
          </button>
          <button
            type="button"
            className={`tab ${activeMode === 'login' ? 'active' : ''}`}
            onClick={() => setActiveMode('login')}
            id="tab-email-login"
          >
            <LogIn size={15} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            Email
          </button>
          <button
            type="button"
            className={`tab ${activeMode === 'create' ? 'active' : ''}`}
            onClick={() => setActiveMode('create')}
            id="tab-create-group"
          >
            <Plus size={15} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            Nuevo Grupo
          </button>
        </div>

        {/* Mode 1: Enter with Group Code */}
        {activeMode === 'code' && (
          <form className="auth-form" onSubmit={handleJoinByCode}>
            <div className="form-group">
              <label className="form-label" htmlFor="input-name">Tu nombre o apodo</label>
              <input
                id="input-name"
                className="form-input"
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="Ej: Dani, Laura, Carlos..."
                required
                autoComplete="name"
              />
              <p className="form-helper">Si ya perteneces al grupo, pon tu mismo nombre para entrar sin duplicarte</p>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-code">Código del grupo</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="input-code"
                  className="form-input"
                  type="text"
                  name="groupCode"
                  value={formData.groupCode}
                  onChange={handleChange}
                  placeholder="Ej: DIVERSION-DEMO"
                  required
                  style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}
                />
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, groupCode: 'DIVERSION-DEMO', displayName: prev.displayName || 'Dani' }))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--cyan-400)',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  padding: '0.2rem 0',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Sparkles size={12} /> Usar código demo: DIVERSION-DEMO
              </button>
            </div>

            <button 
              className="btn btn-primary btn-block btn-lg" 
              type="submit" 
              disabled={isLoading}
              id="submit-join-code"
            >
              <ArrowRight size={18} />
              {isLoading ? 'Comprobando código...' : 'Entrar a mi Grupo'}
            </button>
          </form>
        )}

        {/* Mode 2: Email Login */}
        {activeMode === 'login' && (
          <form className="auth-form" onSubmit={handleEmailLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Correo electrónico</label>
              <input
                id="login-email"
                className="form-input"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Contraseña</label>
              <input
                id="login-password"
                className="form-input"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <button 
              className="btn btn-primary btn-block btn-lg" 
              type="submit" 
              disabled={isLoading}
              id="login-submit"
            >
              <LogIn size={18} />
              {isLoading ? 'Entrando...' : 'Iniciar Sesión'}
            </button>
          </form>
        )}

        {/* Mode 3: Create New Group */}
        {activeMode === 'create' && (
          <form className="auth-form" onSubmit={handleCreateGroup}>
            <div className="form-group">
              <label className="form-label" htmlFor="create-admin-name">Tu nombre</label>
              <input
                id="create-admin-name"
                className="form-input"
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="Tu nombre de miembro"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="create-group-name">Nombre del nuevo grupo</label>
              <input
                id="create-group-name"
                className="form-input"
                type="text"
                name="groupName"
                value={formData.groupName}
                onChange={handleChange}
                placeholder="Ej: Los Fiesteros FC"
                required
              />
              <p className="form-helper">Se generará un código único para compartir con tus amigos</p>
            </div>
            <button 
              className="btn btn-primary btn-block btn-lg" 
              type="submit" 
              disabled={isLoading}
              id="create-group-submit"
            >
              <Plus size={18} />
              {isLoading ? 'Creando grupo...' : 'Crear Grupo y Obtener Código'}
            </button>
          </form>
        )}

        <div className="auth-divider">o acceso rápido</div>

        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={() => loginAsDemoUser(2)}
          id="demo-login-btn"
          style={{ borderColor: 'var(--purple-500)', color: 'var(--purple-300)' }}
        >
          ⚡ Probar Directo con Dani (5 amigos listos)
        </button>
      </div>
    </div>
  );
}
