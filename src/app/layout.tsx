import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Login and Tweet',
  description: 'A simple social media app'
}

export default function RootLayout ({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-neutral-100`}>
        {children}
      </body>
    </html>
  )
}
