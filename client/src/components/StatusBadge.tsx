const PALETTE: Record<string, { bg: string; color: string }> = {
  Draft:      { bg: '#1c2d48', color: '#58a6ff' },
  Active:     { bg: '#12261e', color: '#3fb950' },
  Deprecated: { bg: '#2d1a00', color: '#d29922' },
  Archived:   { bg: '#1c1c1c', color: '#6e7681' },
  InReview:   { bg: '#271d4a', color: '#bc8cff' },
  Reusable:   { bg: '#0e2a2a', color: '#2dd4bf' },
  Pending:    { bg: '#1c2d48', color: '#58a6ff' },
  Approved:   { bg: '#12261e', color: '#3fb950' },
  Rejected:   { bg: '#2d1010', color: '#f85149' },
};

export default function StatusBadge({ status }: { status: string }) {
  const s = PALETTE[status] ?? { bg: '#21262d', color: '#8b949e' };
  return (
    <span
      style={{
        display: 'inline-block',
        background: s.bg,
        color: s.color,
        padding: '1px 8px',
        borderRadius: 4,
        fontSize: '0.72rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
}
