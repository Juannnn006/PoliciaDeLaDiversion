import { Trophy, Vote, Skull, Activity } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'ranking', label: 'Ranking', icon: Trophy },
    { id: 'polls', label: 'Votaciones', icon: Vote },
    { id: 'punishments', label: 'Castigos', icon: Skull },
    { id: 'activity', label: 'Actividad', icon: Activity },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon size={20} />
            <span className="bottom-nav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
