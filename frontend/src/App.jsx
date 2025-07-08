import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import HotelManagement from './components/HotelManagement';
import UploadComponent from './components/UploadComponent';
import ComparativeDashboard from './components/ComparativeDashboard';
import PlanilhasManagement from './components/PlanilhasManagement';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Header activeTab={activeTab} onTabChange={handleTabChange} />
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/hotels" element={<HotelManagement />} />
            <Route path="/upload" element={<UploadComponent />} />
            <Route path="/planilhas" element={<PlanilhasManagement />} />
            <Route path="/comparative" element={<ComparativeDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

