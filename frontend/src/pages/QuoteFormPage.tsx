import { useState } from 'react'
import SavingsCalculator from '../components/SavingsCalculator'
import LeadCaptureForm from '../components/LeadCaptureForm'

export default function QuoteFormPage() {
  const [monthlyBill, setMonthlyBill] = useState(0)

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl p-8 text-white">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-75 mb-2">Go solar today</p>
        <h1 className="text-3xl font-bold mb-2">How much could you save?</h1>
        <p className="text-amber-100 text-sm">
          Swedish households save an average of 30% on electricity after installing solar panels.
        </p>
      </div>
      <SavingsCalculator onBillChange={setMonthlyBill} />
      <LeadCaptureForm initialBill={monthlyBill} />
    </div>
  )
}
