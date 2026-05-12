// types/coin.ts

export type Rarity = 'common' | 'uncommon' | 'rare' | 'very_rare' | 'unique';

export interface CoinImage {
  obverse?: string;
  reverse?: string;
  edge?: string;
}

export interface CoinType {
  id: string | number;
  title: string;
  min_year?: number;
  max_year?: number;
  issuer?: {
    name: string;
    code?: string;
  };
  composition?: string | { text?: string; id?: number };
  type?: string;
  series?: string;
  image?: CoinImage;
  obverse_thumbnail?: string;
  reverse_thumbnail?: string;
  value?: {
    text?: string;
    numeric?: number;
    currency?: {
      name: string;
    };
  };
  weight?: number;
  size?: number;
  shape?: string;
  demonetized?: boolean;
  tags?: string[];
  // Derived fields
  rarity?: Rarity;
  ruler?: string;
  category?: string;
  cachedAt?: number;
}

export interface NumistaSearchResponse {
  count: number;
  types: CoinType[];
}

export interface CachedData<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
}
