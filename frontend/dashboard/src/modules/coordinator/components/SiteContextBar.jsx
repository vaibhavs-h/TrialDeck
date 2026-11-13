import Icon from '../../../components/common/Icon.jsx';

export default function SiteContextBar({
  onReport,
  sites = [],
  selectedSite,
  onSelectSite,
  selectedCategory = 'all',
  onSelectCategory,
  selectedRange = '90',
  onRangeChange
}) {
  return (
    <section className="w-full bg-surface-container-lowest rounded-lg shadow-sm mb-space-md p-space-md border border-outline-variant/40">
      <div className="flex flex-wrap items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-md flex-wrap">
          <div className="flex items-center gap-space-sm">
            <div className="w-7 h-7 rounded bg-primary flex items-center justify-center text-on-primary">
              <Icon name="domain" className="text-[18px]" />
            </div>
            <div className="flex items-center gap-space-xs">
              <span className="font-headline-sm text-headline-sm text-on-surface">Site Operations</span>
              <span className="font-code text-code text-outline">/</span>
              <span className="font-body-bold text-body-bold text-primary">
                {selectedSite || 'All Sites'}
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-surface-container-highest" />

          {/* Site Filter */}
          <div className="flex items-center gap-space-xs px-2.5 py-1 bg-surface-container-low rounded border border-outline-variant text-on-surface">
            <Icon name="pin_drop" className="text-[16px] text-primary" />
            <select
              value={selectedSite || 'all'}
              onChange={(e) => onSelectSite(e.target.value === 'all' ? null : e.target.value)}
              className="bg-transparent border-none text-on-surface font-body-bold text-body-bold focus:outline-none cursor-pointer"
            >
              <option value="all">All Sites</option>
              {sites.map(siteName => (
                <option key={siteName} value={siteName}>{siteName}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-space-xs px-2.5 py-1 bg-surface-container-low rounded border border-outline-variant text-on-surface">
            <Icon name="filter_list" className="text-[16px] text-primary" />
            <select
              value={selectedCategory || 'all'}
              onChange={(e) => onSelectCategory(e.target.value === 'all' ? null : e.target.value)}
              className="bg-transparent border-none text-on-surface font-body-bold text-body-bold focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="major">Major Only</option>
              <option value="minor">Minor Only</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-space-xs px-2.5 py-1 bg-surface-container-low rounded border border-outline-variant text-on-surface">
            <Icon name="calendar_today" className="text-[16px] text-outline" />
            <select
              value={selectedRange}
              onChange={(e) => onRangeChange?.(e.target.value)}
              className="bg-transparent border-none text-on-surface font-body-md text-body-md focus:outline-none cursor-pointer"
            >
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="180">Last 6 months</option>
              <option value="365">Protocol to date (YTD)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-space-sm">
          <button
            type="button"
            onClick={onReport}
            className="h-8 px-3.5 bg-primary-container hover:bg-primary text-on-primary rounded font-headline-sm text-headline-sm flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Icon name="add" className="text-[18px]" />
            Report deviation
          </button>
        </div>
      </div>
    </section>
  );
}
