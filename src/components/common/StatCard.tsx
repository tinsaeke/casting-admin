interface Props {
  label: string
  value: string | number
  icon: React.ReactNode
  color?: string
}
export default function StatCard({ label, value, icon, color = 'text-orange-500' }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  )
}
