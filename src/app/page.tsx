// app/page.tsx — Головна сторінка
'use client';

import React, { useState } from 'react';
import CoinGrid from '@/components/CoinGrid';
import { useCoinCatalog } from '@/hooks/useCoinCatalog';
import { RefreshCw, Database, AlertCircle, Crown, Loader2 } from 'lucide-react';

// ─── Loading Skeleton ──────────────────────────────────────────────────────────
function CoinSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-amber-100 shadow-coin">
      <div className="h-1 w-full bg-amber-100" />
      <div className="flex flex-col items-center pt-6 pb-4 px-4 bg-gradient-to-b from-stone-50 to-amber-50/30">
        <div className="w-36 h-36 rounded-full bg-amber-100 animate-pulse" />
      </div>
      <div className="px-5 pb-5 pt-2 space-y-3">
        <div className="h-5 w-3/4 rounded bg-amber-100 animate-pulse" />
        <div className="h-4 w-1/2 rounded bg-amber-50 animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-amber-50 animate-pulse" />
          <div className="h-3 w-4/5 rounded bg-amber-50 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ─── Header ────────────────────────────────────────────────────────────────────
function Header({ onRefresh, loading, source }: { onRefresh: () => void; loading: boolean; source: 'cache' | 'api' | null }) {
  return (
    <header className="relative overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #2c1810 0%, #4a2c1a 60%, #6b3d28 100%)',
        }}
      />
      {/* Decorative pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4aa3a' fill-opacity='1'%3E%3Ccircle cx='20' cy='20' r='1.5'/%3E%3Ccircle cx='0' cy='0' r='1'/%3E%3Ccircle cx='40' cy='0' r='1'/%3E%3Ccircle cx='0' cy='40' r='1'/%3E%3Ccircle cx='40' cy='40' r='1'/%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Crown icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-amber-900/50 border border-amber-600/50 flex items-center justify-center backdrop-blur-sm">
            <Crown size={28} className="text-amber-400" />
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-center font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-wide mb-2"
          style={{ color: '#d4aa3a' }}
        >
          КАТАЛОГ МОНЕТ
        </h1>
        <p
          className="text-center font-serif text-lg sm:text-xl italic mb-1"
          style={{ color: '#eac68a' }}
        >
          Австро-Угорської Монархії
        </p>
        <p className="text-center text-amber-200/60 text-sm mb-6">
          1867 – 1918 · Нумізматичний архів
        </p>

        {/* Ornament divider */}
        <div className="ornament-divider max-w-sm mx-auto mb-6">
          <span style={{ color: '#d4aa3a', fontSize: '20px' }}>❧</span>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {source && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-900/40 border border-amber-700/40 text-amber-300 text-xs">
              <Database size={11} />
              {source === 'cache' ? 'З кешу Firestore' : 'З Numista API'}
            </div>
          )}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-700/30 border border-amber-600/40
                       text-amber-300 text-xs font-medium hover:bg-amber-700/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            Оновити з API
          </button>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="relative z-10">
        <svg viewBox="0 0 1440 40" className="w-full" style={{ display: 'block', marginBottom: '-1px' }}>
          <path
            d="M0,20 C240,40 480,0 720,20 C960,40 1200,0 1440,20 L1440,40 L0,40 Z"
            fill="#fdf8f0"
          />
        </svg>
      </div>
    </header>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { coins, rulerCounts, loading, error, source, refresh } = useCoinCatalog();

  return (
    <div className="min-h-screen bg-parchment">
      <Header onRefresh={refresh} loading={loading} source={source} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 mb-6">
            <AlertCircle size={18} className="shrink-0" />
            <div>
              <p className="font-medium text-sm">Помилка завантаження</p>
              <p className="text-xs mt-0.5 opacity-75">{error}</p>
            </div>
            <button
              onClick={refresh}
              className="ml-auto text-xs underline hover:no-underline"
            >
              Повторити
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div>
            <div className="flex items-center justify-center gap-3 py-8 text-amber-700">
              <Loader2 size={20} className="animate-spin" />
              <span className="font-medium">Завантаження каталогу монет…</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <CoinSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : (
          <CoinGrid coins={coins} externalRulerCounts={rulerCounts} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-100 py-6 text-center">
        <p className="text-sm text-stone-400 font-serif italic">
          Дані надані{' '}
          <a href="https://en.numista.com" target="_blank" rel="noopener noreferrer"
             className="text-amber-700 hover:underline">
            Numista
          </a>{' '}
          · Кешовано у{' '}
          <span className="text-amber-700">Firebase Firestore</span>
        </p>
        <p className="text-xs text-stone-300 mt-1">Baron Coin © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
