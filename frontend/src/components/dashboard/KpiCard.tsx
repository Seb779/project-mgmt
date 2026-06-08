interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export function KpiCard({ label, value, sub, accent }: KpiCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 bg-white ${
        accent ? "border-blue-200" : "border-gray-200"
      }`}
    >
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p
        className={`text-2xl font-bold ${
          accent ? "text-blue-700" : "text-gray-900"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
