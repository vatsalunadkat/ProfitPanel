import { NavLink, Outlet } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `text-sm font-medium px-1 py-1 border-b-2 transition-colors ${
          isActive
            ? 'border-svea-green text-gray-900 dark:text-white'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`
      }
    >
      {children}
    </NavLink>
  )
}

export default function Layout() {
  return (
    <div className="h-screen bg-svea-bg dark:bg-gray-900 flex flex-col overflow-auto transition-colors duration-200">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 sm:px-6 lg:px-8 shrink-0 transition-colors duration-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14">
          <NavLink to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <img
              src={import.meta.env.BASE_URL + 'svea_solar_logo.jpg'}
              alt="Svea Solar"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="font-semibold text-lg text-gray-900 dark:text-white tracking-tight">
              Svea Solar
            </span>
          </NavLink>
          <div className="flex items-center gap-6">
            <NavItem to="/">Get a Quote</NavItem>
            <NavItem to="/dashboard">Dashboard</NavItem>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 min-h-0">
        <Outlet />
      </main>

      <footer className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 shrink-0 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] text-gray-400 dark:text-gray-500">
          <span>&copy; {new Date().getFullYear()} Svea Solar</span>
          <span>Solar quote platform</span>
        </div>
      </footer>
    </div>
  )
}
