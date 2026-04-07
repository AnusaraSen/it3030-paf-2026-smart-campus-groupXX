const STATUS_CONFIG = {
  PENDING:   { bg: '#FEF3C7', color: '#92400E' },
  APPROVED:  { bg: '#D1FAE5', color: '#065F46' },
  REJECTED:  { bg: '#FEE2E2', color: '#991B1B' },
  CANCELLED: { bg: '#F3F4F6', color: '#374151' },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.CANCELLED;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '999px',
        fontSize: '0.72rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        fontFamily: 'Inter, sans-serif',
        backgroundColor: config.bg,
        color: config.color,
      }}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
