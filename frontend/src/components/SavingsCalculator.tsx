import { useState } from 'react'

interface SavingsCalculatorProps {
  onBillChange: (bill: number) => void
}

export default function SavingsCalculator({ onBillChange }: SavingsCalculatorProps) {
  const [bill, setBill] = useState<number>(0)
  const savings = Math.round(bill * 0.3 * 100) / 100
  const afterSolar = Math.round((bill - savings) * 100) / 100
  const annualSavings = Math.round(savings * 12 * 100) / 100

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = parseFloat(e.target.value) || 0
    setBill(value)
    onBillChange(value)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">
        Calculate your savings
      </h2>
      <p className="text-gray-500 text-sm mb-5">
        Enter your average monthly electricity bill to see how much you could save.
      </p>

      <label htmlFor="calc-bill" className="block text-sm font-medium text-gray-700 mb-1">
        Monthly electricity bill (SEK)
      </label>
      <input
        id="calc-bill"
        type="number"
        min={0}
        value={bill || ''}
        onChange={handleChange}
        placeholder="e.g. 1500"
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900
                   focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent
                   mb-6"
      />

      <div aria-live="polite">
        {bill > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-xs text-red-400 font-medium uppercase tracking-wide mb-1">
                  Current bill
                </div>
                <div className="text-2xl font-bold text-red-600">{bill} kr</div>
                <div className="text-xs text-red-400 mt-1">per month</div>
              </div>

              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <div className="text-xs text-amber-500 font-medium uppercase tracking-wide mb-1">
                  You save
                </div>
                <div className="text-2xl font-bold text-amber-600">{savings} kr</div>
                <div className="text-xs text-amber-500 mt-1">per month</div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-xs text-green-500 font-medium uppercase tracking-wide mb-1">
                  After solar
                </div>
                <div className="text-2xl font-bold text-green-600">{afterSolar} kr</div>
                <div className="text-xs text-green-500 mt-1">per month</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Your bill breakdown</span>
                <span>30% savings</span>
              </div>
              <div className="h-3 rounded-full bg-gray-100 overflow-hidden flex">
                <div className="bg-green-400 h-full" style={{ width: '30%' }} />
                <div className="bg-red-300 h-full" style={{ width: '70%' }} />
              </div>
            </div>

            <p className="mt-4 text-center text-sm text-gray-500">
              That's <span className="font-semibold text-green-600">{annualSavings} kr</span> saved per year.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
