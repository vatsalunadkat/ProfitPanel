import { useState, useEffect } from 'react'

interface SavingsCalculatorProps {
  defaultBill?: number
  onBillChange: (bill: number) => void
}

export default function SavingsCalculator({ defaultBill = 0, onBillChange }: SavingsCalculatorProps) {
  const [bill, setBill] = useState<number>(defaultBill)
  const savings = Math.round(bill * 0.3 * 100) / 100
  const afterSolar = Math.round((bill - savings) * 100) / 100
  const annualSavings = Math.round(savings * 12 * 100) / 100
  const pct = bill > 0 ? 30 : 0

  useEffect(() => {
    onBillChange(defaultBill)
  }, [])

  function updateBill(value: number) {
    setBill(value)
    onBillChange(value)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    updateBill(parseFloat(e.target.value) || 0)
  }

  function handleSliderChange(e: React.ChangeEvent<HTMLInputElement>) {
    updateBill(parseInt(e.target.value, 10))
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 sm:p-6 flex flex-col">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">
        Calculate your savings
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-xs mb-4">
        Enter your monthly electricity bill or drag the slider.
      </p>

      <label htmlFor="calc-bill" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
        Monthly electricity bill (SEK)
      </label>
      <input
        id="calc-bill"
        type="number"
        min={0}
        max={5000}
        value={bill || ''}
        onChange={handleInputChange}
        placeholder="e.g. 1 500"
        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600
                   rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100
                   placeholder:text-gray-400 dark:placeholder:text-gray-500
                   focus:outline-none focus:ring-2 focus:ring-svea-green/30 focus:border-svea-green
                   transition mb-2"
      />

      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">0</span>
        <input
          type="range"
          min={0}
          max={5000}
          step={50}
          value={bill}
          onChange={handleSliderChange}
          aria-label="Monthly bill slider"
        />
        <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">5k</span>
      </div>

      <div aria-live="polite" className="flex-1">
        {bill > 0 && (
          <>
            <div className="grid grid-cols-3 gap-2 animate-fade-in-up">
              <div className="bg-gray-50 dark:bg-gray-700/60 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-600">
                <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide mb-0.5">
                  Current bill
                </div>
                <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{bill.toLocaleString('sv-SE')}</div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500">kr/mo</div>
              </div>

              <div className="rounded-xl p-3 text-center border border-svea-green/20 bg-svea-green/5 dark:bg-svea-green/10">
                <div className="text-[10px] text-svea-green font-medium uppercase tracking-wide mb-0.5">
                  You save
                </div>
                <div className="text-base sm:text-lg font-bold text-svea-green">{savings.toLocaleString('sv-SE')}</div>
                <div className="text-[10px] text-svea-green/70">kr/mo</div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/60 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-600">
                <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide mb-0.5">
                  After solar
                </div>
                <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{afterSolar.toLocaleString('sv-SE')}</div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500">kr/mo</div>
              </div>
            </div>

            <div className="mt-3 animate-fade-in-up-delay">
              <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mb-1.5">
                <span>Bill breakdown</span>
                <span className="font-medium text-svea-green">{pct}% savings</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <div
                  className="bg-svea-green h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <div className="mt-3 flex justify-center animate-fade-in-up-delay-2">
              <span className="inline-flex items-center gap-1.5 bg-svea-green/10 text-svea-green
                               text-xs font-semibold px-3 py-1.5 rounded-full">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                {annualSavings.toLocaleString('sv-SE')} kr/year
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
