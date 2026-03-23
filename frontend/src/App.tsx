import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import QuoteFormPage from './pages/QuoteFormPage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<QuoteFormPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
