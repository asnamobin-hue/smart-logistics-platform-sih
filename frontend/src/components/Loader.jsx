export default function Loader({ text = 'Loading...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px',
      gap: '12px',
      color: 'var(--color-text-muted)'
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        border: '3px solid var(--color-surface-light)',
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <span>{text}</span>
    </div>
  )
}