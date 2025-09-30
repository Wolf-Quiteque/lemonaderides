// components/layout/mobile-layout.js
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '../theme-provider';
import { Home, Car, Calendar, User, Sun, Moon } from 'lucide-react';

export function MobileLayout({ children }) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border safe-top">
        <div className="container py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">R</span>
              </div>
              <h1 className="text-xl font-bold">RideShare</h1>
            </div>

            <button
              aria-label="Toggle theme"
              onClick={toggleTheme}
              className="p-2 rounded-full bg-muted hover:bg-border"
            >
              {theme === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-4 pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom">
        <div className="container">
          <div className="flex justify-around py-2">
            <NavButton href="/dashboard" label="Home" active={pathname?.startsWith('/dashboard')}>
              <Home className="h-5 w-5" />
            </NavButton>
            <NavButton href="/rides" label="Rides" active={pathname === '/rides' || pathname?.startsWith('/rides/')}>
              <Car className="h-5 w-5" />
            </NavButton>
            <NavButton href="/rides/new" label="Schedule" active={pathname?.startsWith('/schedule')}>
              <Calendar className="h-5 w-5" />
            </NavButton>
            <NavButton href="/profile" label="Profile" active={pathname?.startsWith('/profile')}>
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
      className={`flex flex-col items-center space-y-1 transition-colors ${
        active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
      <span className="text-xs">{label}</span>
    </Link>
  );
}
