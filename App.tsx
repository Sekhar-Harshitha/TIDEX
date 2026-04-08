
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Reports } from './pages/Reports';
import { MobileSimulator } from './pages/MobileSimulator';
import { SocialFeed } from './pages/SocialFeed';
import { MapExplorer } from './pages/MapExplorer';
import { Auth } from './pages/Auth';
import { LocationGuard } from './components/LocationGuard';
import { ElectricalDashboard } from './pages/ElectricalDashboard';
import { SafetyGuide } from './pages/SafetyGuide';
import { Profile } from './pages/Profile';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useApp();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <LocationGuard>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/electrical-admin" element={<ElectricalDashboard />} />
                    <Route path="/map" element={<MapExplorer />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/mobile-sim" element={<MobileSimulator />} />
                    <Route path="/social" element={<SocialFeed />} />
                    <Route path="/safety" element={<SafetyGuide />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </LocationGuard>
            </ProtectedRoute>
          } />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
};

export default App;
