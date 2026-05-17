import { useState, useEffect } from 'react';
import { usePlayerStore } from '../store';
import {
  fetchPlayers, fetchSystemStats, fetchPlayerStats,
  simulateSpins, forceWinStreak, forceLoseStreak,
  resetRTP, fetchRTPProfile, inspectRedis,
} from '../services/api';

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '1234';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt  = (n, decimals = 0) => Number(n ?? 0).toLocaleString('id-ID', { maximumFractionDigits: decimals });
const pct  = (n) => `${(Number(n ?? 0) * 100).toFixed(1)}%`;
const coin = (n) => `${fmt(n)} 🪙`;

// ── PIN Gate ──────────────────────────────────────────────────────────────────
function AdminPinGate({ onUnlock }) {
  const [pin, setPin]     = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) { onUnlock(); }
    else { setError('PIN salah. Coba lagi.'); setPin(''); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass" style={{ border: '1px solid rgba(239,68,68,0.3)', borderRadius: '24px', padding: '48px', textAlign: 'center', maxWidth: '380px', width: '100%' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
        <h2 className="font-orbitron" style={{ color: '#f87171', fontSize: '22px', marginBottom: '8px', letterSpacing: '0.15em' }}>ADMIN ACCESS</h2>
        <p className="font-rajdhani" style={{ color: '#6b7280', fontSize: '13px', marginBottom: '32px' }}>Halaman ini hanya untuk keperluan internal & debug.</p>
        <form onSubmit={handleSubmit}>
          <input type="password" value={pin} onChange={(e) => { setPin(e.target.value); setError(''); }}
            placeholder="Pin: 1234" className="casino-input"
            style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '0.3em', marginBottom: '16px' }} autoFocus />
          {error && <p className="font-rajdhani" style={{ color: '#f87171', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
          <button type="submit" className="font-orbitron font-bold" style={{
            width: '100%', padding: '12px', borderRadius: '10px',
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.5)',
            color: '#f87171', fontSize: '13px', letterSpacing: '0.15em', cursor: 'pointer',
          }}>MASUK</button>
        </form>
      </div>
    </div>
  );
}

// ── Player Detail Modal ───────────────────────────────────────────────────────
function PlayerDetailModal({ player, onClose }) {
  const [stats,   setStats]   = useState(null);
  const [rtp,     setRtp]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchPlayerStats(player.id).catch(() => null),
      fetchRTPProfile(player.id).catch(() => null),
    ]).then(([s, r]) => {
      setStats(s);
      setRtp(r);
      setLoading(false);
    });
  }, [player.id]);

  const winRate = stats?.stats?.winRate ?? 0;
  const roi     = stats?.stats?.roi     ?? 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass"
        style={{
          border: '1px solid rgba(234,179,8,0.25)', borderRadius: '24px',
          padding: 'clamp(24px,3vw,36px)', width: '100%', maxWidth: '540px',
          maxHeight: '85vh', overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div className="font-orbitron font-black gradient-text-gold" style={{ fontSize: 'clamp(18px,2.5vw,24px)', marginBottom: '4px' }}>
              {player.username}
            </div>
            <div className="font-rajdhani" style={{ color: '#6b7280', fontSize: '12px', letterSpacing: '0.2em' }}>
              LEVEL {player.level} · ID: {player.id.slice(0, 8)}…
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {loading ? (
          <div className="font-rajdhani" style={{ textAlign: 'center', color: '#6b7280', padding: '32px 0' }}>Memuat data...</div>
        ) : (
          <>
            {/* Balance + Profit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Saldo',      value: coin(player.balance),          color: '#fde047' },
                { label: 'Net Profit', value: coin(player.totalProfit),       color: player.totalProfit >= 0 ? '#86efac' : '#f87171' },
                { label: 'Total Bet',  value: coin(player.totalBetAmount),    color: '#67e8f9' },
                { label: 'Best Win',   value: coin(player.highestSingleWin),  color: '#c084fc' },
              ].map((s) => (
                <div key={s.label} className="pill-card" style={{ padding: '14px 16px' }}>
                  <div className="font-rajdhani" style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: '6px' }}>{s.label}</div>
                  <div className="font-orbitron font-black" style={{ fontSize: 'clamp(14px,2vw,18px)', color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Win/Loss + Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '20px' }}>
              {[
                { label: 'Menang',    value: fmt(player.totalWins),   color: '#86efac' },
                { label: 'Kalah',     value: fmt(player.totalLosses), color: '#f87171' },
                { label: 'Win Rate',  value: pct(winRate),            color: '#fde047' },
                { label: 'ROI',       value: `${roi}%`,               color: roi >= 0 ? '#86efac' : '#f87171' },
                { label: 'Avg Bet',   value: coin(stats?.stats?.avgBet), color: '#67e8f9' },
                { label: 'Sessions',  value: fmt(stats?.sessions?.length ?? 0), color: '#c084fc' },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 8px' }}>
                  <div className="font-orbitron font-black" style={{ fontSize: 'clamp(13px,1.8vw,16px)', color: s.color, marginBottom: '4px' }}>{s.value}</div>
                  <div className="font-rajdhani" style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* RTP Profile */}
            {rtp && (
              <div style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '14px', padding: '16px' }}>
                <div className="font-rajdhani" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#c084fc', marginBottom: '12px' }}>🧠 RTP Profile</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    ['Win Rate',      pct(rtp.currentWinRate)],
                    ['Win Modifier',  pct(rtp.winModifier)],
                    ['Win Streak',    rtp.winningStreak],
                    ['Lose Streak',   rtp.losingStreak],
                    ['Pity Counter',  `${rtp.pityCounter} / 15`],
                    ['Fatigue',       pct(rtp.sessionFatigue)],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="font-rajdhani" style={{ color: '#9ca3af', fontSize: '12px' }}>{k}</span>
                      <span className="font-rajdhani font-bold" style={{ color: '#c084fc', fontSize: '12px' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Player Accounts Panel ─────────────────────────────────────────────────────
function PlayerAccountsPanel() {
  const [players,      setPlayers]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [sortBy,       setSortBy]       = useState('balance');
  const [sortDir,      setSortDir]      = useState('desc');
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    fetchPlayers()
      .then(setPlayers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortBy(col); setSortDir('desc'); }
  };

  const SORT_COLS = [
    { key: 'username',        label: 'Username'   },
    { key: 'balance',         label: 'Saldo'      },
    { key: 'totalProfit',     label: 'Profit'     },
    { key: 'totalWins',       label: 'Menang'     },
    { key: 'totalLosses',     label: 'Kalah'      },
    { key: 'totalBetAmount',  label: 'Total Bet'  },
  ];

  const filtered = players
    .filter((p) => p.username.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const va = a[sortBy] ?? 0;
      const vb = b[sortBy] ?? 0;
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === 'asc' ? va - vb : vb - va;
    });

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <span style={{ color: '#374151', marginLeft: '4px' }}>↕</span>;
    return <span style={{ color: '#fde047', marginLeft: '4px' }}>{sortDir === 'desc' ? '↓' : '↑'}</span>;
  };

  return (
    <>
      {selectedPlayer && (
        <PlayerDetailModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}

      <div className="glass" style={{ border: '1px solid rgba(234,179,8,0.15)', borderRadius: '24px', padding: 'clamp(20px,3vw,32px)' }}>

        {/* Panel header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px' }}>
          <div>
            <div className="font-orbitron" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.35em', color: '#fde047', marginBottom: '4px' }}>
              👥 Player Accounts
            </div>
            <div className="font-rajdhani" style={{ color: '#6b7280', fontSize: '12px' }}>
              {filtered.length} dari {players.length} akun
            </div>
          </div>

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍  Cari username..."
            className="casino-input"
            style={{ width: 'clamp(180px,30%,280px)', padding: '8px 14px', fontSize: '13px' }}
          />
        </div>

        {/* Sort tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
          {SORT_COLS.map((col) => (
            <button
              key={col.key}
              onClick={() => handleSort(col.key)}
              className="font-rajdhani font-semibold"
              style={{
                padding: '6px 14px', borderRadius: '6px', fontSize: '12px',
                cursor: 'pointer', transition: 'all 0.15s',
                ...(sortBy === col.key
                  ? { background: 'rgba(234,179,8,0.18)', border: '1px solid rgba(234,179,8,0.45)', color: '#fde047' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280' }),
              }}
            >
              {col.label} <SortIcon col={col.key} />
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="font-rajdhani" style={{ textAlign: 'center', color: '#6b7280', padding: '32px 0', fontSize: '14px' }}>Memuat akun...</div>
        ) : filtered.length === 0 ? (
          <div className="font-rajdhani" style={{ textAlign: 'center', color: '#6b7280', padding: '32px 0', fontSize: '14px' }}>Tidak ada akun yang cocok.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map((player, idx) => {
              const totalRounds = (player.totalWins ?? 0) + (player.totalLosses ?? 0);
              const winRate     = totalRounds > 0 ? player.totalWins / totalRounds : 0;
              const isProfit    = (player.totalProfit ?? 0) >= 0;

              return (
                <div
                  key={player.id}
                  onClick={() => setSelectedPlayer(player)}
                  className="card-hover"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    alignItems: 'center',
                    gap: '14px',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '14px 18px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Rank badge */}
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontSize: '12px',
                    ...(idx === 0 ? { background: 'linear-gradient(135deg,#f5c518,#ffd700)', color: '#000' }
                      : idx === 1 ? { background: 'linear-gradient(135deg,#9ca3af,#d1d5db)', color: '#000' }
                      : idx === 2 ? { background: 'linear-gradient(135deg,#cd7f32,#b8860b)', color: '#fff' }
                      : { background: 'rgba(255,255,255,0.07)', color: '#6b7280' }),
                  }}>
                    {idx + 1}
                  </div>

                  {/* Info */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span className="font-rajdhani font-bold text-white" style={{ fontSize: '14px' }}>{player.username}</span>
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(103,232,249,0.1)', border: '1px solid rgba(103,232,249,0.2)', color: '#67e8f9', fontFamily: 'Rajdhani, sans-serif' }}>
                        LV {player.level}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <span className="font-rajdhani" style={{ fontSize: '12px', color: '#86efac' }}>✅ {fmt(player.totalWins)}</span>
                      <span className="font-rajdhani" style={{ fontSize: '12px', color: '#f87171' }}>❌ {fmt(player.totalLosses)}</span>
                      <span className="font-rajdhani" style={{ fontSize: '12px', color: '#9ca3af' }}>WR {pct(winRate)}</span>
                      <span className="font-rajdhani" style={{ fontSize: '12px', color: '#6b7280' }}>Bet {coin(player.totalBetAmount)}</span>
                    </div>
                  </div>

                  {/* Balance + Profit */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="font-orbitron font-black" style={{ fontSize: 'clamp(13px,1.8vw,16px)', color: '#fde047', marginBottom: '4px' }}>
                      {coin(player.balance)}
                    </div>
                    <div className="font-rajdhani font-semibold" style={{ fontSize: '12px', color: isProfit ? '#86efac' : '#f87171' }}>
                      {isProfit ? '+' : ''}{coin(player.totalProfit)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

// ── Admin Panel ───────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  if (!unlocked) return <AdminPinGate onUnlock={() => setUnlocked(true)} />;
  return <AdminPanel />;
}

function AdminPanel() {
  const { players, loadPlayers, currentPlayer } = usePlayerStore();
  const [systemStats,  setSystemStats]  = useState(null);
  const [rtpProfile,   setRtpProfile]   = useState(null);
  const [redisData,    setRedisData]    = useState(null);
  const [simResult,    setSimResult]    = useState(null);
  const [loading,      setLoading]      = useState({});
  const [streakLength, setStreakLength] = useState(5);
  const [simCount,     setSimCount]     = useState(100);

  const setLoad = (key, val) => setLoading((l) => ({ ...l, [key]: val }));

  useEffect(() => {
    loadPlayers();
    fetchSystemStats().then(setSystemStats).catch(console.error);
  }, []);

  useEffect(() => {
    if (currentPlayer?.id) fetchRTPProfile(currentPlayer.id).then(setRtpProfile).catch(console.error);
  }, [currentPlayer?.id]);

  const run = async (key, fn) => {
    setLoad(key, true);
    try { await fn(); } catch (e) { alert(e.message); }
    finally { setLoad(key, false); }
  };

  const panelStyle = (borderColor) => ({ border: `1px solid ${borderColor}`, borderRadius: '24px', padding: 'clamp(20px,3vw,32px)' });
  const labelStyle = (color) => ({ fontFamily: 'Orbitron,sans-serif', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.35em', color, marginBottom: '20px' });
  const rowStyle   = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' };
  const btnBase    = (color) => ({ width: '100%', padding: '10px 0', borderRadius: '8px', border: `1px solid ${color}`, background: 'transparent', color, cursor: 'pointer', fontSize: '13px', letterSpacing: '0.05em', transition: 'background 0.2s', marginTop: '16px' });

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── HERO ── */}
      <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'clamp(80px,10vw,120px) clamp(16px,4vw,48px) clamp(60px,8vw,100px)', minHeight: '100vh' }}>
        <p className="font-rajdhani" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.35em', color: 'rgba(239,68,68,0.7)', marginBottom: '16px' }}>Internal Tools</p>
        <h1 className="font-orbitron font-black" style={{ fontSize: 'clamp(40px,8vw,100px)', letterSpacing: '0.2em', lineHeight: 1, marginBottom: '16px', color: '#f87171' }}>ADMIN</h1>
        <p style={{ color: '#d1d5db', fontSize: 'clamp(14px,2vw,18px)', fontWeight: 300, maxWidth: '520px', margin: '0 auto 48px', lineHeight: 1.7 }}>Debug panel — not for players.</p>

        {systemStats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 'clamp(12px,2vw,20px)', width: '100%', maxWidth: '75vw' }}>
            {Object.entries(systemStats).slice(0, 4).map(([k, v]) => (
              <div key={k} className="pill-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '8px', padding: 'clamp(16px,2vw,24px)', minHeight: '110px' }}>
                <div className="font-orbitron font-black" style={{ fontSize: 'clamp(18px,2.5vw,24px)', color: '#f87171' }}>{String(v)}</div>
                <div className="font-rajdhani text-gray-400" style={{ fontSize: 'clamp(10px,1vw,12px)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>{k.replace(/([A-Z])/g, ' $1')}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── PANELS ── */}
      <section style={{ padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: '75%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'clamp(16px,2.5vw,28px)' }}>

          {/* ── Player Accounts ── */}
          <PlayerAccountsPanel />

          {/* ── Row: System Stats + RTP ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 'clamp(16px,2.5vw,28px)' }}>

            <div className="glass" style={panelStyle('rgba(239,68,68,0.2)')}>
              <div style={labelStyle('#f87171')}>⚙️ System Stats</div>
              {systemStats ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {Object.entries(systemStats).map(([k, v]) => (
                    <div key={k} style={rowStyle}>
                      <span className="font-rajdhani" style={{ color: '#9ca3af', fontSize: '13px', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="font-rajdhani font-bold" style={{ color: '#fff', fontSize: '13px' }}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="font-rajdhani" style={{ color: '#6b7280', fontSize: '13px' }}>Loading...</div>}
              <button onClick={() => run('stats', () => fetchSystemStats().then(setSystemStats))} disabled={loading.stats} className="font-rajdhani font-bold" style={btnBase('rgba(239,68,68,0.6)')}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                {loading.stats ? 'Refreshing...' : '🔄 Refresh'}
              </button>
            </div>

            <div className="glass" style={panelStyle('rgba(168,85,247,0.2)')}>
              <div style={labelStyle('#a855f7')}>🧠 RTP Profile — {currentPlayer?.username || 'No player'}</div>
              {rtpProfile ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {[
                    ['Current Win Rate', pct(rtpProfile.currentWinRate)],
                    ['Win Modifier',     pct(rtpProfile.winModifier)],
                    ['Losing Streak',    rtpProfile.losingStreak],
                    ['Winning Streak',   rtpProfile.winningStreak],
                    ['Session Fatigue',  pct(rtpProfile.sessionFatigue)],
                    ['Pity Counter',     `${rtpProfile.pityCounter} / 15`],
                    ['Volatility',       rtpProfile.volatilityLevel],
                  ].map(([label, val]) => (
                    <div key={label} style={rowStyle}>
                      <span className="font-rajdhani" style={{ color: '#9ca3af', fontSize: '13px' }}>{label}</span>
                      <span className="font-rajdhani font-bold" style={{ color: '#c084fc', fontSize: '13px' }}>{val}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="font-rajdhani" style={{ color: '#6b7280', fontSize: '13px' }}>Select a player first.</div>}
              {currentPlayer && (
                <button onClick={() => run('resetRtp', () => resetRTP(currentPlayer.id).then(() => fetchRTPProfile(currentPlayer.id).then(setRtpProfile)))}
                  disabled={loading.resetRtp} className="font-rajdhani font-bold" style={btnBase('rgba(168,85,247,0.6)')}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(168,85,247,0.1)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  {loading.resetRtp ? 'Resetting...' : '🔁 Reset RTP Profile'}
                </button>
              )}
            </div>
          </div>

          {/* ── Row: Force Streaks + Simulate Spins ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 'clamp(16px,2.5vw,28px)' }}>

            <div className="glass" style={panelStyle('rgba(234,179,8,0.15)')}>
              <div style={labelStyle('#fde047')}>⚡ Force Streaks</div>
              <div style={{ marginBottom: '16px' }}>
                <div className="font-rajdhani" style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '8px' }}>Streak Length</div>
                <input type="number" value={streakLength} onChange={(e) => setStreakLength(parseInt(e.target.value) || 1)} className="casino-input" min={1} max={20} style={{ width: '100%' }} />
              </div>
              {!currentPlayer && <div className="font-rajdhani" style={{ color: 'rgba(234,179,8,0.6)', fontSize: '12px', marginBottom: '12px' }}>⚠️ Select a player first</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button onClick={() => run('winStreak', () => forceWinStreak(currentPlayer?.id, streakLength).then(() => fetchRTPProfile(currentPlayer.id).then(setRtpProfile)))}
                  disabled={loading.winStreak || !currentPlayer} className="font-rajdhani font-bold"
                  style={{ padding: '10px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: '1px solid rgba(34,197,94,0.4)', background: 'transparent', color: '#86efac', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(34,197,94,0.1)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  {loading.winStreak ? '...' : '🔥 Win Streak'}
                </button>
                <button onClick={() => run('loseStreak', () => forceLoseStreak(currentPlayer?.id, streakLength).then(() => fetchRTPProfile(currentPlayer.id).then(setRtpProfile)))}
                  disabled={loading.loseStreak || !currentPlayer} className="font-rajdhani font-bold"
                  style={{ padding: '10px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: '1px solid rgba(239,68,68,0.4)', background: 'transparent', color: '#f87171', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  {loading.loseStreak ? '...' : '💔 Lose Streak'}
                </button>
              </div>
            </div>

            <div className="glass" style={panelStyle('rgba(6,182,212,0.2)')}>
              <div style={labelStyle('#67e8f9')}>▶️ Simulate Spins</div>
              <div style={{ marginBottom: '16px' }}>
                <div className="font-rajdhani" style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '8px' }}>Spin Count</div>
                <input type="number" value={simCount} onChange={(e) => setSimCount(Math.min(500, parseInt(e.target.value) || 1))} className="casino-input" min={1} max={500} style={{ width: '100%' }} />
              </div>
              <button onClick={() => run('sim', () => simulateSpins(currentPlayer?.id, simCount).then(setSimResult))}
                disabled={loading.sim || !currentPlayer} className="font-rajdhani font-bold"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: '1px solid rgba(6,182,212,0.4)', background: 'transparent', color: '#67e8f9', transition: 'background 0.2s', marginBottom: '16px' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(6,182,212,0.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                {loading.sim ? '⚙️ Simulating...' : `▶️ Run ${simCount} Spins`}
              </button>
              {simResult && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {[
                    ['Total Spins',     simResult.totalSpins],
                    ['Wins',            simResult.wins],
                    ['Losses',          simResult.losses],
                    ['Actual Win Rate', `${(simResult.actualWinRate * 100).toFixed(2)}%`],
                  ].map(([k, v]) => (
                    <div key={k} style={rowStyle}>
                      <span className="font-rajdhani" style={{ color: '#9ca3af', fontSize: '13px' }}>{k}</span>
                      <span className="font-rajdhani font-bold" style={{ color: '#67e8f9', fontSize: '13px' }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Redis Inspector ── */}
          <div className="glass" style={panelStyle('rgba(249,115,22,0.2)')}>
            <div style={labelStyle('#fb923c')}>🔍 Redis Inspector</div>
            <button onClick={() => run('redis', () => inspectRedis().then(setRedisData))} disabled={loading.redis} className="font-rajdhani font-bold"
              style={{ padding: '10px 24px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: '1px solid rgba(249,115,22,0.4)', background: 'transparent', color: '#fb923c', transition: 'background 0.2s', marginBottom: '16px' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(249,115,22,0.1)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              {loading.redis ? '⏳ Loading...' : '🔍 Inspect Redis'}
            </button>
            {redisData && (
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '16px', maxHeight: '320px', overflowY: 'auto' }}>
                <pre style={{ fontSize: '12px', color: '#4ade80', fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0 }}>
                  {JSON.stringify(redisData, null, 2)}
                </pre>
              </div>
            )}
          </div>

        </div>
      </section>
    </div>
  );
}