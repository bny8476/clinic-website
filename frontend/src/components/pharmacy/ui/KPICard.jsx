import PropTypes from 'prop-types';
import { cn } from "../../../utils/pharmacy/cn";

export default function KPICard({ title, value, subtext, icon: Icon, trend, iconColor = 'blue', className }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-blue-50 text-blue-600',
    red: 'bg-rose-50 text-rose-600',
    orange: 'bg-orange-50 text-orange-500',
    amber: 'bg-amber-50 text-amber-500',
    purple: 'bg-purple-50 text-purple-600',
    slate: 'bg-slate-50 text-slate-600',
  };

  const trendIcon = trend === 'up' ? <ArrowUp size={14} strokeWidth={3} /> :
                    trend === 'down' ? <ArrowDown size={14} strokeWidth={3} /> :
                    <Minus size={14} strokeWidth={3} />;

  // Clean the subtext in case the parent passed hardcoded arrows
  const cleanSubtext = subtext ? subtext.replace(/^[↑↓]\s*/, '') : '';

  return (
    <div className={cn("bg-white p-5 rounded-[20px] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between min-h-[140px]", className)}>
      <div className="flex justify-between items-start w-full">
        <p className="text-[13.5px] font-semibold text-slate-600 leading-snug w-[75%] pr-2">{title}</p>
        <div className={cn("w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0", colorMap[iconColor] || colorMap.blue)}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-4">{value}</h3>
        {subtext && (
          <p className={cn(
            "text-[12px] mt-2 font-bold flex items-center gap-1",
            trend === 'up' ? "text-blue-600" : trend === 'down' ? "text-rose-600" : "text-slate-500"
          )}>
            {trendIcon}
            <span className="text-slate-500 font-medium ml-0.5">{cleanSubtext}</span>
          </p>
        )}
      </div>
    </div>
  );
}

KPICard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtext: PropTypes.string,
  icon: PropTypes.elementType.isRequired,
  trend: PropTypes.oneOf(['up', 'down', 'neutral']),
  iconColor: PropTypes.string,
  className: PropTypes.string
};
