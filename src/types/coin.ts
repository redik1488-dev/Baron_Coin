// types/coin.ts
// NOTE: All fields are normalized to simple types BEFORE being stored.
// Normalization from raw Numista API objects happens in coinService.ts.

export type Rarity = 'common' | 'uncommon' | 'rare' | 'very_rare' | 'unique';

export interface CoinImage {
  obverse?: string;
  reverse?: string;
  edge?: string;
}

export interface CoinIssue {
  id: number;
  year?: number;
  gregorian_year?: number;
  mint_letter?: string;
  mintage?: number;
  comment?: string;
  is_dated?: boolean;
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
  composition?: string;
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
  edge?: string;
  demonetized?: boolean;
  tags?: string[];
  category?: string;
  // Derived fields
  rarity?: Rarity;
  ruler?: string;
  cachedAt?: number;
  issues?: CoinIssue[];
}

// Raw type as it comes from the Numista API (polymorphic fields)
// This is only used internally in coinService.ts for normalization.
export interface NumistaRawCoin {
  id: string | number;
  title?: string | { text?: string; [key: string]: any };
  min_year?: number;
  max_year?: number;
  issuer?: { name?: string; code?: string };
  category?: string;
  composition?: string | { text?: string; id?: number; [key: string]: any };
  type?: string | { text?: string; [key: string]: any };
  series?: string | { text?: string; [key: string]: any };
  image?: CoinImage;
  obverse_thumbnail?: string;
  reverse_thumbnail?: string;
  value?: {
    text?: string | { text?: string; [key: string]: any };
    numeric?: number;
    currency?: { name?: string };
  };
  weight?: number;
  size?: number;
  shape?: string | { text?: string; [key: string]: any };
  edge?: string | { text?: string; [key: string]: any };
  demonetized?: boolean;
  tags?: string[];
  [key: string]: any;
}

export interface NumistaSearchResponse {
  count: number;
  types: NumistaRawCoin[];
}

export interface CachedData<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
}
