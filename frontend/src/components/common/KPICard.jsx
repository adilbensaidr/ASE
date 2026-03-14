const colorMap = {
  blue: 'text-primary-600',
  slate: 'text-secondary-900',
  amber: 'text-amber-600',
  emerald: 'text-emerald-600'
};

export default function KPICard({ title, value, subtitle, color = 'blue' }) {
  const textColor = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className={`text-3xl font-bold mt-1 ${textColor}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
