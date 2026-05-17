import { useState, useEffect } from 'react';
import GamblingWarning from './GamblingWarning';

/**
 * GamblingWarningModal
 *
 * Props:
 *   storageKey  string  — sessionStorage key untuk ingat apakah sudah ditutup
 *                         Default: 'gambling_warning_dismissed'
 *                         Beri nilai berbeda per halaman jika ingin popup
 *                         muncul di setiap halaman secara independen.
 *   alwaysShow  boolean — jika true, selalu tampil (abaikan sessionStorage)
 *                         Gunakan di LoginPage agar selalu muncul setiap kunjungan.
 */
export default function GamblingWarningModal({
  storageKey  = 'gambling_warning_dismissed',
  alwaysShow  = false,
}) {
  const [open,     setOpen]     = useState(false);
  const [checked,  setChecked]  = useState(false);
  const [counting, setCounting] = useState(5);   // countdown sebelum tombol aktif

  useEffect(() => {
    // Cek apakah sudah pernah ditutup di sesi ini
    const dismissed = !alwaysShow && sessionStorage.getItem(storageKey) === '1';
    if (!dismissed) {
      setOpen(true);
      setCounting(5);
      setChecked(false);
    }
  }, [storageKey, alwaysShow]);

  // Countdown 5 detik — tombol baru aktif setelah countdown habis
  useEffect(() => {
    if (!open) return;
    if (counting <= 0) return;
    const t = setTimeout(() => setCounting((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [open, counting]);

  const handleClose = () => {
    if (!canClose) return;
    sessionStorage.setItem(storageKey, '1');
    setOpen(false);
  };

  const canClose = counting <= 0 && checked;

  if (!open) return null;

  return (
    /* Overlay — pointer-events: all agar halaman di belakang tidak bisa diklik */
    <div
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         9000,
        background:     'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(10px)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        'clamp(16px, 4vw, 32px)',
        overflowY:      'auto',
      }}
    >
      <div
        className="animate-scale-in"
        style={{
          width:        '100%',
          maxWidth:     '700px',
          background:   'rgba(10,12,18,0.97)',
          border:       '1px solid rgba(239,68,68,0.4)',
          borderRadius: '20px',
          padding:      'clamp(24px, 4vw, 40px)',
          boxShadow:    '0 40px 120px rgba(239,68,68,0.2)',
          position:     'relative',
          margin:       'auto',
        }}
      >
        {/* Header modal */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🚨</div>
          <h2
            className="font-orbitron font-black"
            style={{ fontSize: 'clamp(16px, 2.5vw, 22px)', color: '#f87171', letterSpacing: '0.1em', marginBottom: '6px' }}
          >
            BACA SEBELUM MELANJUTKAN
          </h2>
          <p
            className="font-rajdhani"
            style={{ fontSize: '13px', color: '#6b7280' }}
          >
            Harap baca seluruh informasi berikut sebelum menggunakan layanan ini.
          </p>
        </div>

        {/* Konten himbauan */}
        <div style={{
          maxHeight:  'clamp(280px, 50vh, 480px)',
          overflowY:  'auto',
          paddingRight: '4px',
          marginBottom: '24px',
          /* Scrollbar styling */
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(239,68,68,0.4) transparent',
        }}>
          <GamblingWarning />
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(239,68,68,0.2)', marginBottom: '20px' }} />

        {/* Checkbox konfirmasi */}
        <label
          style={{
            display:    'flex',
            alignItems: 'flex-start',
            gap:        '12px',
            cursor:     'pointer',
            marginBottom: '20px',
          }}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            style={{
              width:     '18px',
              height:    '18px',
              flexShrink: 0,
              marginTop: '2px',
              accentColor: '#f87171',
              cursor:    'pointer',
            }}
          />
          <span
            className="font-rajdhani"
            style={{ fontSize: '14px', color: '#d1d5db', lineHeight: 1.6 }}
          >
            Saya telah membaca, memahami, dan menyadari bahwa{' '}
            <strong style={{ color: '#fca5a5' }}>perjudian adalah tindak pidana di Indonesia</strong>.
            Website ini hanya merupakan{' '}
            <strong style={{ color: '#fca5a5' }}>simulasi akademis</strong> yang tidak melibatkan
            uang nyata.
          </span>
        </label>

        {/* Tombol tutup */}
        <button
          onClick={handleClose}
          disabled={!canClose}
          className="font-orbitron font-black"
          style={{
            width:        '100%',
            padding:      '14px',
            borderRadius: '12px',
            fontSize:     '14px',
            letterSpacing:'0.1em',
            border:       'none',
            cursor:       canClose ? 'pointer' : 'not-allowed',
            transition:   'all 0.3s',
            background:   canClose
              ? 'linear-gradient(135deg, #dc2626, #991b1b)'
              : 'rgba(239,68,68,0.15)',
            color:        canClose ? '#fff' : 'rgba(239,68,68,0.4)',
            boxShadow:    canClose ? '0 8px 32px rgba(220,38,38,0.4)' : 'none',
          }}
        >
          {counting > 0
            ? `Mohon baca terlebih dahulu... (${counting})`
            : !checked
            ? '☑ Centang pernyataan di atas untuk melanjutkan'
            : '✓ Saya Mengerti — Lanjutkan'}
        </button>

        {/* Note simulasi */}
        <p
          className="font-rajdhani"
          style={{
            fontSize:  '11px',
            color:     '#4b5563',
            textAlign: 'center',
            marginTop: '12px',
            lineHeight: 1.5,
          }}
        >
          ⚠️ Simulasi akademis · Tidak ada uang nyata · Hanya untuk keperluan pembelajaran
        </p>
      </div>
    </div>
  );
}