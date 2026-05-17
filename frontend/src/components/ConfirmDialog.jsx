export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Ya, Lanjutkan',
  danger = false, onConfirm, onCancel, loading = false,
}) {
  if (!open) return null;

  const confirmColor  = danger ? '#f87171' : '#fde047';
  const confirmBorder = danger ? 'rgba(239,68,68,0.6)' : 'rgba(234,179,8,0.6)';
  const confirmBg     = danger ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)';

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass animate-scale-in"
        style={{
          border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: '20px', padding: '32px', maxWidth: '400px', width: '100%',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>
          {danger ? '⚠️' : '❓'}
        </div>

        <h3 className="font-orbitron font-bold" style={{ color: '#f0f0f0', fontSize: '18px', marginBottom: '12px', letterSpacing: '0.05em' }}>
          {title}
        </h3>

        <p className="font-rajdhani" style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.6, marginBottom: '28px' }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            className="font-rajdhani font-bold"
            style={{
              flex: 1, padding: '12px', borderRadius: '10px', fontSize: '14px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#9ca3af', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
            }}
            onMouseOver={e => { if (!loading) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            Batal
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="font-orbitron font-bold"
            style={{
              flex: 1, padding: '12px', borderRadius: '10px', fontSize: '13px',
              letterSpacing: '0.05em', background: confirmBg,
              border: `1px solid ${confirmBorder}`, color: confirmColor,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
            onMouseOver={e => { if (!loading) e.currentTarget.style.filter = 'brightness(1.2)'; }}
            onMouseOut={e => e.currentTarget.style.filter = 'none'}
          >
            {loading ? '⏳ Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}