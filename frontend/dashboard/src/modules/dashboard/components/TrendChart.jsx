export default function TrendChart({ data = null }) {
  const BASE_Y = 180;
  const UNIT = 20;      // pixels per deviation
  const FIRST_X = 60;
  const STEP = 40;
  const ticks = [0, 2, 4, 6, 8];

  const trendData = data?.weekly || [];
  const trendSummary = data?.summary || { average: '0.0 / wk', movingAvg: '0.0 items/wk', stability: 'Stable' };

  if (trendData.length === 0) {
    return (
      <div className="jira-card p-4 flex flex-col justify-center items-center h-[260px] text-[#6B778C]">
        <span>No weekly intake trend data available.</span>
      </div>
    );
  }

  const pts = trendData.map((v, i) => ({ week: i + 1, v, x: FIRST_X + i * STEP, y: BASE_Y - v * UNIT }));
  const line = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `${pts[0].x},${BASE_Y} ${line} ${pts[pts.length - 1].x},${BASE_Y}`;
  const peak = pts.reduce((a, b) => (b.v > a.v ? b : a), pts[0]);
  const labelled = pts.filter((p) => p.week % 2 === 1 || p.week === pts.length);

  return (
    <div className="jira-card p-4 flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#DFE1E6] gap-2">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-[#172B4D]">Deviations over time</h2>
          <p className="font-body-md text-body-md text-[#6B778C]">Weekly intake rate across last 12 weeks</p>
        </div>
        <span className="inline-flex items-center gap-1 font-body-md text-body-md text-[#172B4D] bg-[#F4F5F7] px-2 py-0.5 rounded border border-[#DFE1E6]">
          <span className="w-2.5 h-0.5 bg-[#0052CC]" /> 12-wk Avg: {trendSummary.average}
        </span>
      </div>

      <div className="w-full pt-4 pb-1">
        <svg viewBox="0 0 540 220" role="img" aria-label="12-week deviation intake trend line" className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0052CC" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0052CC" stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks.map((t) => {
            const y = BASE_Y - t * UNIT;
            return (
              <g key={t}>
                <line x1="40" x2="520" y1={y} y2={y} stroke={t === 0 ? '#DFE1E6' : '#EBECF0'}
                  strokeDasharray={t === 0 ? undefined : '2,2'} strokeWidth="1" />
                <text x="32" y={y + 4} textAnchor="end" fill="#6B778C" fontSize="10" fontFamily="JetBrains Mono">{t}</text>
              </g>
            );
          })}

          <polygon points={area} fill="url(#areaGradient)" />
          <polyline points={line} fill="none" stroke="#0052CC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {pts.map((p) => {
            const isPeak = p === peak && p.v > 0;
            return (
              <circle key={p.week} cx={p.x} cy={p.y} r={isPeak ? 4.5 : 3.5}
                fill={isPeak ? '#DE350B' : '#FFFFFF'} stroke={isPeak ? '#DE350B' : '#0052CC'} strokeWidth="2" />
            );
          })}

          {peak.v > 0 && (
            <text x={peak.x} y={peak.y - 12} textAnchor="middle" fill="#DE350B" fontFamily="Inter" fontSize="11" fontWeight="700">
              {peak.v} (Peak)
            </text>
          )}

          {labelled.map((p) => (
            <text key={p.week} x={p.x} y="200" textAnchor="middle" fill="#6B778C" fontSize="11" fontFamily="JetBrains Mono">
              W{p.week}
            </text>
          ))}
        </svg>
      </div>

      <div className="mt-auto pt-2 flex items-center justify-between text-[11px] text-[#6B778C] border-t border-[#F4F5F7]">
        <span>Recent 3-week moving average: {trendSummary.movingAvg}</span>
        <span className="text-[#0052CC] font-semibold">Stability: {trendSummary.stability}</span>
      </div>
    </div>
  );
}
