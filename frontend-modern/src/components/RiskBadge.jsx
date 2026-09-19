export default function RiskBadge({ level }) {
  const map = {
    Red: 'bg-medical-red/10 text-medical-red border border-medical-red/30',
    Yellow: 'bg-medical-amber/10 text-medical-amber border border-medical-amber/30',
    Green: 'bg-medical-green/10 text-medical-green border border-medical-green/30'
  };
  const cls = map[level] || map.Green;
  return (
    <span className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold uppercase tracking-wider ${cls}`}>
      {level || 'Green'}
    </span>
  );
}
