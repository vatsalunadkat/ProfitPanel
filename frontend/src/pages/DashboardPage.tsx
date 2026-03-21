import { useEffect, useState } from 'react'
import { fetchQuotes } from '../api/quotes'
import type { QuoteResponse } from '../api/quotes'

export default function DashboardPage() {
  const [quotes, setQuotes] = useState<QuoteResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function loadQuotes() {
    setLoading(true)
    setError('')
    fetchQuotes()
      .then(setQuotes)
      .catch(() => setError('Could not load quotes. Is the backend running?'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadQuotes()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Quote requests</h1>
        <div className="animate-pulse flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Quote requests</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">{error}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Quote requests</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{quotes.length} total</span>
          <button
            onClick={loadQuotes}
            className="text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {quotes.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-500">No quote requests yet. Submit one on the home page!</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Address</th>
                <th className="text-right px-4 py-3">Monthly bill</th>
                <th className="text-right px-4 py-3">Est. savings</th>
                <th className="text-right px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotes.map(quote => (
                <tr key={quote.id} className="bg-white hover:bg-amber-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{quote.name}</td>
                  <td className="px-4 py-3 text-gray-600">{quote.email}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{quote.address}</td>
                  <td className="px-4 py-3 text-right text-gray-900">
                    {parseFloat(quote.monthly_bill).toLocaleString()} kr
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-green-700 font-medium">
                      {parseFloat(quote.estimated_savings).toLocaleString()} kr
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">
                    {new Date(quote.created_at).toLocaleDateString('sv-SE')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
