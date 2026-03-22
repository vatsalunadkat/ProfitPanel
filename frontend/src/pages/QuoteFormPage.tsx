import { useState } from 'react'
import SavingsCalculator from '../components/SavingsCalculator'
import LeadCaptureForm from '../components/LeadCaptureForm'

const DEFAULT_BILL = 500

export default function QuoteFormPage() {
  const [monthlyBill, setMonthlyBill] = useState(DEFAULT_BILL)

  return (
    <div className="flex flex-col gap-5 lg:gap-4">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-svea-green/10 text-svea-green text-xs font-semibold
                        uppercase tracking-widest px-3 py-1 rounded-full mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-svea-green" />
          Solar savings calculator
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 leading-tight tracking-tight">
          See how much you could save
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
          Swedish households save an average of 30&nbsp;% on electricity after
          installing solar panels. Enter your bill below to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-4">
        <SavingsCalculator defaultBill={DEFAULT_BILL} onBillChange={setMonthlyBill} />
        <LeadCaptureForm initialBill={monthlyBill} />
      </div>
    </div>
  )
}
