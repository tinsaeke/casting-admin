import { FiLoader } from 'react-icons/fi'

interface Column<T> {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
  width?: string
}

interface Props<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  keyField?: string
  emptyMsg?: string
  onRowClick?: (row: T) => void
  rowClassName?: (row: T) => string
}

export default function DataTable<T extends Record<string, any>>({
  columns, data, loading, keyField = '_id', emptyMsg = 'No data found',
  onRowClick, rowClassName,
}: Props<T>) {
  if (loading) return (
    <div className="flex justify-center py-16">
      <FiLoader className="w-6 h-6 animate-spin text-orange-500" />
    </div>
  )
  if (data.length === 0) return (
    <div className="text-center py-16 text-sm text-gray-400">{emptyMsg}</div>
  )
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
          <tr>
            {columns.map(c => (
              <th key={c.key} className={`px-4 py-3 ${c.width || ''}`}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, i) => (
            <tr key={row[keyField] || i}
              className={`hover:bg-gray-50 transition-colors ${rowClassName ? rowClassName(row) : ''}`}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={onRowClick ? { cursor: 'pointer' } : undefined}
            >
              {columns.map(c => (
                <td key={c.key} className="px-4 py-3 text-gray-700">
                  {c.render ? c.render(row) : String(row[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
