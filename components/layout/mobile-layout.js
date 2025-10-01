// components/layout/mobile-layout.js
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '../theme-provider';
import { Home, Car, Calendar, User, Sun, Moon, Plus } from 'lucide-react';

export function MobileLayout({ children }) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 safe-top shadow-sm">
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
                <p className="text-[10px] text-gray-500">Your Journey Matters</p>
              </div>
            </div>

            <button
              aria-label="Toggle theme"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {theme === 'light' ? (
                <Sun className="h-5 w-5 text-amber-600" />
              ) : (
                <Moon className="h-5 w-5 text-indigo-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-4 pb-28">
        {children}
      </main>

      {/* Floating Action Button */}
      <Link
        href="/rides/new"
        className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all active:scale-95"
      >
        <Plus className="h-6 w-6 text-white" />
      </Link>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 safe-bottom shadow-lg z-50">
        <div className="container">
          <div className="flex justify-around items-center py-2">
            <NavButton 
              href="/dashboard" 
              label="Home" 
              active={pathname?.startsWith('/dashboard') || pathname === '/'}
            >
              <Home className="h-5 w-5" />
            </NavButton>
            
            <NavButton 
              href="/rides" 
              label="Rides" 
              active={pathname === '/rides' || (pathname?.startsWith('/rides/') && !pathname?.includes('/new'))}
            >
              <Car className="h-5 w-5" />
            </NavButton>
            
            {/* Center placeholder for FAB */}
            <div className="w-14 h-14" />
            
            <NavButton 
              href="/schedule" 
              label="Schedule" 
              active={pathname?.startsWith('/schedule')}
            >
              <Calendar className="h-5 w-5" />
            </NavButton>
            
            <NavButton 
              href="/profile" 
              label="Profile" 
              active={pathname?.startsWith('/profile')}
            >
              <User className="h-5 w-5" />
            </NavButton>
          </div>
        </div>
      </nav>
    </div>
  );
}

function NavButton({ href, label, active, children }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center space-y-1 transition-all py-2 px-3 rounded-xl ${
        active 
          ? 'text-blue-600 bg-blue-50' 
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      <div className={`transition-transform ${active ? 'scale-110' : ''}`}>
        {children}
      </div>
      <span className={`text-xs font-medium ${active ? 'font-semibold' : ''}`}>
        {label}
      </span>
    </Link>
  );
}
