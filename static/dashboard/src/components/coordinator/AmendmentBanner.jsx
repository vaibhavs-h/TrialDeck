import Icon from '../Icon.jsx';
import { banner } from './coordinatorData.js';

export default function AmendmentBanner() {
  return (
    <section className="w-full mb-space-md">
      <div className="bg-amber-50 rounded-lg p-3.5 flex items-center justify-between gap-space-md shadow-sm">
        <div className="flex items-center gap-space-sm min-w-0">
          <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 text-amber-700 bg-amber-100">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          </div>
          <p className="font-body-md text-body-md text-amber-950 truncate">
            <strong className="font-body-bold text-body-bold">{banner.title}</strong> {banner.message}
          </p>
        </div>
        <a href="#tasks-section" className="font-body-bold text-body-bold text-primary hover:text-primary-container shrink-0 flex items-center gap-1 transition-colors">
          View tasks
          <Icon name="arrow_forward" className="text-[16px]" />
        </a>
      </div>
    </section>
  );
}