import { useState, useEffect } from 'react';
import { usePlayerStore } from '../store';
import {
  fetchSystemStats, simulateSpins, forceWinStreak, forceLoseStreak,
  resetRTP, fetchRTPProfile, inspectRedis
} from '../services/api';

export default function AdminPage() {
  const { players, loadPlayers, currentPlayer } = usePlayerStore();
  const [systemStats, setSystemStats] = useState(null);
  const [rtpProfile,  setRtpProfile]  = useState(null);
  const [redisData,   setRedisData]   = useState(null);
  const [simResult,   setSimResult]   = useState(null);
  const [loading,     setLoading]     = useState({});
  const [streakLength, setStreakLength] = useState(5);
  const [simCount,     setSimCount]    = useState(100);

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

  const panelStyle = (borderColor) => ({
    border: `1px solid ${borderColor}`,
    borderRadius: '24px',
    padding: 'clamp(20px, 3vw, 32px)',
  });

  const labelStyle = (color) => ({
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.35em',
    color,
    marginBottom: '20px',
  });

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  };

  const btnStyle = (color, bg) => ({
    width: '100%',
    padding: '10px 0',
    borderRadius: '8px',
    border: `1px solid ${color}`,
    background: bg || 'transparent',
    color,
    cursor: 'pointer',
    fontSize: '13px',
    letterSpacing: '0.05em',
    transition: 'background 0.2s',
    marginTop: '16px',
  });

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── HERO ── */}
      <section style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'clamp(80px, 10vw, 120px) clamp(16px, 4vw, 48px) clamp(60px, 8vw, 100px)',
        minHeight: '100vh',
      }}>
        <p className="font-rajdhani" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.35em', color: 'rgba(239,68,68,0.7)', marginBottom: '16px' }}>
          Internal Tools
        </p>
        <h1 className="font-orbitron font-black" style={{ fontSize: 'clamp(40px, 8vw, 100px)', letterSpacing: '0.2em', lineHeight: 1, marginBottom: '16px', color: '#f87171' }}>
          ADMIN
        </h1>
        <p style={{ color: '#d1d5db', fontSize: 'clamp(14px, 2vw, 18px)', fontWeight: 300, maxWidth: '520px', margin: '0 auto 48px', lineHeight: 1.7 }}>
          Debug panel — not for players.
        </p>

        {/* System stat pills */}
        {systemStats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 'clamp(12px, 2vw, 20px)',
            width: '100%',
            maxWidth: '75vw',
          }}>
            {Object.entries(systemStats).slice(0, 4).map(([k, v]) => (
              <div key={k} className="pill-card" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', textAlign: 'center', gap: '8px',
                padding: 'clamp(16px, 2vw, 24px)', minHeight: '110px',
              }}>
                <div className="font-orbitron font-black" style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', color: '#f87171' }}>{String(v)}</div>
                <div className="font-rajdhani text-gray-400" style={{ fontSize: 'clamp(10px, 1vw, 12px)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>
                  {k.replace(/([A-Z])/g, ' $1')}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── PANELS ── */}
      <section style={{ padding: 'clamp(40px, 6vw, 80px) clamp(16px, 4vw, 48px)' }}>
        <div style={{ maxWidth: '75%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2.5vw, 28px)' }}>

          {/* Row 1 — System Stats + RTP Inspector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(16px, 2.5vw, 28px)' }}>

            {/* System Stats */}
            <div className="glass" style={panelStyle('rgba(239,68,68,0.2)')}>
              <div style={labelStyle('#f87171')}>⚙️ System Stats</div>
              {systemStats ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {Object.entries(systemStats).map(([k, v]) => (
                    <div key={k} style={rowStyle}>
                      <span className="font-rajdhani" style={{ color: '#9ca3af', fontSize: '13px', textTransform: 'capitalize' }}>
                        {k.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span className="font-rajdhani font-bold" style={{ color: '#fff', fontSize: '13px' }}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="font-rajdhani" style={{ color: '#6b7280', fontSize: '13px' }}>Loading...</div>
              )}
              <button
                onClick={() => run('stats', () => fetchSystemStats().then(setSystemStats))}
                disabled={loading.stats}
                className="font-rajdhani font-bold"
                style={btnStyle('rgba(239,68,68,0.6)')}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                {loading.stats ? 'Refreshing...' : '🔄 Refresh'}
              </button>
            </div>

            {/* RTP Inspector */}
            <div className="glass" style={panelStyle('rgba(168,85,247,0.2)')}>
              <div style={labelStyle('#a855f7')}>🧠 RTP Profile — {currentPlayer?.username || 'No player'}</div>
              {rtpProfile ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {[
                    ['Current Win Rate', `${(rtpProfile.currentWinRate * 100).toFixed(2)}%`],
                    ['Win Modifier',     `${(rtpProfile.winModifier * 100).toFixed(2)}%`],
                    ['Losing Streak',    rtpProfile.losingStreak],
                    ['Winning Streak',   rtpProfile.winningStreak],
                    ['Session Fatigue',  `${(rtpProfile.sessionFatigue * 100).toFixed(2)}%`],
                    ['Pity Counter',     `${rtpProfile.pityCounter} / 15`],
                    ['Volatility',       rtpProfile.volatilityLevel],
                  ].map(([label, val]) => (
                    <div key={label} style={rowStyle}>
                      <span className="font-rajdhani" style={{ color: '#9ca3af', fontSize: '13px' }}>{label}</span>
                      <span className="font-rajdhani font-bold" style={{ color: '#c084fc', fontSize: '13px' }}>{val}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="font-rajdhani" style={{ color: '#6b7280', fontSize: '13px' }}>Select a player first.</div>
              )}
              {currentPlayer && (
                <button
                  onClick={() => run('resetRtp', () => resetRTP(currentPlayer.id).then(() => fetchRTPProfile(currentPlayer.id).then(setRtpProfile)))}
                  disabled={loading.resetRtp}
                  className="font-rajdhani font-bold"
                  style={btnStyle('rgba(168,85,247,0.6)')}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(168,85,247,0.1)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  {loading.resetRtp ? 'Resetting...' : '🔁 Reset RTP Profile'}
                </button>
              )}
            </div>
          </div>

          {/* Row 2 — Force Streaks + Simulate Spins */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(16px, 2.5vw, 28px)' }}>

            {/* Force Streaks */}
            <div className="glass" style={panelStyle('rgba(234,179,8,0.15)')}>
              <div style={labelStyle('#fde047')}>⚡ Force Streaks</div>
              <div style={{ marginBottom: '16px' }}>
                <div className="font-rajdhani" style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '8px' }}>
                  Streak Length
                </div>
                <input
                  type="number"
                  value={streakLength}
                  onChange={(e) => setStreakLength(parseInt(e.target.value) || 1)}
                  className="casino-input"
                  min={1} max={20}
                  style={{ width: '100%' }}
                />
              </div>
              {!currentPlayer && (
                <div className="font-rajdhani" style={{ color: 'rgba(234,179,8,0.6)', fontSize: '12px', marginBottom: '12px' }}>
                  ⚠️ Select a player first
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={() => run('winStreak', () => forceWinStreak(currentPlayer?.id, streakLength).then(() => fetchRTPProfile(currentPlayer.id).then(setRtpProfile)))}
                  disabled={loading.winStreak || !currentPlayer}
                  className="font-rajdhani font-bold"
                  style={{
                    padding: '10px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
                    border: '1px solid rgba(34,197,94,0.4)', background: 'transparent', color: '#86efac', transition: 'background 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(34,197,94,0.1)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  {loading.winStreak ? '...' : '🔥 Win Streak'}
                </button>
                <button
                  onClick={() => run('loseStreak', () => forceLoseStreak(currentPlayer?.id, streakLength).then(() => fetchRTPProfile(currentPlayer.id).then(setRtpProfile)))}
                  disabled={loading.loseStreak || !currentPlayer}
                  className="font-rajdhani font-bold"
                  style={{
                    padding: '10px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
                    border: '1px solid rgba(239,68,68,0.4)', background: 'transparent', color: '#f87171', transition: 'background 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  {loading.loseStreak ? '...' : '💔 Lose Streak'}
                </button>
              </div>
            </div>

            {/* Simulate Spins */}
            <div className="glass" style={panelStyle('rgba(6,182,212,0.2)')}>
              <div style={labelStyle('#67e8f9')}>▶️ Simulate Spins</div>
              <div style={{ marginBottom: '16px' }}>
                <div className="font-rajdhani" style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '8px' }}>
                  Spin Count
                </div>
                <input
                  type="number"
                  value={simCount}
                  onChange={(e) => setSimCount(Math.min(500, parseInt(e.target.value) || 1))}
                  className="casino-input"
                  min={1} max={500}
                  style={{ width: '100%' }}
                />
              </div>
              <button
                onClick={() => run('sim', () => simulateSpins(currentPlayer?.id, simCount).then(setSimResult))}
                disabled={loading.sim || !currentPlayer}
                className="font-rajdhani font-bold"
                style={{
                  width: '100%', padding: '10px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
                  border: '1px solid rgba(6,182,212,0.4)', background: 'transparent', color: '#67e8f9',
                  transition: 'background 0.2s', marginBottom: '16px',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(6,182,212,0.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                {loading.sim ? '⚙️ Simulating...' : `▶️ Run ${simCount} Spins`}
              </button>
              {simResult && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {[
                    ['Total Spins',    simResult.totalSpins],
                    ['Wins',           simResult.wins],
                    ['Losses',         simResult.losses],
                    ['Actual Win Rate',`${(simResult.actualWinRate * 100).toFixed(2)}%`],
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

          {/* Row 3 — Redis Inspector */}
          <div className="glass" style={panelStyle('rgba(249,115,22,0.2)')}>
            <div style={labelStyle('#fb923c')}>🔍 Redis Inspector</div>
            <button
              onClick={() => run('redis', () => inspectRedis().then(setRedisData))}
              disabled={loading.redis}
              className="font-rajdhani font-bold"
              style={{
                padding: '10px 24px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
                border: '1px solid rgba(249,115,22,0.4)', background: 'transparent', color: '#fb923c',
                transition: 'background 0.2s', marginBottom: '16px',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(249,115,22,0.1)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
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