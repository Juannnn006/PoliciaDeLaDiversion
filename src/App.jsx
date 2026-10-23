import { useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import ToastContainer from './components/ToastContainer';
import HomePage from './pages/HomePage';
import PollsPage from './pages/PollsPage';
import PunishmentsPage from './pages/PunishmentsPage';
import ActivityPage from './pages/ActivityPage';
import NotificationsPage from './pages/NotificationsPage';
import AuthPage from './pages/AuthPage';

export default function App() {
  const { user, loading, groupId, activeTab, setActiveTab } = useApp();

  if (loading) {
    return (
      <div className="loader" style={{ minHeight: '100vh' }}>
        <div className="loader-spinner" />
      </div>
    );
  }

  // If user is not logged in or not associated with a group yet, show auth/setup flow
  if (!user || !groupId) {
    return (
      <>
        <ToastContainer />
        <AuthPage />
      </>
    );
  }

  return (
    <div className="app-layout">
      <ToastContainer />
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="app-main">
        {activeTab === 'ranking' && <HomePage />}
        {activeTab === 'polls' && <PollsPage />}
        {activeTab === 'punishments' && <PunishmentsPage />}
        {activeTab === 'activity' && <ActivityPage />}
        {activeTab === 'notifications' && <NotificationsPage />}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
