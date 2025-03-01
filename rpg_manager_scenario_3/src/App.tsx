import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CampaignsPage from './pages/campaigns/CampaignsPage';
import NewCampaignPage from './pages/campaigns/NewCampaignPage';
import EditCampaignPage from './pages/campaigns/EditCampaignPage';
import CampaignDetailsPage from './pages/campaigns/CampaignDetailsPage';
import NewScenarioPage from './pages/scenarios/NewScenarioPage';
import EditScenarioPage from './pages/scenarios/EditScenarioPage';
import ScenarioDetailsPage from './pages/scenarios/ScenarioDetailsPage';
import NewNpcPage from './pages/npcs/NewNpcPage';
import EditNpcPage from './pages/npcs/EditNpcPage';
import NpcDetailsPage from './pages/npcs/NpcDetailsPage';
import NewSessionPage from './pages/sessions/NewSessionPage';
import EditSessionPage from './pages/sessions/EditSessionPage';
import SessionDetailsPage from './pages/sessions/SessionDetailsPage';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

function App() {
  const { getUser, processMagicLink } = useAuthStore();
  
  useEffect(() => {
    getUser();
    processMagicLink();
  }, [getUser, processMagicLink]);
  
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        
        {/* Campaign Routes */}
        <Route path="/campaigns" element={
          <ProtectedRoute>
            <CampaignsPage />
          </ProtectedRoute>
        } />
        <Route path="/campaigns/new" element={
          <ProtectedRoute>
            <NewCampaignPage />
          </ProtectedRoute>
        } />
        <Route path="/campaigns/:id" element={
          <ProtectedRoute>
            <CampaignDetailsPage />
          </ProtectedRoute>
        } />
        <Route path="/campaigns/:id/edit" element={
          <ProtectedRoute>
            <EditCampaignPage />
          </ProtectedRoute>
        } />
        
        {/* Scenario Routes */}
        <Route path="/campaigns/:campaignId/scenarios/new" element={
          <ProtectedRoute>
            <NewScenarioPage />
          </ProtectedRoute>
        } />
        <Route path="/scenarios/:id" element={
          <ProtectedRoute>
            <ScenarioDetailsPage />
          </ProtectedRoute>
        } />
        <Route path="/scenarios/:id/edit" element={
          <ProtectedRoute>
            <EditScenarioPage />
          </ProtectedRoute>
        } />
        
        {/* NPC Routes */}
        <Route path="/campaigns/:campaignId/npcs/new" element={
          <ProtectedRoute>
            <NewNpcPage />
          </ProtectedRoute>
        } />
        <Route path="/npcs/:id" element={
          <ProtectedRoute>
            <NpcDetailsPage />
          </ProtectedRoute>
        } />
        <Route path="/npcs/:id/edit" element={
          <ProtectedRoute>
            <EditNpcPage />
          </ProtectedRoute>
        } />
        
        {/* Session Routes */}
        <Route path="/campaigns/:campaignId/sessions/new" element={
          <ProtectedRoute>
            <NewSessionPage />
          </ProtectedRoute>
        } />
        <Route path="/sessions/:id" element={
          <ProtectedRoute>
            <SessionDetailsPage />
          </ProtectedRoute>
        } />
        <Route path="/sessions/:id/edit" element={
          <ProtectedRoute>
            <EditSessionPage />
          </ProtectedRoute>
        } />
        
        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;