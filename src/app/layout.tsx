// app/layout.tsx
import type { Metadata } from 'next';
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
      <body className="bg-parchment">{children}</body>
    </html>
  );
}
