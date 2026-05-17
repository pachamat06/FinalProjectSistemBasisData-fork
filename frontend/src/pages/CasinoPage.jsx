import { useState, useEffect, useRef } from 'react';
import { usePlayerStore, useGameStore } from '../store';
import { spinGame, fetchRTPProfile } from '../services/api';
import SlotReels from '../components/SlotReels';
import Roulette from '../components/Roulette';
import CoinFlip from '../components/CoinFlip';
import DiceRoll from '../components/DiceRoll.jsx';
import Crash from '../components/Crash';
import CardDraw from '../components/CardDraw';
import Notification from '../components/Notification';
import { Link } from 'react-router-dom';

const BET_PRESETS   = [50, 100, 250, 500, 1000];
const SYMBOLS       = ['🍒', '💎', '🍋', '⭐', '🔔', '🃏', '🍀', '🌙', '🔥', '💰'];
const REEL_DELAY_MS = 1500;
const ALL_REELS_DONE_MS = (3 - 1) * REEL_DELAY_MS + 400; // 3400ms

function computeReelSymbols(outcome, multiplier) {
  if (outcome === 'win') {
    if (multiplier >= 10) return ['💎', '💎', '💎'];
    if (multiplier >= 5)  return ['⭐', '⭐', '⭐'];
    if (multiplier >= 3)  return ['🔔', '🔔', '🔔'];
    const s = SYMBOLS[Math.floor(Math.random() * 5)];
    return [s, s, SYMBOLS[Math.floor(Math.random() * 5)]];
  }
  const used = new Set();
  return Array.from({ length: 3 }, () => {
    let s;
    do { s = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]; } while (used.has(s));
    used.add(s);
    return s;
  });
}

export default function CasinoPage() {
  const { currentPlayer, updateBalance, loadPlayers } = usePlayerStore();
  const { isSpinning, setSpinning, lastResult, addResult, notification, setNotification } = useGameStore();

  const [betAmount,    setBetAmount]    = useState(100);
  const [rtpProfile,   setRtpProfile]   = useState(null);
  const [localHistory, setLocalHistory] = useState([]);
  const [outcome,      setOutcome]      = useState(null);
  const [reelSymbols,  setReelSymbols]  = useState([null, null, null]);
  const [showFlash,    setShowFlash]    = useState(false);
  const [flashType,    setFlashType]    = useState('');

  const [isRolling, setIsRolling] = useState(false);
  const [selectedGame, setSelectedGame] = useState('slots');

  const games = [
    { id: 'slots',    name: 'SLOTS',     icon: '🎰', desc: 'Classic spins, big wins and cinematic reels.',        component: SlotReels },
    { id: 'roulette', name: 'ROULETTE',  icon: '🎡', desc: 'Place your bet and chase the red or black wheel.',   component: Roulette  },
    { id: 'coinflip', name: 'COIN FLIP', icon: '🪙', desc: 'Heads or tails, fast-paced currency gamble.',        component: CoinFlip  },
    { id: 'dice',     name: 'DICE',      icon: '🎲', desc: 'Roll the dice and bet on the total outcome.',        component: DiceRoll  },
    { id: 'crash',    name: 'CRASH',     icon: '📈', desc: 'Cash out before the multiplier crashes.',            component: Crash     },
    { id: 'carddraw', name: 'CARDS',     icon: '🂡', desc: 'Draw the card and beat the deck.',                   component: CardDraw  },
  ];

  const selectedGameData = games.find((g) => g.id === selectedGame);
  const GameComponent = selectedGameData?.component;

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
    if (!currentPlayer || isRolling) return;
    if (betAmount <= 0 || betAmount > currentPlayer.balance) return;

    setIsRolling(true);
    setSpinning(true);
    setOutcome(null);
    setReelSymbols([null, null, null]);

    // Kurangi saldo SEKETIKA saat tombol ditekan
    updateBalance(currentPlayer.balance - betAmount);

    try {
      const result = await spinGame(currentPlayer.id, betAmount);
      const symbols = computeReelSymbols(result.outcome, result.multiplier);

      // Animasi awal spin
      await new Promise((r) => setTimeout(r, 1800));

      setReelSymbols(symbols);
      setSpinning(false);

      // Tunggu semua reel berhenti
      await new Promise((r) => setTimeout(r, ALL_REELS_DONE_MS));

      // Tampilkan outcome
      setOutcome(result.outcome);
      setFlashType(result.outcome);
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 800);

      // Tambahkan payout jika menang
      if (result.outcome === 'win') {
        updateBalance(result.newBalance); // newBalance = balance - bet + payout
      }

      addResult(result);
      setLocalHistory((prev) => [result, ...prev].slice(0, 20));

      if (result.isBigWin) {
        setNotification({ type: 'bigwin', message: `💰 BIG WIN! +${result.payout.toFixed(0)} coins! (${result.multiplier}x)` });
      } else if (result.outcome === 'win') {
        setNotification({ type: 'win', message: `✅ WIN! +${result.payout.toFixed(0)} coins` });
      }

      fetchRTPProfile(currentPlayer.id).then(setRtpProfile).catch(() => {});
    } catch (err) {
      // Jika error: kembalikan saldo (rollback deduction)
      updateBalance(currentPlayer.balance);
      setSpinning(false);
      setNotification({ type: 'error', message: err.message });
    } finally {
      // Buka kunci tombol hanya setelah semua selesai
      setIsRolling(false);
    }
  };

  if (!currentPlayer) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass" style={{
          border: '1px solid rgba(234,179,8,0.2)', borderRadius: '20px',
          padding: '48px', textAlign: 'center', maxWidth: '400px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎰</div>
          <h2 className="font-orbitron" style={{ color: '#facc15', fontSize: '20px', marginBottom: '12px' }}>No Player Selected</h2>
          <p className="font-rajdhani" style={{ color: '#9ca3af', marginBottom: '24px' }}>Select a player from the Home page to start playing.</p>
          <Link to="/" className="glass-gold font-rajdhani font-bold" style={{
            border: '1px solid rgba(234,179,8,0.3)', padding: '10px 24px',
            borderRadius: '8px', color: '#facc15', textDecoration: 'none', fontSize: '14px',
          }}>← Go Home</Link>
        </div>
      </div>
    );
  }

  // Tombol disabled selama isRolling
  const canSpin = !isRolling && betAmount > 0 && betAmount <= currentPlayer.balance;

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>

      <Notification notification={notification} />

      {showFlash && (
        <div className={`fixed inset-0 pointer-events-none z-40 transition-opacity duration-300 ${flashType === 'win' ? 'outcome-win' : 'outcome-lose'}`} />
      )}

      {/* ── HERO ── */}
      <section style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center',
        padding: 'clamp(80px,10vw,120px) clamp(16px,4vw,48px) clamp(60px,8vw,100px)',
        minHeight: '100vh',
      }}>
        <h1 className="font-orbitron font-black text-white" style={{
          fontSize: 'clamp(40px,8vw,100px)', letterSpacing: '0.2em',
          lineHeight: 1, marginBottom: '16px',
        }}>CASINO</h1>

        <p style={{
          color: '#d1d5db', fontSize: 'clamp(14px,2vw,18px)',
          fontWeight: 300, maxWidth: '520px', margin: '0 auto 12px', lineHeight: 1.7,
        }}>
          Premium spin suite with adaptive RTP and real-time outcomes.
        </p>

        {/* Game selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 'clamp(10px, 1.5vw, 16px)',
          width: '100%',
          maxWidth: '75vw',
          marginTop: '28px',
          marginBottom: '16px',
        }}>
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game.id)}
              className="font-orbitron font-black"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                borderRadius: '16px',
                padding: 'clamp(16px, 2.5vw, 28px) clamp(12px, 2vw, 20px)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: 'clamp(11px, 1.4vw, 14px)',
                letterSpacing: '0.08em',
                ...(selectedGame === game.id
                  ? {
                      background: 'rgba(234,179,8,0.18)',
                      border: '1px solid rgba(234,179,8,0.5)',
                      color: '#fde047',
                    }
                  : {
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#9ca3af',
                    }),
              }}
              onMouseOver={(e) => {
                if (selectedGame !== game.id) {
                  e.currentTarget.style.borderColor = 'rgba(234,179,8,0.3)';
                  e.currentTarget.style.color = '#fde047';
                  e.currentTarget.style.background = 'rgba(234,179,8,0.08)';
                }
              }}
              onMouseOut={(e) => {
                if (selectedGame !== game.id) {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = '#9ca3af';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }
              }}
            >
              <span style={{ fontSize: 'clamp(24px, 3vw, 36px)' }}>{game.icon}</span>
              {game.name}
            </button>
          ))}
        </div>

        {/* Balance */}
        <div className="glass-gold" style={{
          display: 'inline-flex', alignItems: 'center', gap: '12px',
          border: '1px solid rgba(234,179,8,0.3)', borderRadius: '10px',
          padding: '14px 28px', marginTop: '32px', marginBottom: '40px',
        }}>
          <div>
            <div className="font-rajdhani" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.35em', color: '#9ca3af', marginBottom: '4px' }}>Balance</div>
            <div className="font-orbitron font-black text-glow-gold" style={{ fontSize: 'clamp(22px,3vw,32px)', color: '#fde047' }}>
              {currentPlayer.balance?.toLocaleString(undefined, { maximumFractionDigits: 0 })} 🪙
            </div>
          </div>
        </div>

        {selectedGame === 'slots' ? (
          <>
            {/* Outcome badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 600,
              marginBottom: '40px', transition: 'all 0.4s',
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
                : isRolling
                ? '⏳ Spinning...'
                : '🎰 Ready to Spin'}
            </div>

            {/* Slot reels */}
            <div style={{
              border: outcome === 'win'
                ? '2px solid rgba(34,197,94,0.6)'
                : outcome === 'lose'
                ? '2px solid rgba(239,68,68,0.3)'
                : isSpinning ? '2px solid rgba(234,179,8,0.6)' : '2px solid rgba(255,255,255,0.1)',
              borderRadius: '24px', padding: '16px', marginBottom: '40px',
              transition: 'border-color 0.3s',
            }} className={isSpinning ? 'glow-gold' : outcome === 'win' ? 'glow-green' : ''}>
              <SlotReels spinning={isSpinning} reelSymbols={reelSymbols} />
            </div>

            {/* Bet presets */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', marginBottom: '16px', maxWidth: '520px' }}>
              {BET_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setBetAmount(preset)}
                  disabled={isRolling}
                  className="font-rajdhani font-semibold"
                  style={{
                    padding: '10px 20px', borderRadius: '8px', fontSize: '14px',
                    cursor: isRolling ? 'not-allowed' : 'pointer',
                    opacity: isRolling ? 0.4 : 1, transition: 'all 0.2s',
                    ...(betAmount === preset
                      ? { background: 'rgba(234,179,8,0.2)', border: '1px solid rgba(234,179,8,0.4)', color: '#fde047' }
                      : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#d1d5db' }),
                  }}
                >{preset}</button>
              ))}
              <button
                onClick={() => setBetAmount(Math.floor(currentPlayer.balance / 2))}
                disabled={isRolling}
                className="font-rajdhani font-semibold"
                style={{
                  padding: '10px 20px', borderRadius: '8px', fontSize: '14px',
                  cursor: isRolling ? 'not-allowed' : 'pointer', opacity: isRolling ? 0.4 : 1,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#d1d5db', transition: 'all 0.2s',
                }}
              >½ MAX</button>
            </div>

            {/* Bet input */}
            <div style={{ width: '100%', maxWidth: '320px', marginBottom: '32px' }}>
              <input
                ref={betInputRef}
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
                disabled={isRolling}
                className="casino-input"
                style={{ textAlign: 'center', fontSize: '20px', width: '100%', opacity: isRolling ? 0.4 : 1 }}
                min={1}
                max={currentPlayer.balance}
              />
            </div>

            {/* Spin button */}
            <button
              onClick={handleSpin}
              disabled={!canSpin}
              className="spin-btn font-orbitron font-black glow-gold"
              style={{
                width: '176px', height: '176px', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: '#000', fontSize: '24px',
                background: 'linear-gradient(135deg, #f5c518, #b8960c)',
              }}
            >
              {isRolling ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div className="animate-rotate-slow" style={{ fontSize: '36px' }}>⚙️</div>
                  <span style={{ fontSize: '12px', letterSpacing: '0.2em' }}>WAIT</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '44px' }}>🎰</span>
                  <span style={{ fontSize: '12px', letterSpacing: '0.2em' }}>SPIN</span>
                </div>
              )}
            </button>
          </>
        ) : (
          <div className="glass" style={{
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px',
            padding: 'clamp(20px,3vw,32px)',
            marginTop: '32px',
            width: 'min(900px, 100%)',
          }}>
            <div className="font-rajdhani text-gray-400" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.35em', marginBottom: '8px' }}>
              Now Playing
            </div>
            <h2 className="font-orbitron font-black text-white" style={{ fontSize: 'clamp(22px,3vw,36px)', letterSpacing: '0.1em', marginBottom: '8px' }}>
              {selectedGameData?.icon} {selectedGameData?.name}
            </h2>
            <p className="font-rajdhani" style={{ color: '#9ca3af', fontSize: 'clamp(13px,1.5vw,15px)', marginBottom: '20px' }}>
              {selectedGameData?.desc}
            </p>
            <div style={{
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(0,0,0,0.2)',
              padding: '20px',
            }}>
              {GameComponent && <GameComponent />}
            </div>
          </div>
        )}
      </section>

      {/* ── STATS + HISTORY ── */}
      <section style={{ padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: '75%', margin: '0 auto' }}>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 'clamp(12px,2vw,20px)', marginBottom: 'clamp(20px,3vw,40px)',
          }}>
            {[
              { label: 'Win Rate',    value: `${((rtpProfile?.currentWinRate || 0.45) * 100).toFixed(1)}%`, color: '#fde047' },
              { label: 'Win Streak',  value: rtpProfile?.winningStreak ?? 0,                                 color: '#86efac' },
              { label: 'Lose Streak', value: rtpProfile?.losingStreak ?? 0,                                  color: '#fca5a5' },
              { label: 'Pity',        value: rtpProfile?.pityCounter ?? 0,                                   color: '#a855f7' },
            ].map((s) => (
              <div key={s.label} className="pill-card" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', textAlign: 'center', gap: '8px',
                padding: 'clamp(16px,2vw,24px)', minHeight: '120px',
              }}>
                <div className="font-orbitron font-black" style={{ fontSize: 'clamp(24px,3vw,32px)', color: s.color }}>{s.value}</div>
                <div className="font-rajdhani text-gray-400" style={{ fontSize: 'clamp(10px,1vw,13px)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="glass" style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: 'clamp(20px,3vw,32px)' }}>
            <div className="font-rajdhani text-gray-400" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.35em', marginBottom: '20px' }}>
              Recent Outcomes
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {localHistory.slice(0, 8).map((r, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)', padding: '12px 18px',
                }}>
                  <span className="font-rajdhani" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                    {r.outcome === 'win' ? 'Win' : 'Loss'}
                  </span>
                  <span className="font-rajdhani font-semibold" style={{
                    fontSize: '14px', color: r.outcome === 'win' ? '#86efac' : '#f87171',
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