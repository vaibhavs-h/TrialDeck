import { insight } from './mockData.js';

export default function InsightBanner() {
  return (
    <div className="mt-4 bg-[#DEEBFF] border border-[#B3D4FF] rounded-[3px] px-3.5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="w-5 h-5 rounded-full bg-[#0747A6] flex items-center justify-center shrink-0">
          <span className="text-white text-[12px] font-bold">i</span>
        </div>
        <p className="font-body-md text-body-md text-[#0747A6]">
          <strong className="font-semibold text-[#041B3C]">{insight.site}</strong> {insight.message}
        </p>
      </div>
      <a
        href="#table-section"
        className="font-headline-sm text-headline-sm text-[#0052CC] hover:underline font-semibold whitespace-nowrap inline-flex items-center gap-1 self-end sm:self-auto"
      >
        View details →
      </a>
    </div>
  );
}