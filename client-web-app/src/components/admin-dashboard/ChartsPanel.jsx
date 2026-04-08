import React from 'react';

const growthBars = [
  { height: 'h-32', tone: 'bg-[#F17620]/10' },
  { height: 'h-48', tone: 'bg-[#F17620]/10' },
  { height: 'h-24', tone: 'bg-[#F17620]/20' },
  { height: 'h-56', tone: 'bg-[#F17620]/30' },
  { height: 'h-40', tone: 'bg-[#F17620]/15' },
  { height: 'h-60', tone: 'bg-gradient-to-t from-[#F17620] to-[#fe802a]' },
];

const distributionItems = [
  { label: 'Science & Tech', value: '42%', width: 'w-[42%]', barClassName: 'bg-[#272269]/60' },
  { label: 'Business School', value: '28%', width: 'w-[28%]', barClassName: 'bg-[#F17620]' },
  { label: 'Humanities', value: '15%', width: 'w-[15%]', barClassName: 'bg-[#272269]/20' },
  { label: 'Architecture', value: '15%', width: 'w-[15%]', barClassName: 'bg-[#272269]/10' },
];

export default function ChartsPanel() {
  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="glass-panel rounded-3xl border border-white/50 p-8 shadow-sm lg:col-span-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h4 className="font-headline text-xl font-bold text-[#272269]">User Growth &amp; Activity</h4>
            <p className="text-xs font-medium text-[#272269]/50">Historical engagement metrics across 12 months</p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-xl border border-[#272269]/10 bg-[#272269]/5 px-4 py-2 text-xs font-bold text-[#272269]" type="button">
              12 Months
            </button>
            <button className="rounded-xl px-4 py-2 text-xs font-bold text-[#272269]/50 transition-colors hover:bg-[#272269]/5" type="button">
              30 Days
            </button>
          </div>
        </div>

        <div className="flex h-64 items-end justify-between gap-4 px-4">
          {growthBars.map((bar, index) => (
            <div key={index} className={`relative w-full rounded-t-lg ${bar.height} ${bar.tone} transition-all duration-300 hover:h-64`}>
              {index === growthBars.length - 1 ? (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 rounded bg-[#272269] px-2 py-1 text-[10px] font-bold text-white shadow-xl opacity-0 transition-opacity group-hover:opacity-100">
                  Peak: 12.4k
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-between px-4 text-[10px] font-bold uppercase tracking-widest text-[#272269]/30">
          <span>Jan</span>
          <span>Mar</span>
          <span>May</span>
          <span>Jul</span>
          <span>Sep</span>
          <span>Nov</span>
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