'use client';

import { useState, useEffect, useCallback } from 'react';
import { CoinType } from '@/types/coin';

interface UseCoinCatalogReturn {
  coins: CoinType[];
  loading: boolean;
  error: string | null;
  source: 'cache' | 'api' | null;
  refresh: () => void;
}

export function useCoinCatalog(): UseCoinCatalogReturn {
  const [coins, setCoins] = useState<CoinType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'cache' | 'api' | null>(null);

  const fetchCoins = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const url = forceRefresh ? '/api/coins?refresh=true' : '/api/coins';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCoins(data.coins || []);
      setSource(data.source || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Невідома помилка');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoins();
  }, [fetchCoins]);

  return {
    coins,
    loading,
    error,
    source,
    refresh: () => fetchCoins(true),
  };
}
