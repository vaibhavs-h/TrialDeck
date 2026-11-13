const X0 = 50, STEP = 75, BASE = 180, UNIT = 20, AXIS_Y = 175;
const grid = [20, 60, 100, 140];
const yLabels = [8, 6, 4, 2];

export default function SiteTrendChart({ trend = [], siteName }) {
  const weeklyOpen = (trend && trend.length > 0) ? trend : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const pts = weeklyOpen.map((v, i) => ({ week: i + 1, v, x: X0 + i * STEP, y: Math.max(10, BASE - v * UNIT) }));
  const line = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `${pts[0].x},${AXIS_Y} ${line} ${pts[pts.length - 1].x},${AXIS_Y}`;
  const target = 2;
  const targetY = BASE - target * UNIT;
  const peak = pts.reduce((a, b) => (b.v > a.v ? b : a), pts[0]);
  const last = pts[pts.length - 1];

  return (
    <section className="w-full bg-surface-container-lowest rounded-lg shadow-sm p-space-md mb-space-md border border-outline-variant/40">
      <div className="flex flex-wrap items-center justify-between pb-space-sm mb-space-md">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
            Deviations over time {siteName ? `at ${siteName}` : ''}
          </h2>
          <p className="font-body-md text-body-md text-outline">Weekly intake rate and volume across Weeks 1 – 12</p>
        </div>
        <div className="flex items-center gap-space-md mt-2 sm:mt-0">
          <div className="flex items-center gap-1.5 font-body-md text-body-md text-on-surface">
            <span className="w-3 h-0.5 bg-primary-container inline-block" />
            <span>Open count</span>
          </div>
          <div className="flex items-center gap-1.5 font-body-md text-body-md text-outline">
            <span className="w-3 h-0.5 bg-outline-variant inline-block border-t border-dashed" />
            <span>Target baseline (≤ {target})</span>
          </div>
          {peak.v > 0 && (
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-low text-primary uppercase font-bold border border-outline-variant/40">
              Peak: W{peak.week} ({peak.v})
            </span>
          )}
        </div>
      </div>

      <div className="w-full h-56 pt-2">
        <svg className="w-full h-full" viewBox="0 0 960 200" preserveAspectRatio="none" role="img" aria-label="Open deviations per week">
          <defs>
            <linearGradient id="siteAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0052cc" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0052cc" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {grid.map((y) => <line key={y} x1="40" x2="940" y1={y} y2={y} stroke="#DFE1E6" strokeWidth="1" />)}
          <line x1="40" x2="940" y1={AXIS_Y} y2={AXIS_Y} stroke="#737685" strokeWidth="1" />
          <line x1="40" x2="940" y1={targetY} y2={targetY} stroke="#ba1a1a" strokeOpacity="0.4" strokeDasharray="4,4" strokeWidth="1.5" />

          {yLabels.map((n) => (
            <text key={n} x="30" y={BASE - n * UNIT + 4} textAnchor="end" className="font-code" fontSize="11" fill="#737685">{n}</text>
          ))}
          <text x="30" y="179" textAnchor="end" className="font-code" fontSize="11" fill="#737685">0</text>

          <polygon points={area} fill="url(#siteAreaGradient)" />
          <polyline points={line} fill="none" stroke="#0052cc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {pts.map((p) => {
            const isPeak = p.week === peak.week && p.v > 0;
            const isLast = p === last;
            const big = isPeak || isLast;
            return (
              <circle
                key={p.week} cx={p.x} cy={p.y} r={big ? 4.5 : 3}
                fill={isPeak ? '#ba1a1a' : big ? '#0052cc' : '#ffffff'}
                stroke={big ? '#ffffff' : '#0052cc'} strokeWidth="2"
              />
            );
          })}

          {pts.map((p) => {
            const isPeak = p.week === peak.week && p.v > 0;
            const isLast = p === last;
            return (
              <text
                key={p.week} x={p.x} y="195" textAnchor="middle" className="font-code"
                fontSize="11" fontWeight={isPeak || isLast ? 700 : 400}
                fill={isPeak ? '#ba1a1a' : isLast ? '#0052cc' : '#737685'}
              >
                {isLast ? `W${p.week} (Now)` : `W${p.week}`}
              </text>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
