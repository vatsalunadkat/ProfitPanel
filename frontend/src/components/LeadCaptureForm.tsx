import { useState, useEffect } from 'react'
import { submitQuote, QuoteApiError } from '../api/quotes'

interface LeadCaptureFormProps {
  initialBill?: number
}

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function LeadCaptureForm({ initialBill = 0 }: LeadCaptureFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [bill, setBill] = useState(initialBill)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessages, setErrorMessages] = useState<string[]>([])

  useEffect(() => {
    setBill(initialBill)
  }, [initialBill])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMessages([])

    try {
      await submitQuote({ name, email, address, monthly_bill: bill })
      setStatus('success')
      setName('')
      setEmail('')
      setAddress('')
      setBill(0)
    } catch (err) {
      setStatus('error')
      if (err instanceof QuoteApiError) {
        setErrorMessages(err.friendlyMessages)
      } else {
        setErrorMessages(['Something went wrong. Please check your connection and try again.'])
      }
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="text-lg font-semibold text-green-800">Quote request sent!</h3>
        <p className="text-green-600 text-sm mt-1">We'll be in touch with your personalized quote shortly.</p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-4 text-sm text-green-700 underline"
        >
          Submit another request
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Request your personalized quote</h2>
      <p className="text-gray-500 text-sm mb-5">
        Fill in your details and we'll get back to you with a tailored offer.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="jane@example.com"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Home address</label>
          <textarea
            required
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="1 Solar Street, Stockholm"
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monthly electricity bill (SEK)
          </label>
          <input
            type="number"
            required
            min={1}
            value={bill || ''}
            onChange={e => setBill(parseFloat(e.target.value) || 0)}
            placeholder="e.g. 1500"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {errorMessages.length > 0 && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
               role="alert">
            {errorMessages.length === 1 ? (
              <p>{errorMessages[0]}</p>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                {errorMessages.map((msg, i) => <li key={i}>{msg}</li>)}
              </ul>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-semibold
                     rounded-lg px-6 py-3 transition-colors"
        >
          {status === 'loading' ? 'Sending...' : 'Get my quote →'}
        </button>
      </form>
    </div>
  )
}
