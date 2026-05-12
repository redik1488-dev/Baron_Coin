'use client';

import React, { useEffect, useState } from 'react';
import { CoinType } from '@/types/coin';
import Image from 'next/image';
import { X, Calendar, Droplets, Weight, Expand, Layers } from 'lucide-react';

interface CoinModalProps {
  coin: CoinType | null;
  onClose: () => void;
}

interface Issue {
  id: number;
  year: number;
  gregorian_year: number;
  mintage: number | null;
  comment?: string;
}

export default function CoinModal({ coin, onClose }: CoinModalProps) {
  const [issues, setIssues]             = useState<Issue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(false);

  useEffect(() => {
    if (!coin) { setIssues([]); return; }

    setLoadingIssues(true);
    fetch(`/api/coins/issues?id=${coin.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const validIssues = data
            .filter(i => i.year || i.gregorian_year)
            .sort((a, b) => (a.year || a.gregorian_year || 0) - (b.year || b.gregorian_year || 0));
          setIssues(validIssues);
        } else {
          setIssues([]);
        }
      })
      .catch(err => { console.error('Failed to load issues', err); setIssues([]); })
      .finally(() => setLoadingIssues(false));
  }, [coin]);

  if (!coin) return null;

  const obverseSrc = coin.obverse_thumbnail || coin.image?.obverse;
  const reverseSrc = coin.reverse_thumbnail || coin.image?.reverse;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-stone-50 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-stone-200/50 hover:bg-stone-200 rounded-full transition-colors z-20"
        >
          <X size={20} className="text-stone-600" />
        </button>

        {/* Header / Images */}
        <div className="bg-dark-wood p-8 rounded-t-3xl text-center relative overflow-hidden border-b-4 border-amber-600">
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at center, #fbbf24 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          />
          <h2 className="text-2xl sm:text-3xl font-cinzel text-imperial-gold font-bold mb-6 relative z-10 tracking-widest uppercase">
            {coin.title}
          </h2>

          {(obverseSrc || reverseSrc) && (
            <div className="flex justify-center items-center gap-4 sm:gap-8 relative z-10">
              {obverseSrc && (
                <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full overflow-hidden border-4 border-amber-500/30 shadow-2xl bg-stone-800">
                  <Image src={obverseSrc} alt={`Аверс – ${coin.title}`} width={200} height={200} className="object-cover w-full h-full" unoptimized />
                </div>
              )}
              {reverseSrc && reverseSrc !== obverseSrc && (
                <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full overflow-hidden border-4 border-amber-500/30 shadow-2xl bg-stone-800">
                  <Image src={reverseSrc} alt={`Реверс – ${coin.title}`} width={200} height={200} className="object-cover w-full h-full" unoptimized />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Details Grid */}
        <div className="p-6 sm:p-8 space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/80 backdrop-blur p-4 rounded-2xl border border-amber-200 shadow-sm text-center">
              <Calendar className="w-5 h-5 mx-auto text-amber-700 mb-2" />
              <p className="text-xs text-stone-500 uppercase tracking-wider font-bold">Період</p>
              <p className="font-bold text-stone-800 text-sm mt-1">
                {coin.min_year === coin.max_year
                  ? coin.min_year
                  : `${coin.min_year} - ${coin.max_year}`}
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur p-4 rounded-2xl border border-amber-200 shadow-sm text-center">
              <Droplets className="w-5 h-5 mx-auto text-amber-700 mb-2" />
              <p className="text-xs text-stone-500 uppercase tracking-wider font-bold">Сплав</p>
              <p className="font-bold text-stone-800 text-sm mt-1 line-clamp-2" title={coin.composition}>
                {coin.composition || '—'}
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur p-4 rounded-2xl border border-amber-200 shadow-sm text-center">
              <Weight className="w-5 h-5 mx-auto text-amber-700 mb-2" />
              <p className="text-xs text-stone-500 uppercase tracking-wider font-bold">Вага</p>
              <p className="font-bold text-stone-800 text-sm mt-1">
                {coin.weight ? `${coin.weight} г` : '—'}
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur p-4 rounded-2xl border border-amber-200 shadow-sm text-center">
              <Expand className="w-5 h-5 mx-auto text-amber-700 mb-2" />
              <p className="text-xs text-stone-500 uppercase tracking-wider font-bold">Розмір</p>
              <p className="font-bold text-stone-800 text-sm mt-1">
                {coin.size ? `${coin.size} мм` : '—'}
              </p>
            </div>
          </div>

          {/* Extra info row */}
          {(coin.shape || coin.edge) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {coin.shape && (
                <div className="bg-white/60 p-4 rounded-xl border border-amber-100">
                  <p className="text-[10px] text-stone-400 uppercase font-bold tracking-tighter mb-1">Форма</p>
                  <p className="text-sm font-semibold text-stone-700">{coin.shape}</p>
                </div>
              )}
              {coin.edge && (
                <div className="bg-white/60 p-4 rounded-xl border border-amber-100">
                  <p className="text-[10px] text-stone-400 uppercase font-bold tracking-tighter mb-1">Гурт</p>
                  <p className="text-sm font-semibold text-stone-700">{coin.edge}</p>
                </div>
              )}
            </div>
          )}

          {/* Issues (Years) List */}
          <div>
            <h3 className="flex items-center gap-2 font-cinzel text-xl font-bold text-amber-900 mb-4 border-b-2 border-amber-300 pb-2 uppercase tracking-widest">
              <Layers className="w-6 h-6 text-amber-700" />
              Різновиди за роками
            </h3>

            {loadingIssues ? (
              <div className="text-center py-12 text-stone-500">
                <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Завантаження з архіву...
              </div>
            ) : issues.length > 0 ? (
              <div className="bg-white/90 backdrop-blur rounded-2xl border border-amber-200 overflow-hidden shadow-md">
                <table className="w-full text-left text-sm">
                  <thead className="bg-amber-100/50 text-amber-900 border-b border-amber-200">
                    <tr>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider">Рік карбування</th>
                      <th className="px-6 py-4 font-bold text-right uppercase tracking-wider">Тираж (шт)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {issues.map((issue, idx) => (
                      <tr key={issue.id || idx} className="hover:bg-amber-50 transition-colors">
                        <td className="px-6 py-3 font-semibold text-stone-800 text-base">
                          {issue.year || issue.gregorian_year}
                          {issue.comment && (
                            <span className="text-xs text-stone-400 font-normal ml-2 block sm:inline">
                              {issue.comment}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right font-medium text-amber-800">
                          {issue.mintage ? issue.mintage.toLocaleString('uk-UA') : 'Невідомо'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur p-8 rounded-2xl border border-dashed border-amber-300 text-center text-stone-500">
                Детальна інформація по роках відсутня.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
