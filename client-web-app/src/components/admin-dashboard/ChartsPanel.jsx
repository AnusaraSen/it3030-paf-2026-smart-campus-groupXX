import React from 'react';

function buildConicGradient(roleDistribution) {
  const total = roleDistribution.reduce((sum, item) => sum + item.count, 0);

  if (!total) {
    return 'conic-gradient(#e5e7eb 0deg 360deg)';
  }

  let currentAngle = 0;
  const slices = roleDistribution
    .filter((item) => item.count > 0)
    .map((item) => {
      const sliceAngle = (item.count / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;
      return `${item.color} ${startAngle}deg ${endAngle}deg`;
    });

  return `conic-gradient(${slices.join(', ')})`;
}

export default function ChartsPanel({ monthlyUserGrowthSeries = [], dailyUserGrowthSeries = [], roleDistribution = [], dataError = '' }) {
  const [timeframe, setTimeframe] = React.useState('6m');
  const activeSeries = timeframe === '30d' ? dailyUserGrowthSeries : monthlyUserGrowthSeries;
  const maxGrowthValue = Math.max(...activeSeries.map((entry) => entry.value), 1);
  const activePeak = React.useMemo(
    () => activeSeries.reduce((peak, entry) => (entry.value > peak.value ? entry : peak), activeSeries[0] || { key: '', label: '', value: 0 }),
    [activeSeries],
  );
  const rolePieBackground = React.useMemo(() => buildConicGradient(roleDistribution), [roleDistribution]);
  const roleTotal = React.useMemo(
    () => roleDistribution.reduce((sum, item) => sum + item.count, 0),
    [roleDistribution],
  );

  return (
    <section className="grid grid-cols-1 gap-6">
      <div className="glass-panel rounded-3xl border border-white/50 p-8 shadow-sm">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h4 className="font-headline text-xl font-bold text-[#272269]">User Growth</h4>
            <p className="text-xs font-medium text-[#272269]/50">
              {timeframe === '30d' ? 'New user registrations across the last 30 days' : 'New user registrations across the last 6 months'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${timeframe === '6m' ? 'border border-[#272269]/10 bg-[#272269]/5 text-[#272269]' : 'text-[#272269]/50 hover:bg-[#272269]/5'}`}
              type="button"
              onClick={() => setTimeframe('6m')}
            >
              6 Months
            </button>
            <button
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${timeframe === '30d' ? 'border border-[#272269]/10 bg-[#272269]/5 text-[#272269]' : 'text-[#272269]/50 hover:bg-[#272269]/5'}`}
              type="button"
              onClick={() => setTimeframe('30d')}
            >
              30 Days
            </button>
          </div>
        </div>

        <div
          className="grid h-64 items-end gap-4 px-4"
          style={{ gridTemplateColumns: `repeat(${Math.max(activeSeries.length, 1)}, minmax(0, 1fr))` }}
        >
          {dataError ? (
            <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-[#272269]/10 bg-white/40 px-6 text-center text-sm text-[#272269]/60 md:col-span-full">
              {dataError}
            </div>
          ) : activeSeries.map((bar, index) => {
            const barHeight = Math.max(24, Math.round((bar.value / maxGrowthValue) * 208));
            const isPeak = activePeak ? activePeak.key === bar.key && activePeak.value === bar.value : false;

            return (
              <div key={bar.key || bar.label} className="group relative flex w-full flex-col items-center justify-end">
                <div
                  className={`relative w-full rounded-t-lg ${index === activeSeries.length - 1 ? 'bg-gradient-to-t from-[#F17620] to-[#fe802a]' : 'bg-[#F17620]/15'} transition-all duration-300 hover:opacity-90`}
                  style={{ height: `${barHeight}px` }}
                >
                  {isPeak ? (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 rounded bg-[#272269] px-2 py-1 text-[10px] font-bold text-white shadow-xl opacity-0 transition-opacity group-hover:opacity-100">
                      Peak: {bar.value} users
                    </div>
                  ) : null}
                </div>
                <span className="mt-3 text-[10px] font-bold uppercase tracking-widest text-[#272269]/30">{bar.label}</span>
                <span className="mt-1 text-[10px] font-bold text-[#272269]/50">{bar.value}</span>
              </div>
            );
          })}
          {!dataError && activeSeries.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-[#272269]/10 bg-white/40 text-sm text-[#272269]/50">
              No user growth data available yet.
            </div>
          ) : null}
        </div>

        <div className="mt-8 rounded-3xl border border-white/60 bg-white/60 p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h4 className="font-headline text-lg font-bold text-[#272269]">Role Distribution</h4>
              <p className="text-xs font-medium text-[#272269]/50">User account breakdown by role</p>
            </div>
            <span className="rounded-full border border-[#272269]/10 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#272269]/50">
              {roleTotal.toLocaleString('en-US')} total
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr] md:items-center">
            <div className="flex justify-center">
              <div className="relative flex h-52 w-52 items-center justify-center rounded-full shadow-inner" style={{ background: rolePieBackground }}>
                <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border border-white/80 bg-white/95 text-center shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#272269]/40">Users</span>
                  <span className="mt-1 font-headline text-3xl font-black text-[#272269]">{roleTotal.toLocaleString('en-US')}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {roleDistribution.map((item) => (
                <div key={item.key} className="rounded-2xl border border-[#272269]/5 bg-white/80 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-semibold text-[#272269]">{item.label}</span>
                    </div>
                    <span className="text-sm font-bold text-[#272269]">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}