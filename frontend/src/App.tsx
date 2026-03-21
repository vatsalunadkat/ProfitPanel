import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import QuoteFormPage from './pages/QuoteFormPage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  return (
    <BrowserRouter basename="/ProfitPanel">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<QuoteFormPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
