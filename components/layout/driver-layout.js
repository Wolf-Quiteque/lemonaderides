// components/layout/driver-layout.js
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '../theme-provider';
import { LayoutDashboard, Car, User, Sun, Moon, Briefcase, Users, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/driver/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/driver/schedule', label: 'Schedule', icon: Car },
  { href: '/driver/claims', label: 'Claims', icon: Briefcase },
  { href: '/driver/pools', label: 'Pools', icon: Users },
  { href: '/profile', label: 'Profile', icon: User },
];

export function DriverLayout({ children }) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:h-full md:w-64 md:border-r md:border-gray-200 dark:md:border-gray-800 bg-white dark:bg-gray-900 sticky top-0">
        <div className="flex items-center justify-center h-20 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <Car className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                RideShare
              </h1>
              <p className="text-xs text-gray-500">Driver Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavButton key={item.href} href={item.href} label={item.label} active={pathname?.startsWith(item.href)} isDesktop>
              <item.icon className="h-5 w-5" />
            </NavButton>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 text-left py-3 px-4 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="md:ml-64">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 safe-top shadow-sm md:hidden">
          <div className="container py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                  <Car className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    RideShare
                  </h1>
                  <p className="text-[10px] text-gray-500">Driver Portal</p>
                </div>
              </div>
              <button
                aria-label="Toggle theme"
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {theme === 'light' ? <Sun className="h-5 w-5 text-amber-600" /> : <Moon className="h-5 w-5 text-indigo-600" />}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container py-6 pb-28 md:pb-6 max-w-5xl mx-auto">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 safe-bottom shadow-lg z-50 md:hidden">
          <div className="container">
            <div className="flex justify-around items-center py-2">
              {navItems.map((item) => (
                <NavButton key={item.href} href={item.href} label={item.label} active={pathname?.startsWith(item.href)}>
                  <item.icon className="h-5 w-5" />
                </NavButton>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}

function NavButton({ href, label, active, children, isDesktop = false }) {
  if (isDesktop) {
    return (
      <Link
        href={href}
        className={`flex items-center space-x-3 py-3 px-4 rounded-lg transition-colors ${
          active
            ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-semibold'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        {children}
        <span className="font-medium">{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`flex flex-col items-center space-y-1 transition-all py-2 px-3 rounded-xl ${
        active
          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      <div className={`transition-transform ${active ? 'scale-110' : ''}`}>{children}</div>
      <span className={`text-xs font-medium ${active ? 'font-semibold' : ''}`}>{label}</span>
    </Link>
  );
}
