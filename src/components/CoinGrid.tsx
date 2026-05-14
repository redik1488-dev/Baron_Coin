'use client';

import React, { useState, useMemo } from 'react';
import { CoinType } from '@/types/coin';
import Image from 'next/image';
import { ArrowLeft, Search, Lock, Download, X } from 'lucide-react';
import CoinModal from './CoinModal';

interface CoinGridProps {
  coins: CoinType[];
  externalRulerCounts?: Record<string, number> | null;
}

interface RulerDef {
  id: string;
  name: string;
  reign: string;
  img: string;
}

const RULERS_AH: RulerDef[] = [
  { id: 'Франц II (1792–1835)', name: 'Francis II', reign: '1792-1835', img: '/rulers/francis_ii.webp' },
  { id: 'Фердинанд I (1835–1848)', name: 'Ferdinand I', reign: '1835-1848', img: '/rulers/ferdinand_i.webp' },
  { id: 'Франц Йосиф I (1848–1916)', name: 'Franz Joseph I', reign: '1848-1916', img: '/rulers/franz_joseph.webp' },
  { id: 'Карл I (1916–1918)', name: 'Charles I', reign: '1916-1918', img: '/rulers/karl_i.webp' },
];

const RULERS_HABSBURG: RulerDef[] = [
  { id: 'Фердинанд I Габсбург (1526–1564)', name: 'Ferdinand I', reign: '1526-1564', img: '/rulers/ferdinand_i_habsburg.webp' },
  { id: 'Максиміліан II (1564–1576)', name: 'Maximilian II', reign: '1564-1576', img: '/rulers/maximilian_ii.webp' },
  { id: 'Рудольф II (1576–1612)', name: 'Rudolf II', reign: '1576-1612', img: '/rulers/rudolf_ii.webp' },
  { id: 'Матіас (1612–1619)', name: 'Matthias', reign: '1612-1619', img: '/rulers/matthias.webp' },
  { id: 'Фердинанд II (1619–1637)', name: 'Ferdinand II', reign: '1619-1637', img: '/rulers/ferdinand_ii.webp' },
  { id: 'Фердинанд III (1637–1657)', name: 'Ferdinand III', reign: '1637-1657', img: '/rulers/ferdinand_iii.webp' },
  { id: 'Леопольд I (1657–1705)', name: 'Leopold I', reign: '1657-1705', img: '/rulers/leopold_i_habsburg.webp' },
  { id: 'Йосип I (1705–1711)', name: 'Joseph I', reign: '1705-1711', img: '/rulers/joseph_i.webp' },
  { id: 'Карл VI (1711–1740)', name: 'Charles VI', reign: '1711-1740', img: '/rulers/charles_vi.webp' },
  { id: 'Марія Терезія (1740–1780)', name: 'Maria Theresa', reign: '1740-1780', img: '/rulers/maria_theresa.webp' },
  { id: 'Йосип II (1780–1790)', name: 'Joseph II', reign: '1780-1790', img: '/rulers/joseph_ii.webp' },
  { id: 'Леопольд II (1790–1792)', name: 'Leopold II', reign: '1790-1792', img: '/rulers/leopold_ii_habsburg.webp' },
];

const ALL_RULERS = [...RULERS_HABSBURG, ...RULERS_AH];


function extractCurrency(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('kreuzer') || t.includes('kreutzer')) return 'Kreuzer';
  if (t.includes('heller')) return 'Heller';
  if (t.includes('filler') || t.includes('fillér')) return 'Filler';
  if (t.includes('florin')) return 'Florin';
  if (t.includes('forint')) return 'Forint';
  if (t.includes('corona') || t.includes('krone') || t.includes('kronen') || t.includes('korona')) return 'Corona / Krone';
  if (t.includes('thaler') || t.includes('taler')) return 'Thaler';
  if (t.includes('ducat') || t.includes('dukat')) return 'Ducat';
  if (t.includes('gulden')) return 'Gulden';
  if (t.includes('pfennig')) return 'Pfennig';
  if (t.includes('sovrano')) return 'Sovrano';
  return 'Інше';
}

function parseNominalValue(title: string): number {
  const matchFraction = title.match(/^(\d+)\/(\d+)/);
  if (matchFraction) {
    return parseInt(matchFraction[1]) / parseInt(matchFraction[2]);
  }
  const matchNum = title.match(/^(\d+[\.,]?\d*)/);
  if (matchNum) {
    return parseFloat(matchNum[1].replace(',', '.'));
  }
  return 0;
}

export default function CoinGrid({ coins, externalRulerCounts }: CoinGridProps) {
  const [selectedRuler, setSelectedRuler] = useState<string | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<CoinType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [exportData, setExportData] = useState<string | null>(null);

  const rulerCounts = useMemo(() => {
    if (externalRulerCounts) return externalRulerCounts;
    
    const counts: Record<string, number> = {};
    coins.forEach(c => {
      if (c.ruler) counts[c.ruler] = (counts[c.ruler] || 0) + 1;
    });
    return counts;
  }, [coins, externalRulerCounts]);

  const groupedAndFilteredCoins = useMemo(() => {
    if (!selectedRuler) return {};

    let result = coins.filter(c => c.ruler === selectedRuler);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        (c.title || '').toLowerCase().includes(q) ||
        (c.composition || '').toLowerCase().includes(q)
      );
    }

    const groups: Record<string, CoinType[]> = {};
    result.forEach(coin => {
      const currency = extractCurrency(coin.title || '');
      if (!groups[currency]) groups[currency] = [];
      groups[currency].push(coin);
    });

    for (const key in groups) {
      groups[key].sort((a, b) => {
        const valA = typeof a.value?.numeric === 'number' ? a.value.numeric : parseNominalValue(a.title || '');
        const valB = typeof b.value?.numeric === 'number' ? b.value.numeric : parseNominalValue(b.title || '');
        if (valA !== valB) return valA - valB;
        return (a.min_year || 0) - (b.min_year || 0);
      });
    }

    return groups;
  }, [coins, selectedRuler, searchQuery]);

  const handleExport = () => {
    if (!selectedRuler) return;

    let text = `Продаж монет епохи: ${selectedRuler}\n\n`;
    const groups = groupedAndFilteredCoins;
    const sortedKeys = Object.keys(groups).sort();

    sortedKeys.forEach(currency => {
      text += `=== ${currency.toUpperCase()} ===\n`;
      groups[currency].forEach(coin => {
        const yearStr = coin.min_year === coin.max_year
          ? String(coin.min_year)
          : `${coin.min_year}-${coin.max_year}`;
        const material = coin.composition || 'Невідомий метал';
        text += `<strong>${coin.title}</strong> - ${material} - ${yearStr}\n`;
      });
      text += `\n`;
    });

    text += `Всі монети оригінальні. Деталі та додаткові фото в особисті повідомлення.`;
    setExportData(text);
  };

  if (!selectedRuler) {
    const RulerCard = ({ ruler }: { ruler: RulerDef }) => {
      const count = rulerCounts[ruler.id] || 0;
      const isLocked = count === 0;
      return (
        <div
          onClick={() => !isLocked && setSelectedRuler(ruler.id)}
          className={`flex flex-col items-center group ${isLocked ? 'cursor-not-allowed opacity-50 grayscale' : 'cursor-pointer'}`}
        >
          <div className="relative w-28 h-36 md:w-32 md:h-40 mb-3 transition-transform duration-500 group-hover:scale-105">
            <div className="absolute inset-0 rounded-t-full rounded-b-full border-[5px] border-amber-600/30 overflow-hidden shadow-2xl">
              <div className="absolute inset-0 rounded-t-full rounded-b-full border-4 border-amber-400 overflow-hidden m-1 bg-stone-800">
                <Image src={ruler.img} alt={ruler.name} fill className="object-cover object-[center_15%]" />
              </div>
            </div>
            {isLocked && (
              <div className="absolute top-0 right-0 bg-stone-800 text-stone-200 p-1.5 rounded-full shadow-lg border border-stone-600 z-10">
                <Lock size={13} />
              </div>
            )}
            {!isLocked && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-800 text-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400 shadow-md whitespace-nowrap">
                {count} монет
              </div>
            )}
          </div>
          <h3 className={`font-cinzel text-sm font-bold text-center mt-1 ${isLocked ? 'text-stone-400' : 'text-amber-700'}`}>
            {ruler.name}
          </h3>
          <p className="text-[10px] text-stone-400 font-medium">{ruler.reign}</p>
        </div>
      );
    };

    return (
      <div className="py-8 space-y-16">
        {/* === Австрійська монархія Габсбургів === */}
        <section>
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-600 mb-1">Österreich</p>
            <h2 className="text-2xl md:text-3xl font-cinzel text-amber-900 uppercase tracking-widest font-bold">
              Austrian Monarchy
            </h2>
            <p className="text-stone-500 text-sm mt-1">Habsburg Archdukes & Holy Roman Emperors</p>
            <div className="h-px w-48 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6 max-w-5xl mx-auto">
            {RULERS_HABSBURG.map(ruler => <RulerCard key={ruler.id} ruler={ruler} />)}
          </div>
        </section>

        {/* === Австро-Угорська монархія === */}
        <section>
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-600 mb-1">Österreich-Ungarn</p>
            <h2 className="text-2xl md:text-3xl font-cinzel text-amber-900 uppercase tracking-widest font-bold">
              Austro-Hungarian Empire
            </h2>
            <p className="text-stone-500 text-sm mt-1">Emperors of Austria & Kings of Hungary</p>
            <div className="h-px w-48 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {RULERS_AH.map(ruler => <RulerCard key={ruler.id} ruler={ruler} />)}
          </div>
        </section>
      </div>
    );
  }

  const activeRuler = ALL_RULERS.find(r => r.id === selectedRuler);

  const groupKeys = Object.keys(groupedAndFilteredCoins).sort();
  const totalCoins = groupKeys.reduce((acc, key) => acc + groupedAndFilteredCoins[key].length, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 bg-dark-wood p-4 rounded-t-2xl shadow-xl border-b-4 border-amber-600 relative overflow-hidden">
        <button
          onClick={() => { setSelectedRuler(null); setExportData(null); }}
          className="text-amber-200 hover:text-white transition-colors bg-white/10 p-2 rounded-full relative z-10"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="flex-1 text-center relative z-10">
          <h2 className="text-2xl font-cinzel text-imperial-gold font-bold uppercase tracking-widest">
            {activeRuler?.name}
          </h2>
          <p className="text-amber-200/70 text-sm">{activeRuler?.reign}</p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-medium shadow-md transition-colors relative z-10 text-sm"
        >
          <Download size={18} />
          Експорт
        </button>
      </div>

      {/* Export Textarea */}
      {exportData && (
        <div className="bg-white p-4 rounded-xl border border-stone-300 shadow-sm relative">
          <button
            onClick={() => setExportData(null)}
            className="absolute top-2 right-2 text-stone-400 hover:text-stone-600"
          >
            <X size={18} />
          </button>
          <p className="text-sm font-semibold text-stone-700 mb-2">Опис для OLX (скопіюйте текст нижче):</p>
          <textarea
            readOnly
            value={exportData}
            className="w-full h-48 p-3 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-800 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <p className="text-xs text-amber-600 mt-2 font-medium bg-amber-50 inline-block px-2 py-1 rounded">
            HTML теги &lt;strong&gt; підтримуються OLX для виділення тексту жирним шрифтом.
          </p>
        </div>
      )}

      {/* Search & Stats */}
      <div className="flex items-center gap-4 px-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Пошук (напр. 10 Heller)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 shadow-sm
                       bg-white text-stone-700 placeholder-stone-400
                       focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        </div>
        <div className="bg-amber-100 text-amber-900 px-4 py-3 rounded-xl font-medium text-sm border border-amber-200 shadow-sm whitespace-nowrap">
          Всього: {totalCoins}
        </div>
      </div>

      {/* Grouped List */}
      <div className="space-y-8">
        {groupKeys.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-stone-400 shadow-sm border border-stone-200">
            <p>Монет не знайдено</p>
          </div>
        ) : (
          groupKeys.map(currency => (
            <div key={currency} className="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden">
              {/* Group Header */}
              <div className="bg-stone-100 px-6 py-3 border-b border-stone-200 flex justify-between items-center">
                <h3 className="font-cinzel text-lg font-bold text-amber-900 uppercase tracking-widest">{currency}</h3>
                <span className="bg-stone-200 text-stone-600 text-xs px-2 py-1 rounded-md font-bold">
                  {groupedAndFilteredCoins[currency].length}
                </span>
              </div>

              {/* Group Items */}
              <div className="divide-y divide-stone-100">
                {groupedAndFilteredCoins[currency].map((coin) => {
                  const obverseSrc = coin.obverse_thumbnail || coin.image?.obverse;
                  const reverseSrc = coin.reverse_thumbnail || coin.image?.reverse;

                  return (
                    <div
                      key={coin.id}
                      onClick={() => setSelectedCoin(coin)}
                      className="flex items-center p-4 hover:bg-amber-50 cursor-pointer transition-colors group"
                    >
                      {/* Dual Images */}
                      <div className="flex items-center gap-1 shrink-0 mr-4 md:mr-6">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border border-stone-200 bg-stone-100 shadow-sm group-hover:border-amber-300 transition-colors relative">
                          {obverseSrc ? (
                            <Image src={obverseSrc} alt={`Аверс – ${coin.title}`} fill className="object-cover" unoptimized />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs font-serif">Аверс</div>
                          )}
                        </div>
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border border-stone-200 bg-stone-100 shadow-sm group-hover:border-amber-300 transition-colors relative -ml-3 md:-ml-4 z-10">
                          {reverseSrc ? (
                            <Image src={reverseSrc} alt={`Реверс – ${coin.title}`} fill className="object-cover" unoptimized />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs font-serif">Реверс</div>
                          )}
                        </div>
                      </div>

                      {/* Coin Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-stone-800 text-base md:text-lg truncate">
                          {coin.title}
                        </h4>
                        <p className="text-sm text-stone-500 truncate">
                          <span className="font-medium text-stone-600">{coin.composition || 'Невідомий метал'}</span>
                          {' • '}
                          {coin.min_year}
                          {coin.max_year && coin.max_year !== coin.min_year ? ` - ${coin.max_year}` : ''}
                        </p>
                      </div>

                      {/* Status / Weight */}
                      <div className="shrink-0 text-right ml-4 flex flex-col items-end gap-1">
                        <div className="bg-stone-100 px-3 py-1 rounded-md text-xs font-medium text-stone-600 border border-stone-200">
                          {coin.rarity === 'unique' ? 'Унікальна' :
                            coin.rarity === 'very_rare' ? 'Дуже Рідкісна' :
                              coin.rarity === 'rare' ? 'Рідкісна' :
                                coin.rarity === 'uncommon' ? 'Нечаста' : 'Часта'}
                        </div>
                        {coin.weight && <div className="text-xs text-stone-400">{coin.weight} г</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <CoinModal coin={selectedCoin} onClose={() => setSelectedCoin(null)} />
    </div>
  );
}
