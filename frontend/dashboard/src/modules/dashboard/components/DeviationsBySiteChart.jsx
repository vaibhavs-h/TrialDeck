import { deviationsBySite } from '../data/mockData.js';

const MAX = 12;          // y-axis max
const BASE_Y = 180;      // baseline pixel
const CHART_H = 160;     // pixels for 0..MAX
const BAR_W = 46;
const FIRST_X = 75;
const STEP = 95;
const ticks = [0, 3, 6, 9, 12];

const legend = [
  { label: 'Total', color: '#0052CC' },
  { label: 'Major', color: '#DE350B' },
  { label: 'Minor', color: '#FFAB00' },
];

export default function DeviationsBySiteChart() {
  const px = (v) => (v / MAX) * CHART_H;

  return (
    <div className="jira-card p-4 flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#DFE1E6] gap-2">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-[#172B4D]">Deviations by site</h2>
          <p className="font-body-md text-body-md text-[#6B778C]">Open &amp; resolved incidents for active investigator sites</p>
        </div>
        <div className="flex items-center gap-3">
          {legend.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-[2px]" style={{ background: color }} />
              <span className="font-body-md text-body-md text-[#6B778C]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full pt-4 pb-1">
        <svg viewBox="0 0 540 220" role="img" aria-label="Deviations distribution by site" className="w-full h-auto overflow-visible">
          {/* gridlines + y labels */}
          {ticks.map((t) => {
            const y = BASE_Y - px(t);
            return (
              <g key={t}>
                <line
                  x1="40" x2="520" y1={y} y2={y}
                  stroke={t === 0 ? '#DFE1E6' : '#EBECF0'}
                  strokeDasharray={t === 0 ? undefined : '2,2'}
                  strokeWidth="1"
                />
                <text x="32" y={y + 4} textAnchor="end" fill="#6B778C" fontSize="10" fontFamily="JetBrains Mono">{t}</text>
              </g>
            );
          })}

          {/* bars */}
          {deviationsBySite.map((s, i) => {
            const x = FIRST_X + i * STEP;
            const cx = x + BAR_W / 2;
            const h = Math.round(px(s.total));
            const y = BASE_Y - h;
            return (
              <g key={s.id}>
                <rect x={x} y={y} width={BAR_W} height={h} rx="2" fill="#0052CC" />
                {s.major > 0 && (
                  <rect x={x} y={y} width={BAR_W} height={Math.round(px(s.major))} rx="2" fill="#DE350B" />
                )}
                <text x={cx} y={y - 7} textAnchor="middle" fontFamily="Inter" fontSize="12"
                  fontWeight={s.flagged ? 700 : 600} fill={s.flagged ? '#DE350B' : '#172B4D'}>{s.total}</text>
                <text x={cx} y="200" textAnchor="middle" fontFamily="Inter" fontSize="11"
                  fontWeight={s.flagged ? 600 : 500} fill={s.flagged ? '#172B4D' : '#42526E'}>{s.id}</text>
                <text x={cx} y="214" textAnchor="middle" fontFamily="Inter" fontSize="9"
                  fill={s.flagged ? '#DE350B' : '#6B778C'}>{s.name}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-auto pt-2 flex items-center justify-between text-[11px] text-[#6B778C] border-t border-[#F4F5F7]">
        <span>Threshold: &gt;5 incidents triggers GCP notification</span>
        <span className="font-medium text-[#172B4D]">Site 02 exceeded baseline by 120%</span>
      </div>
    </div>
  );
}