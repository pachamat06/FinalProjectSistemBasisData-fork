import { useState } from 'react';
import { usePlayerStore } from '../store';
import SlotReels from '../components/SlotReels';
import Roulette from '../components/Roulette';
import CoinFlip from '../components/CoinFlip';
import DiceRoll from '../components/DiceRoll';
import Crash from '../components/Crash';
import CardDraw from '../components/CardDraw';
import { Link } from 'react-router-dom';

export default function GamesPage() {
  const { currentPlayer, updateBalance } = usePlayerStore();
  const [selectedGame, setSelectedGame] = useState('slots');

  const games = [
    { id: 'slots',    name: 'SLOTS',     icon: '🎰', desc: 'Classic spins, big wins and cinematic reels.',        component: SlotReels },
    { id: 'roulette', name: 'ROULETTE',  icon: '🎡', desc: 'Place your bet and chase the red or black wheel.',   component: Roulette  },
    { id: 'coinflip', name: 'COIN FLIP', icon: '🪙', desc: 'Heads or tails, fast-paced currency gamble.',        component: CoinFlip  },
    { id: 'dice',     name: 'DICE',      icon: '🎲', desc: 'Roll the dice and bet on the total outcome.',        component: DiceRoll  },
    { id: 'crash',    name: 'CRASH',     icon: '📈', desc: 'Cash out before the multiplier crashes.',            component: Crash     },
    { id: 'carddraw', name: 'CARDS',     icon: '🂡', desc: 'Draw the card and beat the deck.',                   component: CardDraw  },
  ];

  const selectedGameData = games.find(g => g.id === selectedGame);
  const GameComponent = selectedGameData?.component;

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
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎮</div>
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
          Our Games
        </p>

        <h1 className="font-orbitron font-black text-white" style={{
          fontSize: 'clamp(40px, 8vw, 100px)',
          letterSpacing: '0.2em',
          lineHeight: 1,
          marginBottom: '16px',
        }}>
          GAMES
        </h1>

        <p style={{
          color: '#d1d5db',
          fontSize: 'clamp(14px, 2vw, 18px)',
          fontWeight: 300,
          maxWidth: '520px',
          margin: '0 auto 48px',
          lineHeight: 1.7,
        }}>
          Select from high-energy casino games built for premium flow and big wins.
        </p>

        {/* Game selector grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 'clamp(10px, 1.5vw, 16px)',
          width: '100%',
          maxWidth: '75vw',
          marginBottom: '56px',
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
              onMouseOver={e => {
                if (selectedGame !== game.id) {
                  e.currentTarget.style.borderColor = 'rgba(234,179,8,0.3)';
                  e.currentTarget.style.color = '#fde047';
                  e.currentTarget.style.background = 'rgba(234,179,8,0.08)';
                }
              }}
              onMouseOut={e => {
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
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          border: '1px solid rgba(234,179,8,0.3)',
          borderRadius: '10px',
          padding: '14px 28px',
        }}>
          <div>
            <div className="font-rajdhani" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.35em', color: '#9ca3af', marginBottom: '4px' }}>Balance</div>
            <div className="font-orbitron font-black text-glow-gold" style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', color: '#fde047' }}>
              {currentPlayer.balance?.toLocaleString(undefined, { maximumFractionDigits: 0 })} 🪙
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED GAME ── */}
      <section style={{ padding: 'clamp(40px, 6vw, 80px) clamp(16px, 4vw, 48px)' }}>
        <div style={{ maxWidth: '75%', margin: '0 auto' }}>

          <div style={{ marginBottom: 'clamp(20px, 3vw, 36px)' }}>
            <p className="font-rajdhani" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.35em', color: 'rgba(234,179,8,0.7)', marginBottom: '8px' }}>
              Now Playing
            </p>
            <h2 className="font-orbitron font-black text-white" style={{ fontSize: 'clamp(22px, 3vw, 36px)', letterSpacing: '0.1em' }}>
              {selectedGameData?.icon} {selectedGameData?.name}
            </h2>
            <p className="font-rajdhani" style={{ color: '#9ca3af', fontSize: 'clamp(13px, 1.5vw, 15px)', marginTop: '8px' }}>
              {selectedGameData?.desc}
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'clamp(16px, 2.5vw, 28px)',
            alignItems: 'start',
          }}>

            {/* Game component */}
            <div className="glass" style={{
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '24px',
              padding: 'clamp(20px, 3vw, 32px)',
            }}>
              <div className="font-rajdhani text-gray-400" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.35em', marginBottom: '20px' }}>
                Live Preview
              </div>
              <div style={{
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(0,0,0,0.2)',
                padding: '20px',
              }}>
                {GameComponent && (
                  <GameComponent onBet={(betResult) => { console.log('Bet result:', betResult); }} />
                )}
              </div>
            </div>

            {/* Quick status */}
            <div className="glass" style={{
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '24px',
              padding: 'clamp(20px, 3vw, 32px)',
            }}>
              <div className="font-rajdhani text-gray-400" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.35em', marginBottom: '20px' }}>
                Quick Status
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Selected Game', value: selectedGameData?.name, color: '#fde047' },
                  { label: 'Balance',       value: `${currentPlayer?.balance?.toFixed(0)} 🪙`, color: '#67e8f9' },
                ].map((s) => (
                  <div key={s.label} className="pill-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="font-rajdhani" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.25em', color: '#6b7280' }}>
                      {s.label}
                    </span>
                    <span className="font-orbitron font-black" style={{ fontSize: 'clamp(14px, 1.8vw, 18px)', color: s.color }}>
                      {s.value}
                    </span>
                  </div>
                ))}

                <div style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  padding: '16px 20px',
                  marginTop: '4px',
                }}>
                  <p className="font-rajdhani" style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.6 }}>
                    Tap any game card above to switch instantly.
                  </p>
                </div>

                {/* All games list */}
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {games.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGame(g.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: 'none',
                        textAlign: 'left',
                        ...(selectedGame === g.id
                          ? { background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)' }
                          : { background: 'transparent', border: '1px solid transparent' }),
                      }}
                      onMouseOver={e => { if (selectedGame !== g.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                      onMouseOut={e => { if (selectedGame !== g.id) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ fontSize: '18px' }}>{g.icon}</span>
                      <span className="font-rajdhani font-semibold" style={{
                        fontSize: '13px',
                        letterSpacing: '0.05em',
                        color: selectedGame === g.id ? '#fde047' : '#9ca3af',
                      }}>
                        {g.name}
                      </span>
                    </button>
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