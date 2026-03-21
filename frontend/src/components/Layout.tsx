import { Link, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-amber-500 text-white px-6 py-4 flex items-center gap-8 shadow">
        <span className="font-bold text-lg tracking-tight">☀️ SolarQuote</span>
        <Link to="/" className="hover:underline text-sm font-medium">Get a Quote</Link>
        <Link to="/dashboard" className="hover:underline text-sm font-medium">Dashboard</Link>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
