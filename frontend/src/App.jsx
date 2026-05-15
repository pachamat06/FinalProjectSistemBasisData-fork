import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import LoadingScreen from './components/LoadingScreen';
import HomePage from './pages/HomePage';
import CasinoPage from './pages/CasinoPage';
import GamesPage from './pages/GamesPage';
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

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      <div className="fixed inset-0 -z-20 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          src="/background1.mp4"
        />
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-25"
          src="/background2.mp4"
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,197,24,0.12),transparent_35%),radial-gradient(circle_at_bottom,_rgba(0,245,255,0.08),transparent_45%)] pointer-events-none" />
      </div>
      <div className="relative min-h-screen" style={{ background: 'transparent' }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/casino" element={requireAuth(<CasinoPage />)} />
          <Route path="/games" element={requireAuth(<GamesPage />)} />
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
