import { Link, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-amber-500 text-white px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-4 sm:gap-8 shadow">
        <span className="font-bold text-base sm:text-lg tracking-tight">
          <span role="img" aria-label="Sun">☀️</span> SolarQuote
        </span>
        <Link to="/" className="hover:underline text-xs sm:text-sm font-medium transition-colors hover:text-amber-100">
          Get a Quote
        </Link>
        <Link to="/dashboard" className="hover:underline text-xs sm:text-sm font-medium transition-colors hover:text-amber-100">
          Dashboard
        </Link>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}
