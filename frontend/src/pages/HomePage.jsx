import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { usePlayerStore, useLeaderboardStore, useSystemStore } from '../store';
import { fetchLeaderboard } from '../services/api';
import DiceModel from '../components/DiceModel';

export default function HomePage() {
  const { players, loadPlayers, currentPlayer } = usePlayerStore();
  const { setLeaderboard } = useLeaderboardStore();
  const { onlineCount } = useSystemStore();

  useEffect(() => {
    loadPlayers();
    fetchLeaderboard('profit').then((data) => {
      if (data?.leaderboard) setLeaderboard(data.leaderboard);
    }).catch(() => {});
  }, []);

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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(16px, 3vw, 32px)',
          flexWrap: 'wrap',
          marginBottom: '24px',
        }}>
          <div style={{
            width: 'clamp(180px, 22vw, 280px)',
            height: 'clamp(180px, 22vw, 280px)',
            position: 'relative'
          }}>
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: '-10%',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(245,197,24,0.45) 0%, rgba(245,197,24,0.0) 70%)',
                filter: 'blur(18px)',
                opacity: 0.7,
                pointerEvents: 'none'
              }}
            />
            <DiceModel height="100%" />
          </div>
          <h1 className="font-orbitron font-black text-white text-glow-gold" style={{
            fontSize: 'clamp(48px, 10vw, 120px)',
            letterSpacing: '0.2em',
            lineHeight: 1,
            margin: 0,
          }}>
            JOKRIS99
          </h1>
        </div>

        <p style={{
          color: '#d1d5db',
          fontSize: 'clamp(14px, 2vw, 18px)',
          fontWeight: 300,
          maxWidth: '520px',
          margin: '0 auto 40px',
          lineHeight: 1.7,
        }}>
          Premium virtual casino experience with immersive gameplay, adaptive RTP, and realtime leaderboards.
        </p>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}>
          <Link
            to="/casino"
            className="font-orbitron font-black"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              borderRadius: '6px',
              background: 'linear-gradient(to right, #eab308, #f97316)',
              padding: 'clamp(12px, 1.5vw, 16px) clamp(24px, 4vw, 40px)',
              fontSize: 'clamp(12px, 1.5vw, 16px)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#000',
              textDecoration: 'none',
              boxShadow: '0 20px 80px rgba(245,197,24,0.25)',
              transition: 'transform 0.25s',
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            PLAY NOW
          </Link>
          <Link
            to="/leaderboard"
            className="font-rajdhani font-semibold"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              border: '1px solid rgba(234,179,8,0.2)',
              background: 'rgba(255,255,255,0.05)',
              padding: 'clamp(12px, 1.5vw, 16px) clamp(24px, 4vw, 40px)',
              fontSize: 'clamp(12px, 1.5vw, 16px)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#fde047',
              textDecoration: 'none',
              transition: 'transform 0.25s',
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            LEADERBOARD
          </Link>
        </div>

      </section>

      {/* ── STATS ── */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        padding: 'clamp(40px, 6vw, 80px) clamp(16px, 4vw, 48px)'
      }}>
        <video
          autoPlay
          muted
          loop
          playsInline
          src="/fallingdice-low.mp4"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.35,
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
          }}
        />
        <div style={{ maxWidth: '75%', margin: '0 auto', position: 'relative', zIndex: 1 }}>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 'clamp(12px, 2vw, 20px)',
            marginBottom: 'clamp(20px, 3vw, 40px)',
          }}>
            {[
              { label: 'Total Players', value: players.length},
              { label: 'Online Now',    value: onlineCount},
            ].map((item) => (
              <div key={item.label} className="pill-card" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '8px',
                padding: 'clamp(16px, 2vw, 24px)',
                minHeight: '120px',
              }}>            
                <div className="font-orbitron font-black text-white" style={{ fontSize: 'clamp(28px, 2vw, 32px)' }}>{item.value}</div>
                <div className="font-rajdhani text-gray-400" style={{ fontSize: 'clamp(15px, 1vw, 18px)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>{item.label}</div>
              </div>
            ))}
          </div>

          {/* ── GAMES ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 'clamp(12px, 2vw, 20px)',
          }}>
            {[
              { title: 'SLOTS',     detail: 'Classic slot machine' },
              { title: 'ROULETTE', detail: 'Spin the wheel'        },
              { title: 'COIN FLIP',detail: 'Heads or tails'        },
              { title: 'DICE',     detail: 'Roll and win'          },
              { title: 'CARDS',    detail: 'Draw and win'          },
            ].map((game) => (
              <Link
                key={game.title}
                to="/casino"
                className="glass"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '24px',
                  padding: 'clamp(16px, 2.5vw, 28px) clamp(12px, 2vw, 20px)',
                  textDecoration: 'none',
                  transition: 'border-color 0.3s',
                }}
              >
                <div className="font-orbitron font-black text-white" style={{ fontSize: 'clamp(13px, 1.8vw, 22px)', letterSpacing: '0.08em' }}>
                  {game.title}
                </div>
                <div className="font-rajdhani text-gray-400" style={{ fontSize: 'clamp(11px, 1.2vw, 14px)' }}>
                  {game.detail}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FLOOR PREVIEW ── */}
      <section style={{ padding: 'clamp(40px, 6vw, 80px) clamp(16px, 4vw, 48px)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'clamp(16px, 2.5vw, 28px)',
            alignItems: 'start',
          }}>

            {/* Left — CTA */}
            <div className="glass" style={{
              border: '1px solid rgba(234,179,8,0.2)',
              borderRadius: '28px',
              padding: 'clamp(24px, 3vw, 40px)',
            }}>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div className="font-rajdhani font-semibold" style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.35em',
                  color: '#fde047',
                  marginBottom: '8px',
                }}>
                  Ready to Spin
                </div>
                <h2 className="font-orbitron font-black text-white" style={{
                  fontSize: 'clamp(20px, 3vw, 36px)',
                  marginBottom: '10px',
                }}>
                  Casino floor preview
                </h2>
                <p className="font-rajdhani text-gray-400" style={{ fontSize: 'clamp(13px, 1.5vw, 15px)', lineHeight: 1.6 }}>
                  Explore a larger, centered spin interface built for premium casino flow and cinematic momentum.
                </p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }}>
                <div className="glass" style={{ flex: '1 1 120px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '20px' }}>
                  <div className="font-rajdhani text-gray-400" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.35em', marginBottom: '8px' }}>Current balance</div>
                  <div className="flex justify-center font-orbitron font-black text-yellow-300" style={{ fontSize: 'clamp(18px, 2.5vw, 28px)' }}>
                    {currentPlayer?.balance?.toLocaleString() ?? '—'} 
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center glass" style={{ flex: '1 1 120px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '20px' }}>
                  <div className=" font-rajdhani text-gray-400" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.35em', marginBottom: '8px' }}>Hot streak</div>
                  <div className="font-orbitron font-black text-cyan-300" style={{ fontSize: 'clamp(18px, 2.5vw, 28px)' }}>
                    {Math.max(1, Math.floor(players.length / 3))}×
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                <Link
                  to="/casino"
                  className="font-orbitron font-black"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '999px',
                    background: 'linear-gradient(to right, #eab308, #f97316)',
                    padding: '14px 32px',
                    fontSize: 'clamp(11px, 1.3vw, 14px)',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: '#000',
                    textDecoration: 'none',
                    boxShadow: '0 25px 80px rgba(245,197,24,0.18)',
                  }}
                >
                  START GAMING
                </Link>
                <p className="font-rajdhani text-gray-400" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.25em' }}>
                  Secure • Fair • Transparent
                </p>
              </div>
            </div>

            {/* Right — session stats */}
            <div className="glass" style={{
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '28px',
              padding: 'clamp(24px, 3vw, 40px)',
            }}>
              <div className="font-rajdhani text-gray-400" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.35em', marginBottom: '16px' }}>
                Session stats
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Win rate',    value: '57.4%', color: '#fde047' },
                  { label: 'RTP',         value: '57%',   color: '#67e8f9' },
                  { label: 'Win streak',  value: '3',     color: '#86efac' },
                  { label: 'Lose streak', value: '1',     color: '#fca5a5' },
                ].map((s) => (
                  <div key={s.label} className="pill-card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div className="font-rajdhani text-gray-400" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: '4px' }}>
                      {s.label}
                    </div>
                    <div className="font-orbitron font-black" style={{ fontSize: 'clamp(16px, 2.2vw, 24px)', color: s.color }}>
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', padding: '16px' }}>
                <div className="font-rajdhani text-gray-400" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.35em', marginBottom: '12px' }}>
                  Recent outcomes
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { result: 'Win',  value: '+250.00', color: '#86efac' },
                    { result: 'Lose', value: '-100.00', color: '#f87171' },
                    { result: 'Win',  value: '+180.00', color: '#86efac' },
                    { result: 'Win',  value: '+300.00', color: '#86efac' },
                    { result: 'Lose', value: '-100.00', color: '#f87171' },
                  ].map((o, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="font-rajdhani" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>{o.result}</span>
                      <span className="font-rajdhani font-semibold" style={{ fontSize: '14px', color: o.color }}>{o.value}</span>
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