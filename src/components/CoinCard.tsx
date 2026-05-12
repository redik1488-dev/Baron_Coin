// components/CoinCard.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { CoinType } from '@/types/coin';
import RarityBadge from './RarityBadge';
import { Calendar, Layers, Coins } from 'lucide-react';

interface CoinCardProps {
  coin: CoinType;
  onClick?: (coin: CoinType) => void;
  index?: number;
}

const FALLBACK_IMAGE = '/coin-placeholder.svg';

export default function CoinCard({ coin, onClick, index = 0 }: CoinCardProps) {
  const [imgSrc, setImgSrc] = useState<string>(
    coin.obverse_thumbnail || coin.reverse_thumbnail || coin.image?.obverse || coin.image?.reverse || FALLBACK_IMAGE
  );
  const [imgError, setImgError] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const yearRange =
    coin.min_year && coin.max_year
      ? coin.min_year === coin.max_year
        ? `${coin.min_year}`
        : `${coin.min_year} – ${coin.max_year}`
      : coin.min_year
      ? `${coin.min_year}+`
      : 'Невідомо';

  const metalInfo = coin.composition || coin.type || 'Не вказано';
  const series = coin.series || coin.issuer?.name || 'Австро-Угорська Монархія';
  const faceValue = coin.value?.text || coin.title || '';

  // Toggle obverse/reverse on click
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const reverseSrc = coin.reverse_thumbnail || coin.image?.reverse;
    const obverseSrc = coin.obverse_thumbnail || coin.image?.obverse;
    
    if (reverseSrc && reverseSrc !== obverseSrc) {
      setIsFlipped((prev) => !prev);
      setImgSrc(
        isFlipped
          ? obverseSrc || FALLBACK_IMAGE
          : reverseSrc || FALLBACK_IMAGE
      );
    }
  };

  const animStyle = {
    animationDelay: `${index * 60}ms`,
  };

  return (
    <article
      className="coin-card group relative bg-white rounded-2xl overflow-hidden cursor-pointer
                 border border-amber-100 hover:border-amber-300
                 shadow-coin hover:shadow-coin-hover
                 transition-all duration-400 ease-out
                 hover:-translate-y-2
                 animate-slide-up opacity-0"
      style={animStyle}
      onClick={() => onClick?.(coin)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(coin)}
      aria-label={`Монета: ${coin.title}`}
    >
      {/* Top gold accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 opacity-80" />

      {/* Image area */}
      <div
        className="relative flex items-center justify-center bg-gradient-to-b from-stone-50 to-amber-50/40 pt-6 pb-4 px-4"
        onClick={handleImageClick}
        title={coin.image?.reverse ? 'Клікни для перегортання' : ''}
      >
        {/* Decorative ring */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full border-2 border-amber-200 scale-110
                          group-hover:border-amber-400 transition-colors duration-300"
          />
          <div
            className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-amber-100
                          group-hover:border-amber-300 transition-all duration-300
                          shadow-lg group-hover:shadow-xl"
          >
            {!imgError ? (
              <Image
                src={imgSrc}
                alt={coin.title || 'Монета'}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                onError={() => {
                  setImgError(true);
                  setImgSrc(FALLBACK_IMAGE);
                }}
                unoptimized
              />
            ) : (
              // Placeholder when no image
              <div className="w-full h-full flex items-center justify-center bg-amber-50">
                <svg viewBox="0 0 100 100" className="w-20 h-20 text-amber-300">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
                  <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
                  <text x="50" y="55" textAnchor="middle" fontSize="14" fill="currentColor" fontFamily="serif">
                    ☆
                  </text>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Flip indicator */}
        {(coin.reverse_thumbnail || coin.image?.reverse) && (coin.reverse_thumbnail || coin.image?.reverse) !== (coin.obverse_thumbnail || coin.image?.obverse) && (
          <span className="absolute bottom-2 right-3 text-[10px] text-amber-500/70 font-medium italic">
            {isFlipped ? '← Аверс' : 'Реверс →'}
          </span>
        )}

        {/* Rarity badge — absolute top-right */}
        <div className="absolute top-3 right-3">
          <RarityBadge rarity={coin.rarity || 'common'} />
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-5 pt-2 space-y-3">
        {/* Title */}
        <div>
          <h3 className="font-serif text-lg font-bold text-stone-800 leading-tight line-clamp-2 group-hover:text-amber-800 transition-colors">
            {coin.title || 'Монета без назви'}
          </h3>
          {faceValue && faceValue !== coin.title && (
            <p className="text-xs text-amber-700 font-medium mt-0.5">{faceValue}</p>
          )}
        </div>

        {/* Meta info */}
        <div className="space-y-1.5">
          {/* Years */}
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <Calendar size={13} className="text-amber-600 shrink-0" />
            <span className="font-medium">{yearRange}</span>
          </div>

          {/* Metal/Composition */}
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <Layers size={13} className="text-amber-600 shrink-0" />
            <span className="line-clamp-1" title={metalInfo}>{metalInfo}</span>
          </div>

          {/* Series/Issuer */}
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <Coins size={13} className="text-amber-600 shrink-0" />
            <span className="line-clamp-1 italic text-xs" title={series}>{series}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-amber-100 pt-3">
          {coin.weight && (
            <p className="text-xs text-stone-400">
              {coin.weight}г · {coin.size}мм · {coin.shape || 'Round'}
            </p>
          )}
        </div>
      </div>

      {/* Hover glow overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(184,146,42,0.06) 0%, transparent 70%)',
        }}
      />
    </article>
  );
}
