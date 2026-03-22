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

  function validate(): string[] {
    const errs: string[] = []
    if (!name.trim()) errs.push('Name is required.')
    if (!email.trim()) errs.push('Email is required.')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push('Email address is not valid.')
    if (!address.trim()) errs.push('Address is required.')
    if (!bill || bill < 1) errs.push('Monthly bill must be at least 1 SEK.')
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessages([])

    const clientErrors = validate()
    if (clientErrors.length > 0) {
      setStatus('error')
      setErrorMessages(clientErrors)
      return
    }

    setStatus('loading')

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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8 text-center flex flex-col items-center justify-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-svea-green/10 flex items-center justify-center mb-4 animate-fade-in-up">
          <svg className="w-6 h-6 text-svea-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white animate-fade-in-up-delay">Quote request sent!</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1.5 max-w-sm mx-auto leading-relaxed animate-fade-in-up-delay">
          We'll be in touch with your personalized solar savings quote shortly.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100
                     bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                     rounded-full px-5 py-2 transition-all duration-200 hover:shadow-sm
                     active:scale-95 animate-fade-in-up-delay-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Submit another request
        </button>
      </div>
    )
  }

  const inputClasses = `w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600
    rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100
    placeholder:text-gray-400 dark:placeholder:text-gray-500
    focus:outline-none focus:ring-2 focus:ring-svea-green/30 focus:border-svea-green transition`

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 sm:p-6 flex flex-col">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">Request your personalized quote</h2>
      <p className="text-gray-500 dark:text-gray-400 text-xs mb-4">
        Fill in your details and we'll get back to you with a tailored solar offer.
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="lead-name" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Full name</label>
            <input
              id="lead-name"
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Smith"
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="lead-email" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email address</label>
            <input
              id="lead-email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className={inputClasses}
            />
          </div>
        </div>

        <div>
          <label htmlFor="lead-address" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Home address</label>
          <input
            id="lead-address"
            type="text"
            required
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="1 Solar Street, Stockholm"
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="lead-bill" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Monthly electricity bill (SEK)
          </label>
          <input
            id="lead-bill"
            type="number"
            required
            min={1}
            value={bill || ''}
            onChange={e => setBill(parseFloat(e.target.value) || 0)}
            placeholder="e.g. 1 500"
            className={inputClasses}
          />
        </div>

        {errorMessages.length > 0 && (
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2"
               role="alert">
            {errorMessages.length === 1 ? (
              <p>{errorMessages[0]}</p>
            ) : (
              <ul className="list-disc list-inside space-y-0.5">
                {errorMessages.map((msg, i) => <li key={i}>{msg}</li>)}
              </ul>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="mt-auto bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100
                     disabled:bg-gray-300 dark:disabled:bg-gray-600 dark:disabled:text-gray-400
                     text-white font-medium rounded-full px-6 py-3
                     transition-all duration-200 text-sm hover:shadow-md active:scale-[0.98]"
        >
          {status === 'loading' ? (
            <span className="inline-flex items-center gap-2 justify-center">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sending...
            </span>
          ) : (
            'Get my quote'
          )}
        </button>
      </form>
    </div>
  )
}
