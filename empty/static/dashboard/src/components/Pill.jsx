// Status pill using the DESIGN.md lozenge palette (background / text / border).
export const TONES = {
  danger: 'bg-[#FFEBE6] text-[#DE350B] border-[#FFBDAD]',
  warning: 'bg-[#FFF0B3] text-[#172B4D] border-[#FFE380]',
  success: 'bg-[#E3FCEF] text-[#006644] border-[#ABF5D1]',
  info: 'bg-[#DEEBFF] text-[#0747A6] border-[#B3D4FF]',
  purple: 'bg-[#EAE6FF] text-[#403294] border-[#C0B6F2]',
  neutral: 'bg-surface-container text-on-surface-variant border-outline-variant',
};

export const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export default function Pill({ tone = 'neutral', icon, children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-label-sm text-label-sm uppercase px-1.5 py-0.5 rounded-[3px] border ${TONES[tone]} ${className}`}
    >
      {icon && <Icon name={icon} className="text-[13px]" />}
      {children}
    </span>
  );
}
