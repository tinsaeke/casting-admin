interface Props {
  page: number
  pages: number
  total: number
  onChange: (p: number) => void
}
export default function Pagination({ page, pages, total, onChange }: Props) {
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
      <span>{total} total</span>
      <div className="flex items-center gap-1">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition font-bold">
          ← Prev
        </button>
        <span className="px-3 py-1.5 font-bold">{page} / {pages}</span>
        <button disabled={page >= pages} onClick={() => onChange(page + 1)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition font-bold">
          Next →
        </button>
      </div>
    </div>
  )
}
