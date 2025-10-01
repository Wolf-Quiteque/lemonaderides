import './globals.css'
import { ThemeProvider } from '../components/theme-provider'
import RealtimeNotifications from '../components/RealtimeNotifications'

export const metadata = {
  title: 'RideShare',
  description: 'Carpooling App',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
      </head>
      <body className="bg-background text-foreground">
        <ThemeProvider>
          <RealtimeNotifications />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
