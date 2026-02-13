import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
// Placeholder imports for pages
const Dashboard = () => <div className="card"><h2>Dashboard</h2><p>Coming Soon</p></div>;
const FoodInput = () => <div className="card"><h2>Food Input</h2><p>Coming Soon</p></div>;
const Trends = () => <div className="card"><h2>Trends</h2><p>Coming Soon</p></div>;
const Settings = () => <div className="card"><h2>Settings</h2><p>Coming Soon</p></div>;

// We will replace these placeholders as we build the pages.
import DashboardPage from './pages/Dashboard';
import FoodInputPage from './pages/FoodInput';
import TrendsPage from './pages/Trends';
import SettingsPage from './pages/Settings';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/input" element={<FoodInputPage />} />
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
