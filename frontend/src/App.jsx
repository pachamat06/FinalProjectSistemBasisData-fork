import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar          from './components/Navbar';
import LoadingScreen   from './components/LoadingScreen';
import HomePage        from './pages/HomePage';
import CasinoPage      from './pages/CasinoPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AnalyticsPage   from './pages/AnalyticsPage';
import AdminPage       from './pages/AdminPage';
import LoginPage       from './pages/LoginPage';
import RegisterPage    from './pages/RegisterPage';
import WelcomePage     from './pages/WelcomePage';
import { useSocketEvents }    from './hooks/useSocketEvents';
import { usePlayerStore, useAuthStore } from './store';

// Guest Banner 
function GuestBanner() {
  const { logout }                = useAuthStore();
  const navigate                  = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [loading,   setLoading]   = useState(false);

  if (dismissed) return null;

  const handleRegister = async () => {
    setLoading(true);
    await logout();
    navigate('/register');
  };

  return (
    <div style={{
      position:       'sticky',
      top:            '64px',
      zIndex:         40,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            '12px',
      flexWrap:       'wrap',
      padding:        '10px clamp(16px,4vw,40px)',
      background:     'linear-gradient(90deg,rgba(234,179,8,0.15),rgba(249,115,22,0.12),rgba(234,179,8,0.15))',
      borderBottom:   '1px solid rgba(234,179,8,0.25)',
      backdropFilter: 'blur(12px)',
    }}>
      <span style={{ fontSize: '16px' }}>👤</span>
      <span className="font-rajdhani" style={{ color: '#fde047', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>
        Kamu bermain sebagai <strong>Guest</strong> — saldo terbatas 5.000 🪙 &amp; data tidak tersimpan setelah logout.
      </span>
      <button
        onClick={handleRegister}
        disabled={loading}
        className="font-orbitron font-bold"
        style={{
          padding: '6px 18px', borderRadius: '6px', fontSize: '11px', letterSpacing: '0.12em',
          background: loading ? '#6b7280' : 'linear-gradient(135deg,#f5c518,#f97316)',
          color: '#000', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.2s',
        }}
      >
        {loading ? '⏳ Memproses...' : 'REGISTER SEKARANG'}
      </button>
      <button
        onClick={() => setDismissed(true)}
        disabled={loading}
        style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '16px', cursor: 'pointer', lineHeight: 1, flexShrink: 0, padding: '0 4px' }}
        aria-label="Tutup notifikasi"
      >✕</button>
    </div>
  );
}

// App Inner
function AppInner() {
  const { currentPlayer, loadPlayers }       = usePlayerStore();
  const { isAuthenticated, checkAuth, user } = useAuthStore();
  const [isLoading, setIsLoading]            = useState(true);
  const location = useLocation();
  useSocketEvents(currentPlayer?.id);

  const isGuest       = user?.guestAccount === true;
  const overlayNavbar = location.pathname === '/login' || location.pathname === '/register';

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      loadPlayers();
      setIsLoading(false);
    };
    init();
  }, []);

  const requireAuth = (element) =>
    isAuthenticated ? element : <Navigate to="/login" replace />;

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      <div className="relative min-h-screen" style={{ background: 'transparent' }}>

        {/* Navbar — fixed overlay di halaman login/register, sticky di halaman lain */}
        {overlayNavbar ? (
          <div className="fixed inset-x-0 top-0 z-50" style={{ background: 'rgba(0,0,0,0.92)' }}>
            <Navbar />
          </div>
        ) : (
          <Navbar />
        )}

        {/* ✅ Banner guest — hanya muncul saat login sebagai guest */}
        {isAuthenticated && isGuest && !overlayNavbar && <GuestBanner />}

        <Routes>
          <Route path="/"            element={<HomePage />} />
          <Route path="/login"       element={<LoginPage />} />
          <Route path="/register"    element={<RegisterPage />} />
          <Route path="/casino"      element={requireAuth(<CasinoPage />)} />
          <Route path="/games"       element={<Navigate to="/casino" replace />} />
          <Route path="/leaderboard" element={requireAuth(<LeaderboardPage />)} />
          <Route path="/analytics"   element={requireAuth(<AnalyticsPage />)} />
          <Route path="/admin"       element={requireAuth(<AdminPage />)} />
          <Route path="/welcome"     element={requireAuth(<WelcomePage />)} />
          <Route path="*"            element={<Navigate to="/" replace />} />
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
