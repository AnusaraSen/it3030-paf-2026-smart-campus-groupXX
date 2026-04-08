import React from 'react';

const distributionItems = [
  { label: 'Science & Tech', value: '42%', width: 'w-[42%]', barClassName: 'bg-[#272269]/60' },
  { label: 'Business School', value: '28%', width: 'w-[28%]', barClassName: 'bg-[#F17620]' },
  { label: 'Humanities', value: '15%', width: 'w-[15%]', barClassName: 'bg-[#272269]/20' },
  { label: 'Architecture', value: '15%', width: 'w-[15%]', barClassName: 'bg-[#272269]/10' },
];

export default function ChartsPanel({ monthlyUserGrowthSeries = [], dailyUserGrowthSeries = [], dataError = '' }) {
  const [timeframe, setTimeframe] = React.useState('6m');
  const activeSeries = timeframe === '30d' ? dailyUserGrowthSeries : monthlyUserGrowthSeries;
  const maxGrowthValue = Math.max(...activeSeries.map((entry) => entry.value), 1);
  const activePeak = React.useMemo(
    () => activeSeries.reduce((peak, entry) => (entry.value > peak.value ? entry : peak), activeSeries[0] || { key: '', label: '', value: 0 }),
    [activeSeries],
  );

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="glass-panel rounded-3xl border border-white/50 p-8 shadow-sm lg:col-span-8">
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
      </div>

      <div className="glass-panel flex flex-col rounded-3xl border border-white/50 p-8 shadow-sm lg:col-span-4">
        <h4 className="mb-2 font-headline text-xl font-bold text-[#272269]">Module Distribution</h4>
        <p className="mb-8 text-xs font-medium text-[#272269]/50">Asset allocation by department</p>

        <div className="flex-1 space-y-6">
          {distributionItems.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#272269]">{item.label}</span>
                <span className="text-[#F17620]">{item.value}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#272269]/5">
                <div className={`h-full ${item.barClassName} ${item.width} rounded-full`} />
              </div>
            </div>
          ))}
        </div>

        <button className="mt-8 w-full rounded-xl border border-[#272269]/10 py-3 text-xs font-bold text-[#272269] transition-colors hover:bg-[#272269]/5" type="button">
          View Full Distribution
        </button>
      </div>
    </section>
  );
}