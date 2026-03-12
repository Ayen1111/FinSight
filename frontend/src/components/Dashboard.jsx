import { useState } from 'react';
import { LayoutDashboard, CalendarDays, CalendarRange, Lightbulb } from 'lucide-react';
import OverviewTab from './OverviewTab';
import MonthlyTab from './MonthlyTab';
import WeeklyTab from './WeeklyTab';
import InsightsTab from './InsightsTab';

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'monthly', label: 'Monthly', icon: CalendarDays },
  { id: 'weekly', label: 'Weekly', icon: CalendarRange },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
];

export default function Dashboard({ initialData }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState(null);

  const handleDrillDown = (month) => {
    setSelectedMonth(month);
    setActiveTab('weekly');
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab initialData={initialData} />;
      case 'monthly':
        return <MonthlyTab onDrillDown={handleDrillDown} />;
      case 'weekly':
        return <WeeklyTab selectedMonth={selectedMonth} />;
      case 'insights':
        return <InsightsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="fade-in">
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 p-1.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id ? 'active' : ''
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="slide-up" key={activeTab}>
        {renderTab()}
      </div>
    </div>
  );
}
