import { useState, useEffect } from 'react';
import { usePlayerStore } from '../store';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  fetchPlayers, fetchSystemStats, fetchPlayerStats,
  simulateSpins, forceWinStreak, forceLoseStreak,
  resetRTP, fetchRTPProfile, inspectRedis,
  banUser, unbanUser, deleteUser,
} from '../services/api';

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '1234';
const fmt  = (n, d = 0) => Number(n ?? 0).toLocaleString('id-ID', { maximumFractionDigits: d });
const pct  = (n)        => `${(Number(n ?? 0) * 100).toFixed(1)}%`;
const coin = (n)        => `${fmt(n)} 🪙`;

// ── PIN Gate ──────────────────────────────────────────────────────────────────
function AdminPinGate({ onUnlock }) {
  const [pin, setPin]     = useState('');
  const [error, setError] = useState('');
  const handle = (e) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) onUnlock();
    else { setError('PIN salah.'); setPin(''); }
  };
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass" style={{ border: '1px solid rgba(239,68,68,0.3)', borderRadius: '24px', padding: '48px', textAlign: 'center', maxWidth: '380px', width: '100%' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
        <h2 className="font-orbitron" style={{ color: '#f87171', fontSize: '22px', marginBottom: '8px', letterSpacing: '0.15em' }}>ADMIN ACCESS</h2>
        <p className="font-rajdhani" style={{ color: '#6b7280', fontSize: '13px', marginBottom: '32px' }}>Halaman ini hanya untuk keperluan internal & debug.</p>
        <form onSubmit={handle}>
          <input type="password" value={pin} onChange={(e) => { setPin(e.target.value); setError(''); }} placeholder="PINnya: 1234"
            className="casino-input" style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '0.3em', marginBottom: '16px' }} autoFocus />
          {error && <p className="font-rajdhani" style={{ color: '#f87171', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
          <button type="submit" className="font-orbitron font-bold" style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.5)', color: '#f87171', fontSize: '13px', letterSpacing: '0.15em', cursor: 'pointer' }}>MASUK</button>
        </form>
      </div>
    </div>
  );
}

// ── Player Detail Modal ───────────────────────────────────────────────────────
function PlayerDetailModal({ player, onClose, onRefresh }) {
  const [stats,   setStats]   = useState(null);
  const [rtp,     setRtp]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Confirm dialog state
  const [confirm, setConfirm] = useState(null); // { type: 'ban'|'unban'|'delete' }

  const isBanned = player.user?.isBanned;

  useEffect(() => {
    Promise.all([fetchPlayerStats(player.id).catch(() => null), fetchRTPProfile(player.id).catch(() => null)])
      .then(([s, r]) => { setStats(s); setRtp(r); setLoading(false); });
  }, [player.id]);

  const runAction = async (type) => {
    setActionLoading(true);
    try {
      if (type === 'ban')    await banUser(player.userId ?? player.user?.id);
      if (type === 'unban')  await unbanUser(player.userId ?? player.user?.id);
      if (type === 'delete') await deleteUser(player.userId ?? player.user?.id);
      await onRefresh();
      if (type === 'delete') onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
      setConfirm(null);
    }
  };

  const CONFIRM_CONFIG = {
    ban: {
      title:        'Ban User?',
      message:      `User "${player.username}" tidak akan bisa login lagi. Kamu bisa unban kapan saja.`,
      confirmLabel: 'Ya, Ban User',
      danger:       true,
    },
    unban: {
      title:        'Unban User?',
      message:      `User "${player.username}" akan bisa login kembali.`,
      confirmLabel: 'Ya, Unban User',
      danger:       false,
    },
    delete: {
      title:        'Hapus User Permanen?',
      message:      `Semua data "${player.username}" (riwayat, saldo, sesi) akan dihapus permanen dan tidak bisa dipulihkan.`,
      confirmLabel: 'Ya, Hapus Permanen',
      danger:       true,
    },
  };

  const winRate = stats?.stats?.winRate ?? 0;
  const roi     = stats?.stats?.roi     ?? 0;

  return (
    <>
      <ConfirmDialog
        open={!!confirm}
        {...(confirm ? CONFIRM_CONFIG[confirm.type] : {})}
        loading={actionLoading}
        onConfirm={() => runAction(confirm?.type)}
        onCancel={() => setConfirm(null)}
      />

      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div onClick={(e) => e.stopPropagation()} className="glass" style={{ border: '1px solid rgba(234,179,8,0.25)', borderRadius: '24px', padding: 'clamp(24px,3vw,36px)', width: '100%', maxWidth: '560px', maxHeight: '88vh', overflowY: 'auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <span className="font-orbitron font-black gradient-text-gold" style={{ fontSize: 'clamp(16px,2.5vw,22px)' }}>{player.username}</span>
                {isBanned && (
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700 }}>
                    🚫 BANNED
                  </span>
                )}
                {player.user?.guestAccount && (
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(107,114,128,0.2)', border: '1px solid rgba(107,114,128,0.3)', color: '#9ca3af', fontFamily: 'Rajdhani,sans-serif' }}>
                    GUEST
                  </span>
                )}
              </div>
              <div className="font-rajdhani" style={{ color: '#6b7280', fontSize: '11px', letterSpacing: '0.15em' }}>
                LV {player.level} · {player.user?.email ?? '—'} · ID: {player.id.slice(0, 8)}…
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '22px', cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>✕</button>
          </div>

          {/* ── Action buttons ── */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {!isBanned ? (
              <button onClick={() => setConfirm({ type: 'ban' })} className="font-rajdhani font-bold"
                style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', border: '1px solid rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.1)', color: '#f87171', transition: 'all 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}>
                🚫 Ban User
              </button>
            ) : (
              <button onClick={() => setConfirm({ type: 'unban' })} className="font-rajdhani font-bold"
                style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', border: '1px solid rgba(34,197,94,0.5)', background: 'rgba(34,197,94,0.1)', color: '#86efac', transition: 'all 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(34,197,94,0.2)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(34,197,94,0.1)'}>
                ✅ Unban User
              </button>
            )}
            <button onClick={() => setConfirm({ type: 'delete' })} className="font-rajdhani font-bold"
              style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#f87171', transition: 'all 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              🗑️ Hapus Permanen
            </button>
          </div>

          {loading ? (
            <div className="font-rajdhani" style={{ textAlign: 'center', color: '#6b7280', padding: '32px 0' }}>Memuat data...</div>
          ) : (
            <>
              {/* Stats cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'Saldo',      value: coin(player.balance),         color: '#fde047' },
                  { label: 'Net Profit', value: coin(player.totalProfit),      color: (player.totalProfit ?? 0) >= 0 ? '#86efac' : '#f87171' },
                  { label: 'Total Bet',  value: coin(player.totalBetAmount),   color: '#67e8f9' },
                  { label: 'Best Win',   value: coin(player.highestSingleWin), color: '#c084fc' },
                ].map((s) => (
                  <div key={s.label} className="pill-card" style={{ padding: '12px 14px' }}>
                    <div className="font-rajdhani" style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: '4px' }}>{s.label}</div>
                    <div className="font-orbitron font-black" style={{ fontSize: 'clamp(13px,2vw,17px)', color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Win/Loss */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '16px' }}>
                {[
                  { label: 'Menang',   value: fmt(player.totalWins),   color: '#86efac' },
                  { label: 'Kalah',    value: fmt(player.totalLosses), color: '#f87171' },
                  { label: 'Win Rate', value: pct(winRate),            color: '#fde047' },
                  { label: 'ROI',      value: `${roi}%`,               color: roi >= 0 ? '#86efac' : '#f87171' },
                  { label: 'Avg Bet',  value: coin(stats?.stats?.avgBet), color: '#67e8f9' },
                  { label: 'Sessions', value: fmt(stats?.sessions?.length ?? 0), color: '#c084fc' },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px 6px' }}>
                    <div className="font-orbitron font-black" style={{ fontSize: 'clamp(12px,1.8vw,15px)', color: s.color, marginBottom: '3px' }}>{s.value}</div>
                    <div className="font-rajdhani" style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* RTP */}
              {rtp && (
                <div style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '12px', padding: '14px' }}>
                  <div className="font-rajdhani" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#c084fc', marginBottom: '10px' }}>🧠 RTP Profile</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {[['Win Rate', pct(rtp.currentWinRate)], ['Win Modifier', pct(rtp.winModifier)], ['Win Streak', rtp.winningStreak], ['Lose Streak', rtp.losingStreak], ['Pity', `${rtp.pityCounter}/15`], ['Fatigue', pct(rtp.sessionFatigue)]].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
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
    </>
  );
}

// ── Player Accounts Panel ─────────────────────────────────────────────────────
function PlayerAccountsPanel() {
  const [players,        setPlayers]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState('');
  const [sortBy,         setSortBy]         = useState('balance');
  const [sortDir,        setSortDir]        = useState('desc');
  const [filterBanned,   setFilterBanned]   = useState('all'); // 'all' | 'active' | 'banned'
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const load = () => {
    setLoading(true);
    fetchPlayers().then(setPlayers).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortBy(col); setSortDir('desc'); }
  };

  const SORT_COLS = [
    { key: 'username',       label: 'Username'  },
    { key: 'balance',        label: 'Saldo'     },
    { key: 'totalProfit',    label: 'Profit'    },
    { key: 'totalWins',      label: 'Menang'    },
    { key: 'totalLosses',    label: 'Kalah'     },
    { key: 'totalBetAmount', label: 'Total Bet' },
  ];

  const filtered = players
    .filter((p) => {
      if (filterBanned === 'active')  return !p.user?.isBanned;
      if (filterBanned === 'banned')  return !!p.user?.isBanned;
      return true;
    })
    .filter((p) => p.username.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const va = a[sortBy] ?? 0, vb = b[sortBy] ?? 0;
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === 'asc' ? va - vb : vb - va;
    });

  const bannedCount = players.filter((p) => p.user?.isBanned).length;

  return (
    <>
      {selectedPlayer && (
        <PlayerDetailModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} onRefresh={async () => { await load(); if (selectedPlayer) { const updated = players.find(p => p.id === selectedPlayer.id); if (updated) setSelectedPlayer(updated); } }} />
      )}

      <div className="glass" style={{ border: '1px solid rgba(234,179,8,0.15)', borderRadius: '24px', padding: 'clamp(20px,3vw,32px)' }}>

        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div className="font-orbitron" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.35em', color: '#fde047', marginBottom: '4px' }}>👥 Player Accounts</div>
            <div className="font-rajdhani" style={{ color: '#6b7280', fontSize: '12px' }}>
              {filtered.length} dari {players.length} akun
              {bannedCount > 0 && <span style={{ color: '#f87171', marginLeft: '8px' }}>· {bannedCount} di-ban</span>}
            </div>
          </div>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍  Cari username..." className="casino-input" style={{ width: 'clamp(160px,28%,260px)', padding: '8px 14px', fontSize: '13px' }} />
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          {[['all', 'Semua'], ['active', 'Aktif'], ['banned', '🚫 Banned']].map(([val, label]) => (
            <button key={val} onClick={() => setFilterBanned(val)} className="font-rajdhani font-semibold"
              style={{ padding: '5px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s',
                ...(filterBanned === val
                  ? { background: 'rgba(234,179,8,0.18)', border: '1px solid rgba(234,179,8,0.45)', color: '#fde047' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280' }) }}>
              {label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          {/* Sort tabs */}
          {SORT_COLS.map((col) => (
            <button key={col.key} onClick={() => handleSort(col.key)} className="font-rajdhani font-semibold"
              style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s',
                ...(sortBy === col.key
                  ? { background: 'rgba(234,179,8,0.18)', border: '1px solid rgba(234,179,8,0.45)', color: '#fde047' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280' }) }}>
              {col.label} {sortBy === col.key ? (sortDir === 'desc' ? '↓' : '↑') : <span style={{ color: '#374151' }}>↕</span>}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="font-rajdhani" style={{ textAlign: 'center', color: '#6b7280', padding: '32px 0', fontSize: '14px' }}>Memuat akun...</div>
        ) : filtered.length === 0 ? (
          <div className="font-rajdhani" style={{ textAlign: 'center', color: '#6b7280', padding: '32px 0', fontSize: '14px' }}>Tidak ada akun yang cocok.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filtered.map((player, idx) => {
              const isBanned    = player.user?.isBanned;
              const isGuest     = player.user?.guestAccount;
              const totalRounds = (player.totalWins ?? 0) + (player.totalLosses ?? 0);
              const winRate     = totalRounds > 0 ? player.totalWins / totalRounds : 0;
              const isProfit    = (player.totalProfit ?? 0) >= 0;

              return (
                <div key={player.id} onClick={() => setSelectedPlayer(player)} className="card-hover"
                  style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: '12px', border: `1px solid ${isBanned ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '12px', background: isBanned ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.02)', padding: '12px 16px', cursor: 'pointer', transition: 'all 0.2s', opacity: isBanned ? 0.75 : 1 }}>
                  {/* Rank */}
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Orbitron,sans-serif', fontWeight: 900, fontSize: '11px',
                    ...(idx === 0 ? { background: 'linear-gradient(135deg,#f5c518,#ffd700)', color: '#000' } : idx === 1 ? { background: 'linear-gradient(135deg,#9ca3af,#d1d5db)', color: '#000' } : idx === 2 ? { background: 'linear-gradient(135deg,#cd7f32,#b8860b)', color: '#fff' } : { background: 'rgba(255,255,255,0.07)', color: '#6b7280' }) }}>
                    {idx + 1}
                  </div>

                  {/* Info */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
                      <span className="font-rajdhani font-bold" style={{ fontSize: '14px', color: isBanned ? '#f87171' : '#fff' }}>{player.username}</span>
                      {isBanned  && <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '3px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700 }}>BANNED</span>}
                      {isGuest   && <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '3px', background: 'rgba(107,114,128,0.2)', border: '1px solid rgba(107,114,128,0.3)', color: '#9ca3af', fontFamily: 'Rajdhani,sans-serif' }}>GUEST</span>}
                      <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '3px', background: 'rgba(103,232,249,0.08)', border: '1px solid rgba(103,232,249,0.15)', color: '#67e8f9', fontFamily: 'Rajdhani,sans-serif' }}>LV {player.level}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <span className="font-rajdhani" style={{ fontSize: '11px', color: '#86efac' }}>✅ {fmt(player.totalWins)}</span>
                      <span className="font-rajdhani" style={{ fontSize: '11px', color: '#f87171' }}>❌ {fmt(player.totalLosses)}</span>
                      <span className="font-rajdhani" style={{ fontSize: '11px', color: '#9ca3af' }}>WR {pct(winRate)}</span>
                    </div>
                  </div>

                  {/* Balance + Profit */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="font-orbitron font-black" style={{ fontSize: 'clamp(12px,1.8vw,15px)', color: '#fde047', marginBottom: '2px' }}>{coin(player.balance)}</div>
                    <div className="font-rajdhani font-semibold" style={{ fontSize: '11px', color: isProfit ? '#86efac' : '#f87171' }}>{isProfit ? '+' : ''}{coin(player.totalProfit)}</div>
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
  const { loadPlayers, currentPlayer } = usePlayerStore();
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

  const ps = (bc) => ({ border: `1px solid ${bc}`, borderRadius: '24px', padding: 'clamp(20px,3vw,32px)' });
  const ls = (c)  => ({ fontFamily: 'Orbitron,sans-serif', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.35em', color: c, marginBottom: '20px' });
  const rs        = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' };
  const bb = (c)  => ({ width: '100%', padding: '10px 0', borderRadius: '8px', border: `1px solid ${c}`, background: 'transparent', color: c, cursor: 'pointer', fontSize: '13px', transition: 'background 0.2s', marginTop: '16px' });

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
      <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'clamp(80px,10vw,120px) clamp(16px,4vw,48px) clamp(60px,8vw,100px)', minHeight: '100vh' }}>
        <p className="font-rajdhani" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.35em', color: 'rgba(239,68,68,0.7)', marginBottom: '16px' }}>Internal Tools</p>
        <h1 className="font-orbitron font-black" style={{ fontSize: 'clamp(40px,8vw,100px)', letterSpacing: '0.2em', lineHeight: 1, marginBottom: '16px', color: '#f87171' }}>ADMIN</h1>
        <p style={{ color: '#d1d5db', fontSize: 'clamp(14px,2vw,18px)', fontWeight: 300, maxWidth: '520px', margin: '0 auto 48px', lineHeight: 1.7 }}>Debug panel — not for players.</p>
        {systemStats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 'clamp(12px,2vw,20px)', width: '100%', maxWidth: '75vw' }}>
            {Object.entries(systemStats).slice(0, 5).map(([k, v]) => (
              <div key={k} className="pill-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '8px', padding: 'clamp(16px,2vw,24px)', minHeight: '110px' }}>
                <div className="font-orbitron font-black" style={{ fontSize: 'clamp(16px,2.5vw,22px)', color: '#f87171' }}>{String(v)}</div>
                <div className="font-rajdhani text-gray-400" style={{ fontSize: 'clamp(9px,1vw,11px)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>{k.replace(/([A-Z])/g, ' $1')}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: '75%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'clamp(16px,2.5vw,28px)' }}>

          <PlayerAccountsPanel />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 'clamp(16px,2.5vw,28px)' }}>
            <div className="glass" style={ps('rgba(239,68,68,0.2)')}>
              <div style={ls('#f87171')}>⚙️ System Stats</div>
              {systemStats ? Object.entries(systemStats).map(([k, v]) => (
                <div key={k} style={rs}>
                  <span className="font-rajdhani" style={{ color: '#9ca3af', fontSize: '13px', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-rajdhani font-bold" style={{ color: '#fff', fontSize: '13px' }}>{String(v)}</span>
                </div>
              )) : <div className="font-rajdhani" style={{ color: '#6b7280', fontSize: '13px' }}>Loading...</div>}
              <button onClick={() => run('stats', () => fetchSystemStats().then(setSystemStats))} disabled={loading.stats} className="font-rajdhani font-bold" style={bb('rgba(239,68,68,0.6)')}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                {loading.stats ? 'Refreshing...' : '🔄 Refresh'}
              </button>
            </div>

            <div className="glass" style={ps('rgba(168,85,247,0.2)')}>
              <div style={ls('#a855f7')}>🧠 RTP — {currentPlayer?.username || 'No player'}</div>
              {rtpProfile ? [['Current Win Rate', pct(rtpProfile.currentWinRate)], ['Win Modifier', pct(rtpProfile.winModifier)], ['Losing Streak', rtpProfile.losingStreak], ['Winning Streak', rtpProfile.winningStreak], ['Session Fatigue', pct(rtpProfile.sessionFatigue)], ['Pity Counter', `${rtpProfile.pityCounter} / 15`], ['Volatility', rtpProfile.volatilityLevel]].map(([l, v]) => (
                <div key={l} style={rs}><span className="font-rajdhani" style={{ color: '#9ca3af', fontSize: '13px' }}>{l}</span><span className="font-rajdhani font-bold" style={{ color: '#c084fc', fontSize: '13px' }}>{v}</span></div>
              )) : <div className="font-rajdhani" style={{ color: '#6b7280', fontSize: '13px' }}>Select a player first.</div>}
              {currentPlayer && (
                <button onClick={() => run('resetRtp', () => resetRTP(currentPlayer.id).then(() => fetchRTPProfile(currentPlayer.id).then(setRtpProfile)))} disabled={loading.resetRtp} className="font-rajdhani font-bold" style={bb('rgba(168,85,247,0.6)')}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(168,85,247,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  {loading.resetRtp ? 'Resetting...' : '🔁 Reset RTP Profile'}
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 'clamp(16px,2.5vw,28px)' }}>
            <div className="glass" style={ps('rgba(234,179,8,0.15)')}>
              <div style={ls('#fde047')}>⚡ Force Streaks</div>
              <div style={{ marginBottom: '16px' }}>
                <div className="font-rajdhani" style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '8px' }}>Streak Length</div>
                <input type="number" value={streakLength} onChange={(e) => setStreakLength(parseInt(e.target.value) || 1)} className="casino-input" min={1} max={20} style={{ width: '100%' }} />
              </div>
              {!currentPlayer && <div className="font-rajdhani" style={{ color: 'rgba(234,179,8,0.6)', fontSize: '12px', marginBottom: '12px' }}>⚠️ Select a player first</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button onClick={() => run('ws', () => forceWinStreak(currentPlayer?.id, streakLength).then(() => fetchRTPProfile(currentPlayer.id).then(setRtpProfile)))} disabled={loading.ws || !currentPlayer} className="font-rajdhani font-bold" style={{ padding: '10px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: '1px solid rgba(34,197,94,0.4)', background: 'transparent', color: '#86efac', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(34,197,94,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>{loading.ws ? '...' : '🔥 Win'}</button>
                <button onClick={() => run('ls', () => forceLoseStreak(currentPlayer?.id, streakLength).then(() => fetchRTPProfile(currentPlayer.id).then(setRtpProfile)))} disabled={loading.ls || !currentPlayer} className="font-rajdhani font-bold" style={{ padding: '10px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: '1px solid rgba(239,68,68,0.4)', background: 'transparent', color: '#f87171', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>{loading.ls ? '...' : '💔 Lose'}</button>
              </div>
            </div>

            <div className="glass" style={ps('rgba(6,182,212,0.2)')}>
              <div style={ls('#67e8f9')}>▶️ Simulate Spins</div>
              <div style={{ marginBottom: '16px' }}>
                <div className="font-rajdhani" style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '8px' }}>Spin Count</div>
                <input type="number" value={simCount} onChange={(e) => setSimCount(Math.min(500, parseInt(e.target.value) || 1))} className="casino-input" min={1} max={500} style={{ width: '100%' }} />
              </div>
              <button onClick={() => run('sim', () => simulateSpins(currentPlayer?.id, simCount).then(setSimResult))} disabled={loading.sim || !currentPlayer} className="font-rajdhani font-bold" style={{ width: '100%', padding: '10px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: '1px solid rgba(6,182,212,0.4)', background: 'transparent', color: '#67e8f9', transition: 'background 0.2s', marginBottom: simResult ? '12px' : 0 }} onMouseOver={e => e.currentTarget.style.background = 'rgba(6,182,212,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                {loading.sim ? '⚙️ Simulating...' : `▶️ Run ${simCount} Spins`}
              </button>
              {simResult && [['Total Spins', simResult.totalSpins], ['Wins', simResult.wins], ['Losses', simResult.losses], ['Actual Win Rate', `${(simResult.actualWinRate * 100).toFixed(2)}%`]].map(([k, v]) => (
                <div key={k} style={rs}><span className="font-rajdhani" style={{ color: '#9ca3af', fontSize: '13px' }}>{k}</span><span className="font-rajdhani font-bold" style={{ color: '#67e8f9', fontSize: '13px' }}>{v}</span></div>
              ))}
            </div>
          </div>

          <div className="glass" style={ps('rgba(249,115,22,0.2)')}>
            <div style={ls('#fb923c')}>🔍 Redis Inspector</div>
            <button onClick={() => run('redis', () => inspectRedis().then(setRedisData))} disabled={loading.redis} className="font-rajdhani font-bold" style={{ padding: '10px 24px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: '1px solid rgba(249,115,22,0.4)', background: 'transparent', color: '#fb923c', transition: 'background 0.2s', marginBottom: '16px' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(249,115,22,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              {loading.redis ? '⏳ Loading...' : '🔍 Inspect Redis'}
            </button>
            {redisData && (
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '16px', maxHeight: '300px', overflowY: 'auto' }}>
                <pre style={{ fontSize: '12px', color: '#4ade80', fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(redisData, null, 2)}</pre>
              </div>
            )}
          </div>

        </div>
      </section>
    </div>
  );
}