export default function LegalFooter() {
  return (
    <div style={{ textAlign: 'center', padding: '24px 20px 32px', marginTop: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 8 }}>
        <a
          href="https://www.speakupgrade.com/privacy-policy/"
          target="_blank"
          rel="noreferrer"
          style={{ color: '#52525B', fontSize: 12, textDecoration: 'none' }}
        >
          Privacy Policy
        </a>
        <a
          href="https://www.speakupgrade.com/terms-of-use/"
          target="_blank"
          rel="noreferrer"
          style={{ color: '#52525B', fontSize: 12, textDecoration: 'none' }}
        >
          Terms of Service
        </a>
        <a
          href="mailto:contact@speakupgrade.com"
          style={{ color: '#52525B', fontSize: 12, textDecoration: 'none' }}
        >
          Contact
        </a>
        <a
          href="https://billing.stripe.com/p/login/bpc_1TRb2CJovqs3TTQbKYOPrhPa"
          target="_blank"
          rel="noreferrer"
          style={{ color: '#52525B', fontSize: 12, textDecoration: 'none' }}
        >
          Manage Subscription
        </a>
      </div>
      <p style={{ color: '#374151', fontSize: 11 }}>© 2026 SpeakUPgrade</p>
    </div>
  )
}
