import { useEffect, useMemo, useState } from 'react'
import { fetchQuotes } from '../api/quotes'
import type { QuoteResponse } from '../api/quotes'
import QuoteDetailModal from '../components/QuoteDetailModal'

type SortKey = 'name' | 'email' | 'address' | 'monthly_bill' | 'estimated_savings' | 'created_at'
type SortDir = 'asc' | 'desc'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg className={`w-3 h-3 inline-block ml-1 transition-colors ${active ? 'text-svea-green' : 'text-gray-300 dark:text-gray-600'}`} viewBox="0 0 10 14" fill="currentColor">
      <path d="M5 0L9.33 5H.67L5 0z" opacity={!active || dir === 'asc' ? 1 : 0.3} />
      <path d="M5 14L.67 9h8.66L5 14z" opacity={!active || dir === 'desc' ? 1 : 0.3} />
    </svg>
  )
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('sv-SE', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function DashboardPage() {
  const [quotes, setQuotes] = useState<QuoteResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null)

  function loadQuotes() {
    setLoading(true)
    setError('')
    fetchQuotes()
      .then(setQuotes)
      .catch(() => setError('Unable to load quotes. Please check your connection / server status and try again after some time.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadQuotes()
  }, [])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'name' || key === 'email' || key === 'address' ? 'asc' : 'desc')
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return quotes
    return quotes.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.address.toLowerCase().includes(q)
    )
  }, [quotes, search])

  const sorted = useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name':
        case 'email':
        case 'address':
          cmp = a[sortKey].localeCompare(b[sortKey], 'sv-SE')
          break
        case 'monthly_bill':
        case 'estimated_savings':
          cmp = parseFloat(a[sortKey]) - parseFloat(b[sortKey])
          break
        case 'created_at':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [filtered, sortKey, sortDir])

  const totalSavings = quotes.reduce((sum, q) => sum + parseFloat(q.estimated_savings), 0)

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quote Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse h-24 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700" />
          ))}
        </div>
        <div className="animate-pulse flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quote Dashboard</h1>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={loadQuotes}
            className="shrink-0 inline-flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 rounded-lg px-4 py-2 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const thBase = "px-4 py-3 text-xs font-medium uppercase tracking-wide whitespace-nowrap cursor-pointer select-none transition-colors hover:text-gray-600 dark:hover:text-gray-300"
  const thColor = "text-gray-400 dark:text-gray-500"

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Quote Dashboard</h1>
        <button
          onClick={loadQuotes}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400
                     hover:text-gray-700 dark:hover:text-gray-200
                     bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                     rounded-full px-4 py-2 hover:border-gray-300 dark:hover:border-gray-600
                     transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <div className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Total quotes</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{quotes.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <div className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Total estimated savings</div>
          <div className="text-3xl font-bold text-svea-green">{totalSavings.toLocaleString('sv-SE')} kr</div>
        </div>
      </div>

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or address..."
          className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                     rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-gray-100
                     placeholder:text-gray-400 dark:placeholder:text-gray-500
                     focus:outline-none focus:ring-2 focus:ring-svea-green/30 focus:border-svea-green transition"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {sorted.length === 0 && search ? (
        <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">No quotes match "{search}"</p>
        </div>
      ) : quotes.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-16 text-center">
          <svg className="mx-auto w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
          <p className="text-gray-400 dark:text-gray-500 text-sm">No quote requests yet. Submit one on the home page!</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className={`text-left ${thBase} ${thColor}`} onClick={() => toggleSort('name')}>
                    Name<SortIcon active={sortKey === 'name'} dir={sortDir} />
                  </th>
                  <th className={`text-left ${thBase} ${thColor}`} onClick={() => toggleSort('email')}>
                    Email<SortIcon active={sortKey === 'email'} dir={sortDir} />
                  </th>
                  <th className={`text-left ${thBase} ${thColor}`} onClick={() => toggleSort('address')}>
                    Address<SortIcon active={sortKey === 'address'} dir={sortDir} />
                  </th>
                  <th className={`text-right ${thBase} ${thColor}`} onClick={() => toggleSort('monthly_bill')}>
                    Monthly bill<SortIcon active={sortKey === 'monthly_bill'} dir={sortDir} />
                  </th>
                  <th className={`text-right ${thBase} ${thColor}`} onClick={() => toggleSort('estimated_savings')}>
                    Est. savings<SortIcon active={sortKey === 'estimated_savings'} dir={sortDir} />
                  </th>
                  <th className={`text-right ${thBase} ${thColor}`} onClick={() => toggleSort('created_at')}>
                    Submitted<SortIcon active={sortKey === 'created_at'} dir={sortDir} />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {sorted.map(quote => (
                  <tr key={quote.id} onClick={() => setSelectedQuoteId(quote.id)} className="hover:bg-svea-green/[0.03] dark:hover:bg-svea-green/[0.06] transition-colors cursor-pointer">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{quote.name}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{quote.email}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{quote.address}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {parseFloat(quote.monthly_bill).toLocaleString('sv-SE')} kr
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className="text-svea-green font-medium">
                        {parseFloat(quote.estimated_savings).toLocaleString('sv-SE')} kr
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {formatDateTime(quote.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedQuoteId !== null && (
        <QuoteDetailModal
          quoteId={selectedQuoteId}
          onClose={() => setSelectedQuoteId(null)}
          onChanged={loadQuotes}
        />
      )}
    </div>
  )
}
