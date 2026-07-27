import { useState, useEffect } from 'react';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';
import NotificationPanel from '../components/NotificationPanel';
import TripPlannerModal from '../components/TripPlannerModal';
import SimulatorTab from '../components/tabs/SimulatorTab';
import GraphTab from '../components/tabs/GraphTab';
import SwarmTab from '../components/tabs/SwarmTab';
import TwinTab from '../components/tabs/TwinTab';
import LogsTab from '../components/tabs/LogsTab';
import FlightsTab from '../components/tabs/FlightsTab';
import AlertHistoryTab from '../components/tabs/AlertHistoryTab';
import AnalyticsTab from '../components/tabs/AnalyticsTab';
import SettingsTab from '../components/tabs/SettingsTab';
import API from '../services/api';

export default function AtlasDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'simulator');

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'simulator';
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/dashboard?tab=${tabId}`, { replace: true });
  };
  const [simState, setSimState] = useState({ disrupted: false, logs: [], agentStates: {}, alertActive: false });
  const [prefs, setPrefs] = useState({ cost: 85, loyalty: 60, layover: 75, hotel: 90 });
  const [journeyScore, setJourneyScore] = useState(97);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  // Journeys & Custom Trip Planner state
  const [journeys, setJourneys] = useState([]);
  const [activeJourney, setActiveJourney] = useState(null);
  const [tripPlannerOpen, setTripPlannerOpen] = useState(false);

  // Fetch initial unread notification count & user journeys
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [notifRes, journeyRes] = await Promise.all([
          API.get('/notifications?limit=50'),
          API.get('/journeys')
        ]);
        const unread = notifRes.data.filter(n => !n.is_read).length;
        setNotifCount(unread);
        setJourneys(journeyRes.data);
        if (journeyRes.data.length > 0 && !activeJourney) {
          setActiveJourney(journeyRes.data[0]);
        }
      } catch (e) {
        console.error('Initial dashboard fetch error:', e);
      }
    };
    fetchData();
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  const handleSelectJourney = (journey) => {
    setActiveJourney(journey);
  };

  const handleTripCreated = (newJourney) => {
    setJourneys(prev => [newJourney, ...prev]);
    setActiveJourney(newJourney);
  };

  const handleSimUpdate = (update) => {
    setSimState(prev => ({
      ...prev,
      ...update
    }));
  };

  const handlePrefsChange = (newPrefs) => {
    setPrefs(newPrefs);
  };

  const handleExportPDF = async () => {
    try {
      const response = await API.get('/export/pdf', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ATLAS_Executive_Report_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (e) {
      console.error('PDF export failed:', e);
      alert('Failed to generate PDF. Please ensure backend server is running.');
    }
  };

  return (
    <div className={`app-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <svg className="svg-defs" aria-hidden="true">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#006FCF"/>
            <stop offset="100%" stopColor="#00A650"/>
          </linearGradient>
          <linearGradient id="gaugeGradWarn" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B"/>
            <stop offset="100%" stopColor="#C41E3A"/>
          </linearGradient>
        </defs>
      </svg>

      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="main-content">
        <TopHeader
          activeTab={activeTab}
          onTabChange={handleTabChange}
          journeyScore={journeyScore}
          alertActive={simState.alertActive}
          notifCount={notifCount}
          onNotifClick={() => setNotifPanelOpen(!notifPanelOpen)}
          journeys={journeys}
          activeJourney={activeJourney}
          onSelectJourney={handleSelectJourney}
          onOpenTripPlanner={() => setTripPlannerOpen(true)}
          onExportPDF={handleExportPDF}
        />

        {activeTab === 'simulator' && (
          <SimulatorTab onSimulationUpdate={handleSimUpdate} prefs={prefs} activeJourney={activeJourney} />
        )}
        {activeTab === 'graph' && (
          <GraphTab disrupted={simState.disrupted} activeJourney={activeJourney} />
        )}
        {activeTab === 'swarm' && (
          <SwarmTab agentStates={simState.agentStates} />
        )}
        {activeTab === 'flights' && (
          <FlightsTab />
        )}
        {activeTab === 'twin' && (
          <TwinTab onPrefsChange={handlePrefsChange} />
        )}
        {activeTab === 'history' && (
          <AlertHistoryTab />
        )}
        {activeTab === 'logs' && (
          <LogsTab logs={simState.logs} />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsTab />
        )}
        {activeTab === 'settings' && (
          <SettingsTab />
        )}
      </div>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={notifPanelOpen}
        onClose={() => setNotifPanelOpen(false)}
        onCountUpdate={setNotifCount}
      />

      {/* Custom Trip Planner Modal */}
      <TripPlannerModal
        isOpen={tripPlannerOpen}
        onClose={() => setTripPlannerOpen(false)}
        onTripCreated={handleTripCreated}
      />
    </div>
  );
}
