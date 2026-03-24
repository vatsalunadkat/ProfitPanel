import { useEffect, useState } from 'react'
import { fetchQuoteById, updateQuote, deleteQuote, QuoteApiError } from '../api/quotes'
import type { QuoteResponse } from '../api/quotes'

interface Props {
    quoteId: number
    onClose: () => void
    onChanged: () => void
}

function formatDateTime(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleString('en-GB', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

type Mode = 'view' | 'edit' | 'confirm-delete'

export default function QuoteDetailModal({ quoteId, onClose, onChanged }: Props) {
    const [quote, setQuote] = useState<QuoteResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [mode, setMode] = useState<Mode>('view')
    const [saving, setSaving] = useState(false)

    // Edit form state
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [address, setAddress] = useState('')
    const [monthlyBill, setMonthlyBill] = useState('')

    useEffect(() => {
        fetchQuoteById(quoteId)
            .then(q => {
                setQuote(q)
                setName(q.name)
                setEmail(q.email)
                setAddress(q.address)
                setMonthlyBill(q.monthly_bill)
            })
            .catch(() => setError('Unable to load quote details.'))
            .finally(() => setLoading(false))
    }, [quoteId])

    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [onClose])

    async function handleSave() {
        setSaving(true)
        setError('')
        try {
            const updated = await updateQuote(quoteId, {
                name,
                email,
                address,
                monthly_bill: parseFloat(monthlyBill),
            })
            setQuote(updated)
            setMode('view')
            onChanged()
        } catch (err) {
            if (err instanceof QuoteApiError) {
                setError(err.friendlyMessages.join(' '))
            } else {
                setError('Failed to update quote. Please try again.')
            }
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete() {
        setSaving(true)
        setError('')
        try {
            await deleteQuote(quoteId)
            onChanged()
            onClose()
        } catch {
            setError('Failed to delete quote. Please try again.')
            setSaving(false)
        }
    }

    function handleCancelEdit() {
        if (quote) {
            setName(quote.name)
            setEmail(quote.email)
            setAddress(quote.address)
            setMonthlyBill(quote.monthly_bill)
        }
        setError('')
        setMode('view')
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-3">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {mode === 'edit' ? 'Edit Quote' : mode === 'confirm-delete' ? 'Delete Quote' : 'Quote Details'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 pb-6">
                    {loading && (
                        <div className="flex flex-col gap-3 py-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="animate-pulse h-5 bg-gray-100 dark:bg-gray-700 rounded-lg w-3/4" />
                            ))}
                        </div>
                    )}

                    {error && (
                        <p className="text-sm text-red-600 dark:text-red-400 pb-3">{error}</p>
                    )}

                    {quote && mode === 'view' && (
                        <>
                            <div className="flex flex-col gap-4 pt-1">
                                <Field label="Name" value={quote.name} />
                                <Field label="Email" value={quote.email} />
                                <Field label="Address" value={quote.address} />
                                <div className="grid grid-cols-2 gap-4">
                                    <Field
                                        label="Monthly Bill"
                                        value={`${parseFloat(quote.monthly_bill).toLocaleString('sv-SE')} kr`}
                                    />
                                    <Field
                                        label="Est. Savings"
                                        value={`${parseFloat(quote.estimated_savings).toLocaleString('sv-SE')} kr`}
                                        highlight
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Submitted" value={formatDateTime(quote.created_at)} />
                                    <Field label="Last Updated" value={formatDateTime(quote.updated_at)} />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-5">
                                <button
                                    onClick={() => setMode('edit')}
                                    className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-medium
                                               text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700
                                               hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg px-4 py-2.5
                                               transition-colors active:scale-95"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                                    </svg>
                                    Edit
                                </button>
                                <button
                                    onClick={() => setMode('confirm-delete')}
                                    className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-medium
                                               text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20
                                               hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg px-4 py-2.5
                                               transition-colors active:scale-95"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                    Delete
                                </button>
                            </div>
                        </>
                    )}

                    {quote && mode === 'edit' && (
                        <>
                            <div className="flex flex-col gap-3 pt-1">
                                <EditField label="Name" value={name} onChange={setName} />
                                <EditField label="Email" type="email" value={email} onChange={setEmail} />
                                <EditField label="Address" value={address} onChange={setAddress} />
                                <EditField label="Monthly Bill (kr)" type="number" value={monthlyBill} onChange={setMonthlyBill} min="0.01" step="0.01" />
                            </div>
                            <div className="flex gap-3 mt-5">
                                <button
                                    onClick={handleCancelEdit}
                                    disabled={saving}
                                    className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200
                                               bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                                               rounded-lg px-4 py-2.5 transition-colors active:scale-95 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 text-sm font-medium text-white bg-svea-green
                                               hover:bg-svea-green/90 rounded-lg px-4 py-2.5
                                               transition-colors active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? 'Saving…' : 'Save Changes'}
                                </button>
                            </div>
                        </>
                    )}

                    {quote && mode === 'confirm-delete' && (
                        <>
                            <p className="text-sm text-gray-600 dark:text-gray-400 pt-1">
                                Are you sure you want to delete the quote from <span className="font-medium text-gray-900 dark:text-gray-100">{quote.name}</span>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3 mt-5">
                                <button
                                    onClick={() => { setMode('view'); setError('') }}
                                    disabled={saving}
                                    className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200
                                               bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                                               rounded-lg px-4 py-2.5 transition-colors active:scale-95 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={saving}
                                    className="flex-1 text-sm font-medium text-white bg-red-600
                                               hover:bg-red-700 rounded-lg px-4 py-2.5
                                               transition-colors active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? 'Deleting…' : 'Confirm Delete'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div>
            <dt className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">{label}</dt>
            <dd className={`text-sm ${highlight ? 'text-svea-green font-semibold' : 'text-gray-900 dark:text-gray-100'}`}>
                {value}
            </dd>
        </div>
    )
}

function EditField({ label, value, onChange, type = 'text', min, step }: {
    label: string; value: string; onChange: (v: string) => void; type?: string; min?: string; step?: string
}) {
    return (
        <div>
            <label className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 block">{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                min={min}
                step={step}
                className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600
                           rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-svea-green/30 focus:border-svea-green transition"
            />
        </div>
    )
}
