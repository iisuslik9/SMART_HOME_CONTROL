import './globals.css'

export const metadata = {
  title: 'Умный дом',
  description: 'NodeMCU + Supabase + Vercel',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
