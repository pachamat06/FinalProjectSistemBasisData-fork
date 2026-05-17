/**
 * GamblingWarning — Himbauan pencegahan judi sesuai hukum Indonesia
 * Digunakan di LoginPage dan HomePage
 *
 * Props:
 *   compact  boolean  — tampilan ringkas (default false)
 */
export default function GamblingWarning({ compact = false }) {
  const laws = [
    {
      icon:  '⚖️',
      label: 'KUHP Pasal 303',
      desc:  'Perjudian diancam pidana penjara paling lama 10 tahun atau denda paling banyak Rp 25 juta.',
    },
    {
      icon:  '⚖️',
      label: 'KUHP Pasal 303 bis',
      desc:  'Pemain judi diancam pidana penjara paling lama 4 tahun atau denda paling banyak Rp 10 juta.',
    },
    {
      icon:  '💻',
      label: 'UU ITE No. 11/2008 Ps. 27(2)',
      desc:  'Judi online diancam pidana penjara paling lama 6 tahun dan/atau denda Rp 1 miliar.',
    },
    {
      icon:  '📄',
      label: 'PP No. 9 Tahun 1981',
      desc:  'Pemerintah mencabut semua izin penyelenggaraan perjudian di seluruh wilayah Indonesia.',
    },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '680px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Peringatan utama ── */}
      <div style={{
        background:   '#2a0a0a',
        border:       '1.5px solid #E24B4A',
        borderRadius: '12px',
        padding:      '1.25rem 1.5rem',
        marginBottom: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            background:   '#E24B4A',
            borderRadius: '50%',
            width:        '34px', height: '34px',
            display:      'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink:   0, fontSize: '16px',
          }}>
            ⚠️
          </div>
          <span className="font-rajdhani" style={{ fontSize: '15px', fontWeight: 700, color: '#fca5a5', letterSpacing: '0.05em' }}>
            PERINGATAN KERAS — JUDI ILEGAL DI INDONESIA
          </span>
        </div>
        <p className="font-rajdhani" style={{ fontSize: '14px', color: '#fca5a5', lineHeight: 1.75, margin: '0 0 8px' }}>
          Segala bentuk perjudian, termasuk judi daring (online), adalah{' '}
          <strong style={{ color: '#f87171' }}>tindak pidana</strong> yang dilarang keras oleh hukum
          Negara Kesatuan Republik Indonesia.
        </p>
        <p className="font-rajdhani" style={{ fontSize: '14px', color: '#fca5a5', lineHeight: 1.75, margin: 0 }}>
          Pelaku dapat diancam{' '}
          <strong style={{ color: '#f87171' }}>hukuman penjara hingga 10 tahun</strong> dan/atau{' '}
          <strong style={{ color: '#f87171' }}>denda hingga Rp 25.000.000.000</strong>.
        </p>
      </div>

      {/* ── Grid pasal ── (sembunyikan jika compact) */}
      {!compact && (
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap:                 '8px',
          marginBottom:        '10px',
        }}>
          {laws.map((law) => (
            <div key={law.label} style={{
              background:   'rgba(255,255,255,0.03)',
              border:       '1px solid rgba(239,68,68,0.2)',
              borderRadius: '8px',
              padding:      '12px 14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '16px' }}>{law.icon}</span>
                <span className="font-rajdhani" style={{ fontSize: '12px', fontWeight: 700, color: '#f87171' }}>
                  {law.label}
                </span>
              </div>
              <p className="font-rajdhani" style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.6, margin: 0 }}>
                {law.desc}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Dampak sosial ── */}
      <div style={{
        background:   'rgba(180,117,23,0.12)',
        border:       '0.5px solid #EF9F27',
        borderLeft:   '3px solid #BA7517',
        borderRadius: '8px',
        padding:      '12px 14px',
        marginBottom: '10px',
        display:      'flex',
        alignItems:   'flex-start',
        gap:          '10px',
      }}>
        <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>❤️</span>
        <div>
          <p className="font-rajdhani" style={{ fontSize: '13px', fontWeight: 700, color: '#fcd34d', margin: '0 0 4px' }}>
            Judi merusak kehidupan Anda dan keluarga
          </p>
          <p className="font-rajdhani" style={{ fontSize: '12px', color: '#d97706', lineHeight: 1.65, margin: 0 }}>
            Kecanduan judi menyebabkan kehilangan harta benda, keretakan keluarga, gangguan kesehatan
            mental, hingga jeratan hutang. Segera tinggalkan dan cari bantuan profesional.
          </p>
        </div>
      </div>

      {/* ── Hotline ── */}
      <div style={{
        background:   'rgba(255,255,255,0.04)',
        border:       '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        padding:      '12px 16px',
        display:      'flex',
        alignItems:   'center',
        gap:          '12px',
      }}>
        <span style={{ fontSize: '22px', flexShrink: 0 }}>📞</span>
        <div>
          <p className="font-rajdhani" style={{ fontSize: '13px', fontWeight: 600, color: '#d1d5db', margin: '0 0 2px' }}>
            Butuh bantuan? Hubungi layanan kesehatan jiwa nasional
          </p>
          <span className="font-orbitron" style={{ fontSize: '14px', fontWeight: 900, color: '#fde047' }}>
            119 ext. 8
          </span>
        </div>
      </div>

      {/* ── Footer note ── */}
      <p className="font-rajdhani" style={{
        fontSize:   '11px',
        color:      '#6b7280',
        textAlign:  'center',
        margin:     '10px 0 0',
        lineHeight: 1.5,
      }}>
        Dilarang berjudi. Sesuai KUHP Pasal 303 &amp; 303 bis, UU ITE No. 11 Tahun 2008 Pasal 27 ayat (2),
        dan PP No. 9 Tahun 1981.
      </p>
    </div>
  );
}