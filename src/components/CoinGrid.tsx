'use client';

import React, { useState, useMemo } from 'react';
import { CoinType } from '@/types/coin';
import Image from 'next/image';
import { ArrowLeft, Search, Lock } from 'lucide-react';
import CoinModal from './CoinModal';

interface CoinGridProps {
  coins: CoinType[];
  lang: 'AT' | 'EN' | 'UK';
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

const CURRENCY_ORDER = [
  'Pfennig',
  'Heller',
  'Filler',
  'Kreuzer',
  'Corona / Krone',
  'Forint',
  'Florin',
  'Gulden',
  'Thaler',
  'Ducat',
  'Sovrano',
  'Інше'
];

function sortCurrencies(a: string, b: string) {
  let idxA = CURRENCY_ORDER.indexOf(a);
  let idxB = CURRENCY_ORDER.indexOf(b);
  if (idxA === -1) idxA = 999;
  if (idxB === -1) idxB = 999;
  if (idxA !== idxB) return idxA - idxB;
  return a.localeCompare(b);
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

function translateMetal(composition: string | undefined, lang: 'AT' | 'EN' | 'UK'): string {
  if (!composition) return lang === 'AT' ? 'Unbekanntes Metall' : lang === 'EN' ? 'Unknown metal' : 'Невідомий метал';
  
  let comp = composition;
  // Copper / Bronze / Brass
  if (comp.match(/copper|cuivre/i)) comp = comp.replace(/copper|cuivre/ig, lang === 'AT' ? 'Kupfer' : lang === 'EN' ? 'Copper' : 'Мідь');
  if (comp.match(/bronze/i)) comp = comp.replace(/bronze/ig, lang === 'AT' ? 'Bronze' : lang === 'EN' ? 'Bronze' : 'Бронза');
  if (comp.match(/brass/i)) comp = comp.replace(/brass/ig, lang === 'AT' ? 'Messing' : lang === 'EN' ? 'Brass' : 'Латунь');
  
  // Silver / Billon
  if (comp.match(/silver|argent/i)) comp = comp.replace(/silver|argent/ig, lang === 'AT' ? 'Silber' : lang === 'EN' ? 'Silver' : 'Срібло');
  if (comp.match(/billon/i)) comp = comp.replace(/billon/ig, lang === 'AT' ? 'Billon' : lang === 'EN' ? 'Billon' : 'Білон');
  
  // Gold
  if (comp.match(/gold|or/i)) comp = comp.replace(/gold|or/ig, lang === 'AT' ? 'Gold' : lang === 'EN' ? 'Gold' : 'Золото');
  
  // Other metals
  if (comp.match(/nickel/i)) comp = comp.replace(/nickel/ig, lang === 'AT' ? 'Nickel' : lang === 'EN' ? 'Nickel' : 'Нікель');
  if (comp.match(/zinc/i)) comp = comp.replace(/zinc/ig, lang === 'AT' ? 'Zink' : lang === 'EN' ? 'Zinc' : 'Цинк');
  if (comp.match(/iron/i)) comp = comp.replace(/iron/ig, lang === 'AT' ? 'Eisen' : lang === 'EN' ? 'Iron' : 'Залізо');
  if (comp.match(/aluminum/i)) comp = comp.replace(/aluminum/ig, lang === 'AT' ? 'Aluminium' : lang === 'EN' ? 'Aluminum' : 'Алюміній');
  if (comp.match(/tin/i)) comp = comp.replace(/tin/ig, lang === 'AT' ? 'Zinn' : lang === 'EN' ? 'Tin' : 'Олово');
  
  return comp;
}

export default function CoinGrid({ coins, lang }: CoinGridProps) {
  const [selectedRuler, setSelectedRuler] = useState<string | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<CoinType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMetal, setSelectedMetal] = useState<'all' | 'gold' | 'silver' | 'copper'>('all');

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

    if (selectedMetal !== 'all') {
      result = result.filter(c => {
        const comp = (c.composition || '').toLowerCase();
        if (selectedMetal === 'gold') return comp.includes('gold') || comp.includes('or ') || comp === 'or';
        if (selectedMetal === 'silver') return comp.includes('silver') || comp.includes('argent') || comp.includes('billon');
        if (selectedMetal === 'copper') return comp.includes('copper') || comp.includes('cuivre') || comp.includes('bronze') || comp.includes('brass');
        return true;
      });
    }

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
                {count} {lang === 'AT' ? 'Münzen' : lang === 'EN' ? 'coins' : 'монет'}
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
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-600 mb-1">
              {lang === 'AT' ? 'Österreich' : lang === 'EN' ? 'Austria' : 'Австрія'}
            </p>
            <h2 className="text-2xl md:text-3xl font-cinzel text-amber-900 uppercase tracking-widest font-bold">
              {lang === 'AT' ? 'Habsburgermonarchie' : lang === 'EN' ? 'Habsburg Monarchy' : 'Австрійська Монархія'}
            </h2>
            <p className="text-stone-500 text-sm mt-1">
              {lang === 'AT' ? 'Erzherzöge & Römisch-Deutsche Kaiser' : lang === 'EN' ? 'Habsburg Archdukes & Holy Roman Emperors' : 'Ерцгерцоги та Імператори Священної Римської імперії'}
            </p>
            <div className="h-px w-48 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6 max-w-5xl mx-auto">
            {RULERS_HABSBURG.map(ruler => <RulerCard key={ruler.id} ruler={ruler} />)}
          </div>
        </section>

        {/* === Австро-Угорська монархія === */}
        <section>
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-600 mb-1">
              {lang === 'AT' ? 'Österreich-Ungarn' : lang === 'EN' ? 'Austria-Hungary' : 'Австро-Угорщина'}
            </p>
            <h2 className="text-2xl md:text-3xl font-cinzel text-amber-900 uppercase tracking-widest font-bold">
              {lang === 'AT' ? 'Österreichisch-Ungarische Monarchie' : lang === 'EN' ? 'Austro-Hungarian Empire' : 'Австро-Угорська Імперія'}
            </h2>
            <p className="text-stone-500 text-sm mt-1">
              {lang === 'AT' ? 'Kaiser von Österreich & Könige von Ungarn' : lang === 'EN' ? 'Emperors of Austria & Kings of Hungary' : 'Імператори Австрії та Королі Угорщини'}
            </p>
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

  const groupKeys = Object.keys(groupedAndFilteredCoins).sort(sortCurrencies);
  const totalCoins = groupKeys.reduce((acc, key) => acc + groupedAndFilteredCoins[key].length, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 bg-stone-900 p-4 rounded-t-2xl shadow-xl border-b-4 border-amber-500 relative overflow-hidden">
        <button
          onClick={() => setSelectedRuler(null)}
          className="text-amber-400 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2.5 rounded-full relative z-10"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="flex-1 text-center relative z-10 pr-12">
          <h2 className="text-2xl font-cinzel text-amber-500 font-bold uppercase tracking-widest">
            {activeRuler?.name}
          </h2>
          <p className="text-amber-100/90 font-medium tracking-widest text-sm mt-0.5">{activeRuler?.reign}</p>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 px-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={lang === 'AT' ? 'Suche (z.B. 10 Heller)...' : lang === 'EN' ? 'Search (e.g. 10 Heller)...' : 'Пошук (напр. 10 Heller)...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 shadow-sm
                       bg-white text-stone-700 placeholder-stone-400
                       focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
          <button 
            onClick={() => setSelectedMetal('all')}
            className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${selectedMetal === 'all' ? 'bg-stone-600 text-white' : 'bg-white text-stone-600 border border-stone-200'}`}
          >
            {lang === 'AT' ? 'Alle' : lang === 'EN' ? 'All' : 'Всі'}
          </button>
          <button 
            onClick={() => setSelectedMetal('gold')}
            className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors shadow-sm ${selectedMetal === 'gold' ? 'bg-yellow-500 text-white border-transparent' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}
          >
            {lang === 'AT' ? 'Gold' : lang === 'EN' ? 'Gold' : 'Золото'}
          </button>
          <button 
            onClick={() => setSelectedMetal('silver')}
            className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors shadow-sm ${selectedMetal === 'silver' ? 'bg-slate-400 text-white border-transparent' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
          >
            {lang === 'AT' ? 'Silber' : lang === 'EN' ? 'Silver' : 'Срібло'}
          </button>
          <button 
            onClick={() => setSelectedMetal('copper')}
            className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors shadow-sm ${selectedMetal === 'copper' ? 'bg-orange-700 text-white border-transparent' : 'bg-orange-50 text-orange-800 border-orange-200'}`}
          >
            {lang === 'AT' ? 'Kupfer' : lang === 'EN' ? 'Copper' : 'Мідь'}
          </button>
        </div>

        <div className="bg-amber-100 text-amber-900 px-4 py-3 rounded-xl font-medium text-sm border border-amber-200 shadow-sm whitespace-nowrap flex-shrink-0 text-center">
          {lang === 'AT' ? 'Gesamt: ' : lang === 'EN' ? 'Total: ' : 'Всього: '} {totalCoins}
        </div>
      </div>

      {/* Grouped List */}
      <div className="space-y-8">
        {groupKeys.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-stone-400 shadow-sm border border-stone-200">
            <p>{lang === 'AT' ? 'Keine Münzen gefunden' : lang === 'EN' ? 'No coins found' : 'Монет не знайдено'}</p>
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
                          <span className="font-medium text-stone-600">{translateMetal(coin.composition, lang)}</span>
                          {' • '}
                          {coin.min_year}
                          {coin.max_year && coin.max_year !== coin.min_year ? ` - ${coin.max_year}` : ''}
                        </p>
                      </div>

                      {/* Status / Weight */}
                      <div className="shrink-0 text-right ml-4 flex flex-col items-end gap-1">
                        <div className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest border ${
                          coin.rarity === 'unique' ? 'bg-purple-50 text-purple-700 border-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]' :
                          coin.rarity === 'very_rare' ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-[0_0_8px_rgba(225,29,72,0.25)]' :
                          coin.rarity === 'rare' ? 'bg-amber-50 text-amber-700 border-amber-400 shadow-[0_0_8px_rgba(217,119,6,0.25)]' :
                          coin.rarity === 'uncommon' ? 'bg-sky-50 text-sky-700 border-sky-300' :
                          'bg-stone-100 text-stone-500 border-stone-200'
                        }`}>
                          {coin.rarity === 'unique' ? (lang === 'AT' ? 'Unikat' : lang === 'EN' ? 'Unique' : 'Унікальна') :
                            coin.rarity === 'very_rare' ? (lang === 'AT' ? 'Sehr selten' : lang === 'EN' ? 'Very Rare' : 'Дуже Рідкісна') :
                              coin.rarity === 'rare' ? (lang === 'AT' ? 'Selten' : lang === 'EN' ? 'Rare' : 'Рідкісна') :
                                coin.rarity === 'uncommon' ? (lang === 'AT' ? 'Ungewöhnlich' : lang === 'EN' ? 'Uncommon' : 'Нечаста') : 
                                (lang === 'AT' ? 'Häufig' : lang === 'EN' ? 'Common' : 'Часта')}
                        </div>
                        {coin.weight && <div className="text-xs text-stone-400">{coin.weight} {lang === 'EN' ? 'g' : 'г'}</div>}
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
