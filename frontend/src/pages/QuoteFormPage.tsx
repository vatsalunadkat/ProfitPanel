import { useState } from 'react'
import SavingsCalculator from '../components/SavingsCalculator'

export default function QuoteFormPage() {
  const [_monthlyBill, setMonthlyBill] = useState(0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Get your solar quote</h1>
        <p className="text-gray-500 mt-1">Find out how much you could save by switching to solar.</p>
      </div>
      <SavingsCalculator onBillChange={setMonthlyBill} />
      {/* Lead Capture Form will go here in FE-04 */}
    </div>
  )
}
