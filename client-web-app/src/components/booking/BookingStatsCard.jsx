const BookingStatsCard = ({ title, count, icon, accentColor = '#F57923' }) => {
  return (
    <div
      style={{
        flex: 1,
        minWidth: '160px',
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0px 4px 24px rgba(17, 7, 85, 0.07)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}
      >
        <span
          style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#6B7280',
            fontFamily: 'Inter, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {title}
        </span>
        <span style={{ fontSize: '1.4rem' }}>{icon}</span>
      </div>

      <div
        style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          fontFamily: 'Manrope, sans-serif',
          color: '#110755',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {count}
      </div>

      <div
        style={{
          height: '3px',
          width: '36px',
          borderRadius: '999px',
          background: accentColor,
          marginTop: '8px',
        }}
      />
    </div>
  );
};

export default BookingStatsCard;
