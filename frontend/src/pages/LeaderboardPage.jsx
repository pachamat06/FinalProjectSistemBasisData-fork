import { useEffect, useState } from 'react';
import { useLeaderboardStore } from '../store';
import { fetchLeaderboard } from '../services/api';

const METRICS = [
  { key: 'profit',     label: 'Top Profit',   icon: '💰' },
  { key: 'highestWin', label: 'Biggest Win',  icon: '🎯' },
  { key: 'mostActive', label: 'Most Active',  icon: '🔥' },
];

export default function LeaderboardPage() {
  const { leaderboard, recentWins, setLeaderboard, setRecentWins, metric, setMetric } = useLeaderboardStore();
  const [loading, setLoading] = useState(false);

  const loadLeaderboard = async (m) => {
    setLoading(true);
    try {
      const data = await fetchLeaderboard(m);
      if (data?.leaderboard) setLeaderboard(data.leaderboard);
      if (data?.recentWins)  setRecentWins(data.recentWins);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard(metric);
    const interval = setInterval(() => loadLeaderboard(metric), 10000);
    return () => clearInterval(interval);
  }, [metric]);

  const formatScore = (score, m) => {
    if (m === 'mostActive') return `${score?.toFixed(0)} rounds`;
    return `${score?.toFixed(0)} 🪙`;
  };

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
        <p className="font-rajdhani" style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.35em',
          color: 'rgba(234,179,8,0.7)',
          marginBottom: '16px',
        }}>
          Rankings
        </p>

        <h1 className="font-orbitron font-black gradient-text-gold text-glow-gold" style={{
          fontSize: 'clamp(40px, 8vw, 100px)',
          letterSpacing: '0.2em',
          lineHeight: 1,
          marginBottom: '16px',
        }}>
          LEADERBOARD
        </h1>

        <p style={{
          color: '#d1d5db',
          fontSize: 'clamp(14px, 2vw, 18px)',
          fontWeight: 300,
          maxWidth: '520px',
          margin: '0 auto 12px',
          lineHeight: 1.7,
        }}>
          Realtime rankings — updates every 10 seconds.
        </p>

        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '48px' }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#4ade80', display: 'inline-block', animation: 'pulse 2s infinite',
          }} />
          <span className="font-rajdhani" style={{ color: '#4ade80', fontSize: '12px', letterSpacing: '0.2em' }}>LIVE</span>
        </div>

        {/* Metric tabs */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '56px',
        }}>
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className="font-rajdhani font-bold"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                ...(metric === m.key
                  ? { background: 'rgba(234,179,8,0.18)', border: '1px solid rgba(234,179,8,0.45)', color: '#fde047' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af' }),
              }}
              onMouseOver={e => { if (metric !== m.key) { e.currentTarget.style.borderColor = 'rgba(234,179,8,0.3)'; e.currentTarget.style.color = '#fde047'; }}}
              onMouseOut={e => { if (metric !== m.key) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#9ca3af'; }}}
            >
              <span>{m.icon}</span> {m.label}
            </button>
          ))}
        </div>

        {/* Top 3 podium */}
        {leaderboard.length >= 3 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'clamp(10px, 2vw, 20px)',
            width: '100%',
            maxWidth: '600px',
            alignItems: 'end',
            marginBottom: '16px',
          }}>
            {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, displayIdx) => {
              const rank = displayIdx === 0 ? 2 : displayIdx === 1 ? 1 : 3;
              const medals  = { 1: '🥇', 2: '🥈', 3: '🥉' };
              const colors  = { 1: '#fde047', 2: '#d1d5db', 3: '#b45309' };
              const borders = { 1: 'rgba(234,179,8,0.4)', 2: 'rgba(156,163,175,0.3)', 3: 'rgba(180,83,9,0.3)' };
              return (
                <div
                  key={entry?.playerId}
                  className="glass"
                  style={{
                    border: `1px solid ${borders[rank]}`,
                    borderRadius: '16px',
                    padding: 'clamp(16px, 2vw, 24px) 12px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: rank === 1 ? '0' : '24px',
                  }}
                >
                  <div style={{ fontSize: '28px' }}>{medals[rank]}</div>
                  <div className="font-rajdhani font-bold text-white" style={{ fontSize: 'clamp(12px, 1.5vw, 15px)' }}>
                    {entry?.username || 'Player'}
                  </div>
                  <div className="font-orbitron font-bold" style={{ fontSize: 'clamp(11px, 1.2vw, 13px)', color: colors[rank] }}>
                    {formatScore(entry?.score, metric)}
                  </div>
                  <div className={rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : 'rank-3'} style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Orbitron', fontWeight: 900, fontSize: '13px', marginTop: '4px',
                  }}>
                    {rank}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── FULL RANKINGS + SIDEBAR ── */}
      <section style={{ padding: 'clamp(40px, 6vw, 80px) clamp(16px, 4vw, 48px)' }}>
        <div style={{ maxWidth: '75%', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'clamp(16px, 2.5vw, 28px)',
            alignItems: 'start',
          }}>

            {/* Rankings list */}
            <div className="glass" style={{
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '24px',
              padding: 'clamp(20px, 3vw, 32px)',
            }}>
              <div className="font-rajdhani text-gray-400" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.35em', marginBottom: '20px' }}>
                Full Rankings
              </div>

              {loading && leaderboard.length === 0 && (
                <div className="font-rajdhani" style={{ textAlign: 'center', color: '#6b7280', padding: '32px 0', fontSize: '14px' }}>
                  Loading...
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {leaderboard.slice(3).map((entry, i) => (
                  <div
                    key={entry.playerId || i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.03)',
                      padding: '12px 16px',
                    }}
                  >
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '50%',
                      background: 'rgba(255,255,255,0.07)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Orbitron', fontWeight: 900, fontSize: '12px', color: '#9ca3af',
                      flexShrink: 0,
                    }}>
                      {i + 4}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="font-rajdhani font-bold text-white" style={{ fontSize: '14px' }}>
                        {entry.username || 'Player'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>
                        Wins: {entry.totalWins || '—'} · Losses: {entry.totalLosses || '—'}
                      </div>
                    </div>
                    <div className="font-orbitron font-bold" style={{ fontSize: '13px', color: '#fde047' }}>
                      {formatScore(entry.score, metric)}
                    </div>
                  </div>
                ))}

                {!loading && leaderboard.length <= 3 && (
                  <div className="font-rajdhani" style={{ textAlign: 'center', color: '#6b7280', padding: '20px 0', fontSize: '13px' }}>
                    No further entries.
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2vw, 20px)' }}>

              {/* Recent wins */}
              <div className="glass" style={{
                border: '1px solid rgba(234,179,8,0.15)',
                borderRadius: '24px',
                padding: 'clamp(20px, 3vw, 28px)',
              }}>
                <div className="font-rajdhani text-gray-400" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.35em', marginBottom: '20px' }}>
                  💰 Recent Wins
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {recentWins.length === 0 && (
                    <div className="font-rajdhani" style={{ textAlign: 'center', color: '#6b7280', fontSize: '13px', padding: '16px 0' }}>No wins yet</div>
                  )}
                  {recentWins.map((win, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 0',
                      borderBottom: i < recentWins.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    }}>
                      <div>
                        <div className="font-rajdhani font-bold text-white" style={{ fontSize: '14px' }}>{win.username}</div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>{win.multiplier}× multiplier</div>
                      </div>
                      <div className="font-rajdhani font-bold" style={{ fontSize: '14px', color: '#86efac' }}>
                        +{win.payout?.toFixed(0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="glass" style={{
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '24px',
                padding: 'clamp(20px, 3vw, 28px)',
              }}>
                <div className="font-rajdhani text-gray-400" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.35em', marginBottom: '16px' }}>
                  Ranking System
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { icon: '💰', label: 'Top Profit',   desc: 'Net coins earned'         },
                    { icon: '🎯', label: 'Biggest Win',  desc: 'Single highest payout'    },
                    { icon: '🔥', label: 'Most Active',  desc: 'Total rounds played'       },
                  ].map((r) => (
                    <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px' }}>{r.icon}</span>
                      <div>
                        <span className="font-rajdhani font-bold text-white" style={{ fontSize: '13px' }}>{r.label}</span>
                        <span className="font-rajdhani" style={{ fontSize: '12px', color: '#6b7280' }}> — {r.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

    </div>
  );
}