interface Props {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}
export default function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-base font-black text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
