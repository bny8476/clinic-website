
export default function PageHeader({ title, subtitle, icon }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      {icon && <div className="p-2 bg-surface rounded-lg shadow-sm border border-surface-border">{icon}</div>}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
        {subtitle && <p className="text-text-secondary mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
