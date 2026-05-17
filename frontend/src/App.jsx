import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import LoadingScreen from './components/LoadingScreen';
import HomePage from './pages/HomePage';
import CasinoPage from './pages/CasinoPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WelcomePage from './pages/WelcomePage';
import { useSocketEvents } from './hooks/useSocketEvents';
import { usePlayerStore, useAuthStore } from './store';

function AppInner() {
  const { currentPlayer, loadPlayers } = usePlayerStore();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  useSocketEvents(currentPlayer?.id);

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      loadPlayers();
      setIsLoading(false);
    };
    init();
  }, []);

  const requireAuth = (element) => (isAuthenticated ? element : <Navigate to="/login" replace />);

  const overlayNavbar = location.pathname === '/login' || location.pathname === '/register';

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      <div className="relative min-h-screen" style={{ background: 'transparent' }}>
        {overlayNavbar ? (
          <div
            className="fixed inset-x-0 top-0 z-50"
            style={{ background: 'rgba(0, 0, 0, 0.92)' }}
          >
            <Navbar />
          </div>
        ) : (
          <Navbar />
        )}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/casino" element={requireAuth(<CasinoPage />)} />
          <Route path="/games" element={<Navigate to="/casino" replace />} />
          <Route path="/leaderboard" element={requireAuth(<LeaderboardPage />)} />
          <Route path="/analytics" element={requireAuth(<AnalyticsPage />)} />
          <Route path="/admin" element={requireAuth(<AdminPage />)} />
          <Route path="/welcome" element={requireAuth(<WelcomePage />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
