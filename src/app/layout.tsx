// app/layout.tsx
import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Каталог Монет Австро-Угорської Імперії | Baron Coin',
  description:
    'Повний нумізматичний каталог монет Австро-Угорської Монархії (1867–1918). Перегляд, пошук та фільтрація за рідкісністю, металом та роками карбування.',
  keywords: ['нумізматика', 'монети', 'Австро-Угорщина', 'колекціонування', 'флорин', 'крона', 'крейцер'],
  openGraph: {
    title: 'Каталог Монет Австро-Угорської Імперії',
    description: 'Нумізматичний каталог монет 1867–1918',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <head>
        {/* Google Analytics (GA4) */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=G-3CQCDWD9Q2`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-3CQCDWD9Q2');
            `,
          }}
        />
      </head>
      <body className="bg-parchment">{children}</body>
    </html>
  );
}
