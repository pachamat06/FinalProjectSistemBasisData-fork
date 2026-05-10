import { useEffect, useState } from 'react';
import { usePlayerStore } from '../store';
import { fetchPlayerStats, fetchPlayerHistory } from '../services/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Area, AreaChart
} from 'recharts';
import StatCard from '../components/StatCard';
import { Link } from 'react-router-dom';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass" style={{
      border: '1px solid rgba(234,179,8,0.2)',
      padding: '8px 12px',
      borderRadius: '8px',
    }}>
      <div className="font-rajdhani" style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '4px' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="font-rajdhani" style={{ color: p.color, fontSize: '12px' }}>
          {p.name}: {p.value?.toFixed(0)}
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const { currentPlayer, loadPlayers } = usePlayerStore();
  const [stats, setStats]     = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentPlayer) loadPlayers();
  }, []);

  useEffect(() => {
    if (!currentPlayer?.id) return;
    setLoading(true);
    Promise.all([
      fetchPlayerStats(currentPlayer.id),
      fetchPlayerHistory(currentPlayer.id, 100),
    ]).then(([s, h]) => {
      setStats(s);
      setHistory(h);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [currentPlayer?.id]);

  if (!currentPlayer) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass" style={{ border: '1px solid rgba(234,179,8,0.2)', borderRadius: '20px', padding: '48px', textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <h2 className="font-orbitron" style={{ color: '#facc15', fontSize: '20px', marginBottom: '20px' }}>No Player Selected</h2>
          <Link to="/" className="glass-gold font-rajdhani font-bold" style={{ border: '1px solid rgba(234,179,8,0.3)', padding: '10px 24px', borderRadius: '8px', color: '#facc15', textDecoration: 'none', fontSize: '14px' }}>
            ← Go Home
          </Link>
        </div>
      </div>
    );
  }

  const chartData = [...history].reverse().map((r, i) => ({
    round: i + 1,
    balance: r.resultingBalance,
    bet: r.betAmount,
    payout: r.payout,
    profit: r.payout - r.betAmount,
    winRate: parseFloat((r.winRateUsed * 100).toFixed(1)),
  }));

  const winCount  = history.filter((r) => r.outcome === 'win').length;
  const totalBet    = history.reduce((s, r) => s + r.betAmount, 0);
  const totalPayout = history.reduce((s, r) => s + r.payout, 0);

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
        <p className="font-rajdhani" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.35em', color: 'rgba(234,179,8,0.7)', marginBottom: '16px' }}>
          Player Stats
        </p>
        <h1 className="font-orbitron font-black gradient-text-gold" style={{ fontSize: 'clamp(40px, 8vw, 100px)', letterSpacing: '0.2em', lineHeight: 1, marginBottom: '16px' }}>
          ANALYTICS
        </h1>
        <p style={{ color: '#d1d5db', fontSize: 'clamp(14px, 2vw, 18px)', fontWeight: 300, maxWidth: '520px', margin: '0 auto 48px', lineHeight: 1.7 }}>
          Tracking performance for <span style={{ color: '#fde047' }}>{currentPlayer.username}</span>
        </p>

        {/* Top stat cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 'clamp(12px, 2vw, 20px)',
          width: '100%',
          maxWidth: '75vw',
          marginBottom: '40px',
        }}>
          {[
            { label: 'Total Wins',   value: currentPlayer.totalWins,                                              color: '#86efac' },
            { label: 'Total Losses', value: currentPlayer.totalLosses,                                            color: '#f87171' },
            { label: 'Net Profit',   value: `${currentPlayer.totalProfit?.toFixed(0)} 🪙`,                        color: currentPlayer.totalProfit >= 0 ? '#86efac' : '#f87171' },
            { label: 'Best Win',     value: `${currentPlayer.highestSingleWin?.toFixed(0)} 🪙`,                   color: '#fde047' },
            { label: 'Level',        value: currentPlayer.level,                                                  color: '#67e8f9' },
          ].map((s) => (
            <div key={s.label} className="pill-card" style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', textAlign: 'center', gap: '8px',
              padding: 'clamp(16px, 2vw, 24px)', minHeight: '110px',
            }}>
              <div className="font-orbitron font-black" style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', color: s.color }}>{s.value}</div>
              <div className="font-rajdhani text-gray-400" style={{ fontSize: 'clamp(10px, 1vw, 13px)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="font-rajdhani" style={{ color: '#6b7280', fontSize: '14px' }}>Loading charts...</div>
        )}
      </section>

      {/* ── CHARTS ── */}
      {chartData.length > 0 && (
        <section style={{ padding: 'clamp(40px, 6vw, 80px) clamp(16px, 4vw, 48px)' }}>
          <div style={{ maxWidth: '75%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 2.5vw, 28px)' }}>

            {/* Balance history */}
            <div className="glass" style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: 'clamp(20px, 3vw, 32px)' }}>
              <div className="font-rajdhani" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.35em', color: '#67e8f9', marginBottom: '20px' }}>
                📈 Balance History
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00f5ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00f5ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="round" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <YAxis stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="balance" stroke="#00f5ff" fill="url(#balGrad)" name="Balance" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Bet vs Payout + RTP */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'clamp(16px, 2.5vw, 28px)',
            }}>
              <div className="glass" style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: 'clamp(20px, 3vw, 32px)' }}>
                <div className="font-rajdhani" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.35em', color: '#fde047', marginBottom: '20px' }}>
                  🎯 Bet vs Payout
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData.slice(-30)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="round" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <YAxis stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="bet"    fill="rgba(245,197,24,0.3)"  name="Bet"    radius={[2,2,0,0]} />
                    <Bar dataKey="payout" fill="rgba(57,255,20,0.55)"  name="Payout" radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="glass" style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: 'clamp(20px, 3vw, 32px)' }}>
                <div className="font-rajdhani" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.35em', color: '#a855f7', marginBottom: '20px' }}>
                  🧠 RTP History
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData.slice(-30)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="round" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <YAxis domain={[0, 100]} stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="winRate" stroke="#a855f7" name="Win Rate %" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Profit per round */}
            <div className="glass" style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: 'clamp(20px, 3vw, 32px)' }}>
              <div className="font-rajdhani" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.35em', color: '#86efac', marginBottom: '20px' }}>
                💹 Profit Per Round
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData.slice(-40)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="round" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <YAxis stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="profit" name="Profit" radius={[2,2,0,0]} fill="#39ff14" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Session summary */}
            <div className="glass" style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: 'clamp(20px, 3vw, 32px)' }}>
              <div className="font-rajdhani" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.35em', color: '#9ca3af', marginBottom: '20px' }}>
                Session Summary — Last {history.length} Rounds
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                {[
                  { label: 'Win Rate',       value: `${history.length > 0 ? ((winCount / history.length) * 100).toFixed(1) : 0}%`, color: '#86efac' },
                  { label: 'Total Wagered',  value: `${totalBet.toFixed(0)} 🪙`,                                                    color: '#fde047' },
                  { label: 'Total Returned', value: `${totalPayout.toFixed(0)} 🪙`,                                                 color: '#67e8f9' },
                  { label: 'Net Result',     value: `${(totalPayout - totalBet).toFixed(0)} 🪙`,                                    color: totalPayout >= totalBet ? '#86efac' : '#f87171' },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="font-orbitron font-black" style={{ fontSize: 'clamp(14px, 2vw, 20px)', color: s.color, marginBottom: '6px' }}>{s.value}</div>
                    <div className="font-rajdhani" style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.25em' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>
      )}

      {!loading && chartData.length === 0 && (
        <section style={{ padding: 'clamp(40px, 6vw, 80px) clamp(16px, 4vw, 48px)' }}>
          <div style={{ maxWidth: '75%', margin: '0 auto' }}>
            <div className="glass" style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎰</div>
              <div className="font-rajdhani" style={{ color: '#9ca3af', marginBottom: '24px', fontSize: '15px' }}>
                No game history yet. Start playing to see analytics!
              </div>
              <Link to="/casino" className="glass-gold font-rajdhani font-bold" style={{
                border: '1px solid rgba(234,179,8,0.3)', padding: '10px 24px',
                borderRadius: '8px', color: '#facc15', textDecoration: 'none', fontSize: '14px',
              }}>
                Play Now →
              </Link>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}