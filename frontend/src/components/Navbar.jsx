import { Link, useLocation, useNavigate } from 'react-router-dom';
import { usePlayerStore, useAuthStore } from '../store';
import { useState, useEffect } from 'react';

const NAV_LINKS = [
  { path: '/',            label: 'Home'        },
  { path: '/casino',      label: 'Casino'      },
  { path: '/games',       label: 'Games'       },
  { path: '/leaderboard', label: 'Leaderboard' },
  { path: '/analytics',   label: 'Analytics'   },
  { path: '/admin',       label: 'Admin'       },
];

export default function Navbar() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { currentPlayer }  = usePlayerStore();
  const { user, logout, isAuthenticated }   = useAuthStore();
  const [showPlayerSelect, setShowPlayerSelect] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      borderBottom: '1px solid rgba(234,179,8,0.1)',
      backdropFilter: 'blur(24px)',
      boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
    }} className="glass bg-slate-950/80">
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 clamp(16px, 3vw, 40px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
      }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            overflow: 'hidden', border: '1px solid rgba(234,179,8,0.3)',
            background: 'rgba(0,0,0,0.4)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <img src="/logo.png" alt="Jokris99 logo" style={{ height: '80%', width: 'auto', objectFit: 'contain' }} />
          </div>
          <span className="font-orbitron font-bold gradient-text-gold" style={{ fontSize: '15px', letterSpacing: '0.2em' }}>
            JOKRIS99
          </span>
        </Link>

        {/* Desktop nav links — only when NOT mobile */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="font-rajdhani"
                style={{
                  padding: '7px 13px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                  ...(location.pathname === link.path
                    ? { background: 'rgba(234,179,8,0.15)', color: '#facc15', border: '1px solid rgba(234,179,8,0.3)' }
                    : { color: '#9ca3af', border: '1px solid transparent' }),
                }}
                onMouseOver={e => {
                  if (location.pathname !== link.path) {
                    e.currentTarget.style.color = '#facc15';
                    e.currentTarget.style.background = 'rgba(234,179,8,0.08)';
                  }
                }}
                onMouseOut={e => {
                  if (location.pathname !== link.path) {
                    e.currentTarget.style.color = '#9ca3af';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>

          {!isMobile && !isAuthenticated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link
                to="/login"
                className="font-rajdhani"
                style={{
                  padding: '7px 14px', borderRadius: '8px', fontSize: '13px',
                  color: '#facc15', textDecoration: 'none',
                  border: '1px solid rgba(234,179,8,0.3)',
                  background: 'rgba(234,179,8,0.08)',
                  transition: 'background 0.5s, color 0.5s, border-color 0.5s, box-shadow 0.5s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #eab308, #f97316)';
                  e.currentTarget.style.color = '#000';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.boxShadow = '0 12px 36px rgba(245,197,24,0.25)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(234,179,8,0.08)';
                  e.currentTarget.style.color = '#facc15';
                  e.currentTarget.style.borderColor = 'rgba(234,179,8,0.3)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="font-rajdhani"
                style={{
                  padding: '7px 14px', borderRadius: '8px', fontSize: '13px',
                  color: '#fff', textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.06)',
                  transition: 'background 0.5s, color 0.5s, border-color 0.5s, box-shadow 0.5s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #eab308, #f97316)';
                  e.currentTarget.style.color = '#000';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.boxShadow = '0 12px 36px rgba(245,197,24,0.25)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Register
              </Link>
            </div>
          )}

          {/* Player button — desktop only */}
          {!isMobile && isAuthenticated && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowPlayerSelect(!showPlayerSelect)}
                className="glass-gold"
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '7px 16px', borderRadius: '8px', fontSize: '13px',
                  cursor: 'pointer', border: '1px solid rgba(234,179,8,0.25)',
                  background: 'rgba(234,179,8,0.08)', transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                <span className="font-rajdhani font-semibold" style={{ color: '#fde047' }}>
                  {user ? user.username : 'User'}
                </span>
                {currentPlayer && (
                  <span className="font-rajdhani" style={{ color: '#86efac', fontSize: '12px' }}>
                    {currentPlayer.balance?.toLocaleString()} 🪙
                  </span>
                )}
                <span style={{ color: '#9ca3af', fontSize: '10px' }}>▼</span>
              </button>

              {showPlayerSelect && (
                <div className="glass" style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  width: '180px', border: '1px solid rgba(234,179,8,0.2)',
                  borderRadius: '10px', overflow: 'hidden', zIndex: 100,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}>
                  <div style={{ padding: '6px' }}>
                    <button
                      onClick={handleLogout}
                      className="font-rajdhani"
                      style={{
                        width: '100%', textAlign: 'left', padding: '10px 14px',
                        borderRadius: '6px', color: '#f87171', background: 'transparent',
                        border: 'none', cursor: 'pointer', fontSize: '14px',
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hamburger — mobile only */}
          {isMobile && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                alignItems: 'center', gap: '5px', width: '38px', height: '38px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', cursor: 'pointer', padding: '8px', flexShrink: 0,
              }}
              aria-label="Toggle menu"
            >
              <span style={{
                display: 'block', width: '18px', height: '1.5px',
                background: menuOpen ? '#fde047' : '#9ca3af', transition: 'all 0.25s',
                transform: menuOpen ? 'translateY(6.5px) rotate(45deg)' : 'none',
              }} />
              <span style={{
                display: 'block', width: '18px', height: '1.5px',
                background: menuOpen ? 'transparent' : '#9ca3af', transition: 'all 0.25s',
              }} />
              <span style={{
                display: 'block', width: '18px', height: '1.5px',
                background: menuOpen ? '#fde047' : '#9ca3af', transition: 'all 0.25s',
                transform: menuOpen ? 'translateY(-6.5px) rotate(-45deg)' : 'none',
              }} />
            </button>
          )}

        </div>
      </div>

      {/* Mobile dropdown menu */}
      {isMobile && menuOpen && (
        <div style={{
          borderTop: '1px solid rgba(234,179,8,0.1)',
          padding: '12px 16px 20px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="font-rajdhani"
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: '12px 16px', borderRadius: '8px', fontSize: '15px',
                  fontWeight: 500, textDecoration: 'none', letterSpacing: '0.05em',
                  transition: 'all 0.2s',
                  ...(location.pathname === link.path
                    ? { background: 'rgba(234,179,8,0.15)', color: '#facc15', border: '1px solid rgba(234,179,8,0.3)' }
                    : { color: '#9ca3af', border: '1px solid transparent' }),
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {isAuthenticated ? (
            <div style={{
              border: '1px solid rgba(234,179,8,0.2)', borderRadius: '10px',
              padding: '14px 16px', background: 'rgba(234,179,8,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div className="font-rajdhani font-semibold" style={{ color: '#fde047', fontSize: '14px' }}>
                  {user ? user.username : 'User'}
                </div>
                {currentPlayer && (
                  <div className="font-rajdhani" style={{ color: '#86efac', fontSize: '12px', marginTop: '2px' }}>
                    {currentPlayer.balance?.toLocaleString()} 🪙
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="font-rajdhani"
                style={{
                  padding: '8px 16px', borderRadius: '6px', fontSize: '13px',
                  color: '#f87171', background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer',
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link
                to="/login"
                className="font-rajdhani"
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: '10px 16px', borderRadius: '8px', fontSize: '14px',
                  color: '#facc15', textDecoration: 'none',
                  border: '1px solid rgba(234,179,8,0.3)',
                  background: 'rgba(234,179,8,0.08)',
                  transition: 'background 0.5s, color 0.5s, border-color 0.5s, box-shadow 0.5s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #eab308, #f97316)';
                  e.currentTarget.style.color = '#000';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.boxShadow = '0 12px 36px rgba(245,197,24,0.25)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(234,179,8,0.08)';
                  e.currentTarget.style.color = '#facc15';
                  e.currentTarget.style.borderColor = 'rgba(234,179,8,0.3)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="font-rajdhani"
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: '10px 16px', borderRadius: '8px', fontSize: '14px',
                  color: '#fff', textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.06)',
                  transition: 'background 0.5s, color 0.5s, border-color 0.5s, box-shadow 0.5s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #eab308, #f97316)';
                  e.currentTarget.style.color = '#000';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.boxShadow = '0 12px 36px rgba(245,197,24,0.25)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}