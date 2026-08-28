'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CURRENCIES, Currency, convertCurrency, formatPrice } from '@/lib/currencies';

interface CurrencyContextType {
  currency: string;
  setCurrency: (c: string) => void;
  format: (amountRWF: number) => string;
  convert: (amountRWF: number) => number;
  currencies: Currency[];
  getCurrency: () => Currency;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<string>('RWF');

  useEffect(() => {
    const saved = localStorage.getItem('nmo_currency');
    if (saved && CURRENCIES.some((c) => c.code === saved)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrencyState(saved);
    }
  }, []);

  const setCurrency = (c: string) => {
    setCurrencyState(c);
    localStorage.setItem('nmo_currency', c);
  };

  const getCurrency = () => CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        format: (amountRWF: number) => formatPrice(amountRWF, currency),
        convert: (amountRWF: number) => convertCurrency(amountRWF, currency),
        currencies: CURRENCIES,
        getCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
