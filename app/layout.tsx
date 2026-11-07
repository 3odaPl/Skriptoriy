import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Скрипторий — скрипты и расширения для игр со стримов', template: '%s · Скрипторий' },
  description: 'Каталог userscript-ов и расширений для игр на стримах: установка в один клик, автообновления, проверка модераторами.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap"
        />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <footer className="site-footer">
          <div className="container inner">
            <span className="display" style={{ color: 'var(--text)', fontSize: 15 }}>Скрипторий</span>
            <span className="grow" />
            <Link href="/rules">Правила публикации</Link>
            <span>Неофициальный фан-проект</span>
          </div>
        </footer>
      </body>
    </html>
  )
}
