import { useState, useEffect, useRef } from 'react';
import { usePlayerStore, useGameStore } from '../store';
import { spinGame, fetchRTPProfile } from '../services/api';
import SlotReels from '../components/SlotReels';
import RTPMeter from '../components/RTPMeter';
import Notification from '../components/Notification';
import StatCard from '../components/StatCard';
import { Link } from 'react-router-dom';

const BET_PRESETS = [50, 100, 250, 500, 1000];

export default function CasinoPage() {
  const { currentPlayer, updateBalance, loadPlayers } = usePlayerStore();
  const { isSpinning, setSpinning, lastResult, addResult, notification, setNotification } = useGameStore();

  const [betAmount, setBetAmount] = useState(100);
  const [rtpProfile, setRtpProfile] = useState(null);
  const [localHistory, setLocalHistory] = useState([]);
  const [outcome, setOutcome] = useState(null);
  const [showFlash, setShowFlash] = useState(false);
  const [flashType, setFlashType] = useState('');
  const betInputRef = useRef(null);

  useEffect(() => {
    if (!currentPlayer) loadPlayers();
  }, []);

  useEffect(() => {
    if (currentPlayer?.id) {
      fetchRTPProfile(currentPlayer.id).then(setRtpProfile).catch(() => {});
    }
  }, [currentPlayer?.id]);

  const handleSpin = async () => {
    if (!currentPlayer || isSpinning) return;
    if (betAmount <= 0 || betAmount > currentPlayer.balance) return;

    setSpinning(true);
    setOutcome(null);

    try {
      const result = await spinGame(currentPlayer.id, betAmount);
      await new Promise((r) => setTimeout(r, 1800));

      setOutcome(result.outcome);
      setSpinning(false);
      setFlashType(result.outcome);
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 800);

      updateBalance(result.newBalance);
      addResult(result);
      setLocalHistory((prev) => [result, ...prev].slice(0, 20));

      if (result.isBigWin) {
        setNotification({ type: 'bigwin', message: `💰 BIG WIN! +${result.payout.toFixed(0)} coins! (${result.multiplier}x)` });
      } else if (result.outcome === 'win') {
        setNotification({ type: 'win', message: `✅ WIN! +${result.payout.toFixed(0)} coins` });
      }

      fetchRTPProfile(currentPlayer.id).then(setRtpProfile).catch(() => {});
    } catch (err) {
      setSpinning(false);
      setNotification({ type: 'error', message: err.message });
    }
  };

  if (!currentPlayer) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass" style={{
          border: '1px solid rgba(234,179,8,0.2)',
          borderRadius: '20px',
          padding: '48px',
          textAlign: 'center',
          maxWidth: '400px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎰</div>
          <h2 className="font-orbitron" style={{ color: '#facc15', fontSize: '20px', marginBottom: '12px' }}>No Player Selected</h2>
          <p className="font-rajdhani" style={{ color: '#9ca3af', marginBottom: '24px' }}>Select a player from the Home page to start playing.</p>
          <Link to="/" className="glass-gold font-rajdhani font-bold" style={{
            border: '1px solid rgba(234,179,8,0.3)',
            padding: '10px 24px',
            borderRadius: '8px',
            color: '#facc15',
            textDecoration: 'none',
            fontSize: '14px',
          }}>
            ← Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>

      <Notification notification={notification} />

      {showFlash && (
        <div className={`fixed inset-0 pointer-events-none z-40 transition-opacity duration-300 ${flashType === 'win' ? 'outcome-win' : 'outcome-lose'}`} />
      )}

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
        <h1 className="font-orbitron font-black text-white" style={{
          fontSize: 'clamp(40px, 8vw, 100px)',
          letterSpacing: '0.2em',
          lineHeight: 1,
          marginBottom: '16px',
        }}>
          CASINO
        </h1>

        <p style={{
          color: '#d1d5db',
          fontSize: 'clamp(14px, 2vw, 18px)',
          fontWeight: 300,
          maxWidth: '520px',
          margin: '0 auto 12px',
          lineHeight: 1.7,
        }}>
          Premium spin suite with adaptive RTP and real-time outcomes.
        </p>

        {/* Balance pill */}
        <div className="glass-gold" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          border: '1px solid rgba(234,179,8,0.3)',
          borderRadius: '10px',
          padding: '14px 28px',
          marginTop: '32px',
          marginBottom: '40px',
        }}>
          <div>
            <div className="font-rajdhani" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.35em', color: '#9ca3af', marginBottom: '4px' }}>Balance</div>
            <div className="font-orbitron font-black text-glow-gold" style={{ fontSize: 'clamp(22px, 3vw, 32px)', color: '#fde047' }}>
              {currentPlayer.balance?.toLocaleString(undefined, { maximumFractionDigits: 0 })} 🪙
            </div>
          </div>
        </div>

        {/* Outcome badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          padding: '10px 24px',
          fontSize: '14px',
          fontWeight: 600,
          marginBottom: '40px',
          ...(outcome === 'win'
            ? { background: 'rgba(34,197,94,0.15)', color: '#86efac', border: '1px solid rgba(34,197,94,0.3)' }
            : outcome === 'lose'
            ? { background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }
            : { background: 'rgba(255,255,255,0.08)', color: '#d1d5db', border: '1px solid rgba(255,255,255,0.12)' }),
        }}>
          {outcome === 'win'
            ? `✅ WIN! +${lastResult?.payout?.toFixed(0)} coins (${lastResult?.multiplier}x)`
            : outcome === 'lose'
            ? '❌ No Luck This Time'
            : isSpinning
            ? '⏳ Spinning...'
            : '🎰 Ready to Spin'}
        </div>

        {/* Slot reels */}
        <div style={{
          border: outcome === 'win'
            ? '2px solid rgba(34,197,94,0.6)'
            : outcome === 'lose'
            ? '2px solid rgba(239,68,68,0.3)'
            : isSpinning
            ? '2px solid rgba(234,179,8,0.6)'
            : '2px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          padding: '16px',
          marginBottom: '40px',
          transition: 'border-color 0.3s',
        }} className={isSpinning ? 'glow-gold' : outcome === 'win' ? 'glow-green' : ''}>
          <SlotReels spinning={isSpinning} outcome={outcome} multiplier={lastResult?.multiplier} />
        </div>

        {/* Bet presets */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '16px',
          maxWidth: '520px',
        }}>
          {BET_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => setBetAmount(preset)}
              className="font-rajdhani font-semibold"
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                ...(betAmount === preset
                  ? { background: 'rgba(234,179,8,0.2)', border: '1px solid rgba(234,179,8,0.4)', color: '#fde047' }
                  : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#d1d5db' }),
              }}
            >
              {preset}
            </button>
          ))}
          <button
            onClick={() => setBetAmount(Math.floor(currentPlayer.balance / 2))}
            className="font-rajdhani font-semibold"
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#d1d5db',
              transition: 'all 0.2s',
            }}
          >
            ½ MAX
          </button>
        </div>

        {/* Bet input */}
        <div style={{ width: '100%', maxWidth: '320px', marginBottom: '32px' }}>
          <input
            ref={betInputRef}
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
            className="casino-input"
            style={{ textAlign: 'center', fontSize: '20px', width: '100%' }}
            min={1}
            max={currentPlayer.balance}
          />
        </div>

        {/* Spin button */}
        <button
          id="spin-button"
          onClick={handleSpin}
          disabled={isSpinning || betAmount <= 0 || betAmount > currentPlayer.balance}
          className="spin-btn font-orbitron font-black glow-gold"
          style={{
            width: '176px',
            height: '176px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            fontSize: '24px',
            background: 'linear-gradient(135deg, #f5c518, #b8960c)',
          }}
        >
          {isSpinning ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div className="animate-rotate-slow" style={{ fontSize: '36px' }}>⚙️</div>
              <span style={{ fontSize: '12px', letterSpacing: '0.2em' }}>SPIN</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '44px' }}>🎰</span>
              <span style={{ fontSize: '12px', letterSpacing: '0.2em' }}>SPIN</span>
            </div>
          )}
        </button>
      </section>

      {/* ── STATS + HISTORY ── */}
      <section style={{ padding: 'clamp(40px, 6vw, 80px) clamp(16px, 4vw, 48px)' }}>
        <div style={{ maxWidth: '75%', margin: '0 auto' }}>

          {/* Session stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 'clamp(12px, 2vw, 20px)',
            marginBottom: 'clamp(20px, 3vw, 40px)',
          }}>
            {[
              { label: 'Win Rate',    value: `${((rtpProfile?.currentWinRate || 0.45) * 100).toFixed(1)}%`, color: '#fde047' },
              { label: 'RTP',         value: `${rtpProfile?.rtp ?? 57}%`,                                    color: '#67e8f9' },
              { label: 'Win Streak',  value: rtpProfile?.winningStreak ?? 0,                                 color: '#86efac' },
              { label: 'Lose Streak', value: rtpProfile?.losingStreak ?? 0,                                  color: '#fca5a5' },
            ].map((s) => (
              <div key={s.label} className="pill-card" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '8px',
                padding: 'clamp(16px, 2vw, 24px)',
                minHeight: '120px',
              }}>
                <div className="font-orbitron font-black" style={{ fontSize: 'clamp(24px, 3vw, 32px)', color: s.color }}>{s.value}</div>
                <div className="font-rajdhani text-gray-400" style={{ fontSize: 'clamp(10px, 1vw, 13px)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Recent outcomes */}
          <div className="glass" style={{
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px',
            padding: 'clamp(20px, 3vw, 32px)',
          }}>
            <div className="font-rajdhani text-gray-400" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.35em', marginBottom: '20px' }}>
              Recent Outcomes
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {localHistory.slice(0, 8).map((r, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)',
                  padding: '12px 18px',
                }}>
                  <span className="font-rajdhani" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                    {r.outcome === 'win' ? 'Win' : 'Loss'}
                  </span>
                  <span className="font-rajdhani font-semibold" style={{
                    fontSize: '14px',
                    color: r.outcome === 'win' ? '#86efac' : '#f87171',
                  }}>
                    {r.outcome === 'win' ? `+${r.payout?.toFixed(0)}` : `-${r.betAmount?.toFixed(0)}`}
                  </span>
                </div>
              ))}
              {!localHistory.length && (
                <div className="font-rajdhani" style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', padding: '20px 0' }}>
                  No recent outcomes yet.
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}