'use client';

import React, { useState, useMemo } from 'react';
import { CoinType } from '@/types/coin';
import Image from 'next/image';
import { ArrowLeft, Search, Lock, Download } from 'lucide-react';
import CoinModal from './CoinModal';

interface CoinGridProps {
  coins: CoinType[];
}

const RULERS = [
  { id: 'Франц II (1792–1835)', name: 'Francis II', reign: '1792-1835', img: '/rulers/francis_ii.png' },
  { id: 'Фердинанд I (1835–1848)', name: 'Ferdinand I', reign: '1835-1848', img: '/rulers/ferdinand_i.png' },
  { id: 'Франц Йосиф I (1848–1916)', name: 'Franz Joseph I', reign: '1848-1916', img: '/rulers/franz_joseph.png' },
  { id: 'Карл I (1916–1918)', name: 'Charles I (Karl I)', reign: '1916-1918', img: '/rulers/karl_i.png' },
];

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
  // Намагаємось витягнути числа або дроби типу 1/4, 1/2 з початку рядка
  const matchFraction = title.match(/^(\d+)\/(\d+)/);
  if (matchFraction) {
    return parseInt(matchFraction[1]) / parseInt(matchFraction[2]);
  }
  const matchNum = title.match(/^(\d+[\.,]?\d*)/);
  if (matchNum) {
    return parseFloat(matchNum[1].replace(',', '.'));
  }
  return 0; // Якщо не знайдено
}

export default function CoinGrid({ coins }: CoinGridProps) {
  const [selectedRuler, setSelectedRuler] = useState<string | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<CoinType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [exportData, setExportData] = useState<string | null>(null);

  const rulerCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    coins.forEach(c => {
      if (c.ruler) counts[c.ruler] = (counts[c.ruler] || 0) + 1;
    });
    return counts;
  }, [coins]);

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

    // Сортуємо кожну групу за номіналом
    for (const key in groups) {
      groups[key].sort((a, b) => {
        // Спочатку пріоритет числовому значенню (якщо воно є від Numista)
        let valA = typeof a.value?.numeric === 'number' ? a.value.numeric : parseNominalValue(a.title || '');
        let valB = typeof b.value?.numeric === 'number' ? b.value.numeric : parseNominalValue(b.title || '');
        
        if (valA !== valB) return valA - valB;
        // Якщо номінали однакові, сортуємо за роком
        return (a.min_year || 0) - (b.min_year || 0);
      });
    }

    return groups;
  }, [coins, selectedRuler, searchQuery]);

  const handleExport = () => {
    if (!selectedRuler) return;
    
    let text = `Продаж монет епохи: ${selectedRuler}\n\n`;
    const groups = groupedAndFilteredCoins;
    
    // Сортуємо групи для красивого експорту
    const sortedKeys = Object.keys(groups).sort();
    
    sortedKeys.forEach(currency => {
      text += `=== ${currency.toUpperCase()} ===\n`;
      groups[currency].forEach(coin => {
        const yearStr = coin.min_year === coin.max_year ? coin.min_year : `${coin.min_year}-${coin.max_year}`;
        const material = coin.composition || 'Невідомий метал';
        text += `<strong>${coin.title}</strong> - ${material} - ${yearStr}\n`;
      });
      text += `\n`;
    });

    text += `Всі монети оригінальні. Деталі та додаткові фото в особисті повідомлення.`;
    setExportData(text);
  };

  if (!selectedRuler) {
    return (
      <div className="py-8">
        <h2 className="text-center text-3xl font-cinzel text-amber-900 mb-12 uppercase tracking-widest font-bold">
          Tsars and Emperors
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {RULERS.map((ruler) => {
            const count = rulerCounts[ruler.id] || 0;
            const isLocked = count === 0;

            return (
              <div 
                key={ruler.id} 
                onClick={() => !isLocked && setSelectedRuler(ruler.id)}
                className={`flex flex-col items-center group ${isLocked ? 'cursor-not-allowed opacity-60 grayscale' : 'cursor-pointer'}`}
              >
                <div className="relative w-40 h-48 mb-4 transition-transform duration-500 group-hover:scale-105">
                  <div className="absolute inset-0 rounded-t-full rounded-b-full border-[6px] border-amber-600/30 overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 rounded-t-full rounded-b-full border-4 border-amber-400 overflow-hidden m-1 bg-stone-800">
                      <Image 
                        src={ruler.img} 
                        alt={ruler.name} 
                        fill
                        className="object-cover object-[center_20%]" 
                      />
                    </div>
                  </div>
                  
                  {isLocked && (
                    <div className="absolute top-0 right-0 bg-stone-800 text-stone-200 p-2 rounded-full shadow-lg border border-stone-600 z-10">
                      <Lock size={16} />
                    </div>
                  )}

                  {!isLocked && (
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-800 text-amber-100 text-xs font-bold px-3 py-1 rounded-full border border-amber-400 shadow-md whitespace-nowrap">
                      {count} Монет
                    </div>
                  )}
                </div>
                
                <h3 className={`font-cinzel text-lg font-bold text-center mt-2 ${isLocked ? 'text-stone-500' : 'text-amber-600'}`}>
                  {ruler.name}
                </h3>
                <p className="text-xs text-stone-500 font-medium">
                  {ruler.reign}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const activeRuler = RULERS.find(r => r.id === selectedRuler);
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

      {/* Grouped List View */}
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
                <span className="bg-stone-200 text-stone-600 text-xs px-2 py-1 rounded-md font-bold">{groupedAndFilteredCoins[currency].length}</span>
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
                            <Image src={obverseSrc} alt="Аверс" fill className="object-cover" unoptimized />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs font-serif">Аверс</div>
                          )}
                        </div>
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border border-stone-200 bg-stone-100 shadow-sm group-hover:border-amber-300 transition-colors relative -ml-3 md:-ml-4 z-10">
                          {reverseSrc ? (
                            <Image src={reverseSrc} alt="Реверс" fill className="object-cover" unoptimized />
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
                          <span className="font-medium text-stone-600">{coin.composition || 'Невідомий метал'}</span> • {coin.min_year} {coin.max_year && coin.max_year !== coin.min_year ? `- ${coin.max_year}` : ''}
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
